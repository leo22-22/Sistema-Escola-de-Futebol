<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\EventoRequest;
use App\Http\Resources\EventoResource;
use App\Models\Aluno;
use App\Models\Evento;
use App\Services\Agenda;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EventoController extends Controller
{
    public function __construct(private Agenda $agenda) {}

    /** Filtros: categoria_id, de, ate (Y-m-d), grupo (treino|jogo). */
    public function index(Request $r)
    {
        $r->validate(['categoria_id' => ['nullable', 'integer'], 'de' => ['nullable', 'date'], 'ate' => ['nullable', 'date'], 'grupo' => ['nullable', Rule::in(['treino', 'jogo'])]]);
        $cats = $r->user()->categoriaIdsVisiveis();
        if ($r->filled('categoria_id')) {
            $this->exigirVisaoCategoria($r, $r->integer('categoria_id'));
            $cats = [$r->integer('categoria_id')];
        }
        $q = Evento::with(['categoria', 'alunos:id,nome', 'partida:id,evento_id'])->whereIn('categoria_id', $cats);
        $q->where('data', '>=', $r->input('de', today()->subDays(30)->toDateString()));
        $q->where('data', '<=', $r->input('ate', today()->addDays(60)->toDateString()));
        if ($r->filled('grupo')) {
            $q->where('grupo', $r->input('grupo'));
        }

        return EventoResource::collection($q->orderBy('data')->orderBy('hora_inicio')->get());
    }

    public function show(Request $r, Evento $evento)
    {
        $this->exigirVisaoEvento($r, $evento);

        return new EventoResource($evento->load('categoria', 'alunos:id,nome', 'partida:id,evento_id'));
    }

    /** Presença e convocação detalhadas (professor). */
    public function presenca(Request $r, Evento $evento)
    {
        $this->exigirGestaoEvento($r, $evento);
        $vinculos = $evento->alunos()->get()->keyBy('id');

        return Aluno::where('categoria_id', $evento->categoria_id)->orderBy('nome')->get()->map(fn (Aluno $a) => [
            'id' => $a->id,
            'nome' => $a->nome,
            'posicoes' => $a->posicoes,
            'convocado' => (bool) ($vinculos[$a->id]->pivot->convocado ?? false),
            'confirmacao' => $vinculos[$a->id]->pivot->confirmacao ?? null,
            'chamada' => $vinculos[$a->id]->pivot->chamada ?? null,
        ]);
    }

    public function store(EventoRequest $r)
    {
        $this->exigirGestaoCategoria($r, $r->integer('categoria_id'));
        $eventos = $this->agenda->criar($r->validated(), $r->user());

        return EventoResource::collection($eventos->each->load('categoria'))->response()->setStatusCode(201);
    }

    public function update(EventoRequest $r, Evento $evento)
    {
        $this->exigirGestaoEvento($r, $evento);
        $this->exigirGestaoCategoria($r, $r->integer('categoria_id'));
        abort_if($evento->encerrado(), 422, 'Eventos encerrados não podem ser editados.');

        return new EventoResource($this->agenda->atualizar($evento, $r->validated())->load('categoria'));
    }

    public function destroy(Request $r, Evento $evento)
    {
        $this->exigirGestaoEvento($r, $evento);
        abort_if($evento->encerrado(), 422, 'Eventos encerrados ficam no histórico. Cancele em vez de excluir.');
        $evento->delete();

        return response()->noContent();
    }

    public function cancelar(Request $r, Evento $evento)
    {
        $this->exigirGestaoEvento($r, $evento);
        $d = $r->validate(['motivo' => ['required', 'string', 'max:200'], 'serie' => ['nullable', 'boolean']]);
        $total = $this->agenda->cancelar($evento, $d['motivo'], (bool) ($d['serie'] ?? false));

        return response()->json(['mensagem' => $total > 1 ? "{$total} eventos cancelados." : 'Cancelado.', 'total' => $total]);
    }

    public function reativar(Request $r, Evento $evento)
    {
        $this->exigirGestaoEvento($r, $evento);

        return new EventoResource($this->agenda->reativar($evento)->load('categoria'));
    }

    public function duplicar(Request $r, Evento $evento)
    {
        $this->exigirGestaoEvento($r, $evento);

        return (new EventoResource($this->agenda->duplicar($evento, $r->user())->load('categoria')))->response()->setStatusCode(201);
    }

    public function convocar(Request $r, Evento $evento)
    {
        $this->exigirGestaoEvento($r, $evento);
        $d = $r->validate(['alunos' => ['present', 'array'], 'alunos.*' => ['integer']]);
        $total = $this->agenda->convocar($evento, $d['alunos']);

        return response()->json(['mensagem' => "{$total} convocados.", 'total' => $total]);
    }

    public function chamada(Request $r, Evento $evento)
    {
        $this->exigirGestaoEvento($r, $evento);
        $d = $r->validate(['chamada' => ['required', 'array'], 'chamada.*' => [Rule::in(['presente', 'falta', 'justificada'])]]);
        $presentes = $this->agenda->chamada($evento, $d['chamada']);

        return response()->json(['mensagem' => "Chamada salva: {$presentes} presentes.", 'presentes' => $presentes]);
    }

    public function chamadaRapida(Request $r, Evento $evento)
    {
        $this->exigirGestaoEvento($r, $evento);
        $presentes = $this->agenda->chamadaRapida($evento);

        return response()->json(['mensagem' => "Chamada feita: {$presentes} presentes.", 'presentes' => $presentes]);
    }

    public function lembrete(Request $r, Evento $evento)
    {
        $this->exigirGestaoEvento($r, $evento);
        $total = $this->agenda->lembrete($evento);

        return response()->json(['mensagem' => $total ? "Lembrete enviado para {$total} alunos sem resposta." : 'Todos já responderam.', 'total' => $total]);
    }

    /** Aluno ou responsável: vai / não vai. No coletivo, "vai" coloca o aluno na lista. */
    public function confirmar(Request $r, Evento $evento)
    {
        $d = $r->validate(['aluno_id' => ['required', 'integer', 'exists:alunos,id'], 'status' => ['required', Rule::in(['vai', 'nao_vai'])]]);
        $aluno = Aluno::findOrFail($d['aluno_id']);
        $this->exigirVisaoAluno($r, $aluno);
        abort_unless((int) $aluno->categoria_id === (int) $evento->categoria_id, 422, 'Este evento é de outra categoria.');
        $this->agenda->confirmar($evento, $aluno, $d['status']);

        $msg = $d['status'] === 'vai'
            ? ($evento->ehColetivo() ? 'Presença confirmada. Você está no coletivo.' : 'Presença confirmada.')
            : 'Tudo bem, o professor vai saber.';

        return response()->json(['mensagem' => $msg]);
    }
}
