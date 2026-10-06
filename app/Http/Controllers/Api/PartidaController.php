<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\IniciarPartidaRequest;
use App\Models\Evento;
use App\Models\Partida;
use App\Services\Agenda;
use App\Services\PartidaAoVivo;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PartidaController extends Controller
{
    public function __construct(private PartidaAoVivo $motor, private Agenda $agenda) {}

    /** Placar ao vivo: professor e também alunos/famílias da categoria. */
    public function show(Request $r, Evento $evento)
    {
        $this->exigirVisaoEvento($r, $evento);
        $p = $evento->partida;
        abort_unless($p, 404, 'Nenhuma partida em andamento para este evento.');

        return response()->json($this->motor->publico($p));
    }

    public function iniciar(IniciarPartidaRequest $r, Evento $evento)
    {
        $this->exigirGestaoEvento($r, $evento);
        $p = $this->motor->iniciar($evento, $r->validated(), $r->user());

        return response()->json($this->motor->publico($p), 201);
    }

    public function acao(Request $r, Evento $evento)
    {
        $this->exigirGestaoEvento($r, $evento);
        $d = $r->validate([
            'acao' => ['required', Rule::in(['cronometro', 'fim_tempo', 'segundo_tempo', 'gol', 'chute', 'escanteio', 'falta', 'cartao', 'defesa', 'penalti_defendido', 'substituicao', 'entrar', 'adicionar', 'remover_lance', 'desfazer'])],
            'time' => ['nullable', Rule::in(['a', 'b'])],
            'comando' => ['nullable', Rule::in(['iniciar', 'pausar', 'ajustar'])],
            'segundos' => ['nullable', 'integer', 'between:-600,600'],
            'aluno_id' => ['nullable', 'integer'],
            'assistencia_id' => ['nullable', 'integer'],
            'sai_id' => ['nullable', 'integer'],
            'entra_id' => ['nullable', 'integer'],
            'detalhe' => ['nullable', Rule::in(PartidaAoVivo::DETALHES_GOL)],
            'no_gol' => ['nullable', 'boolean'],
            'cor' => ['nullable', Rule::in(['amarelo', 'vermelho'])],
            'lance_id' => ['nullable', 'string'],
            // Fila offline: id único da ação (evita aplicar duas vezes) e quando ela aconteceu (ms)
            'acao_id' => ['nullable', 'string', 'max:40', 'regex:/^[A-Za-z0-9_-]+$/'],
            'em' => ['nullable', 'integer', 'min:0'],
        ]);
        $p = $this->partida($evento);
        $p = $this->motor->executar($p, $d['acao'], $d, $r->user());

        return response()->json($this->motor->publico($p));
    }

    public function encerrar(Request $r, Evento $evento)
    {
        $this->exigirGestaoEvento($r, $evento);
        $d = $r->validate(['conta_na_carta' => ['required', 'boolean'], 'observacao' => ['nullable', 'string', 'max:2000'], 'em' => ['nullable', 'integer', 'min:0']]);
        // Reenvio da fila offline depois que a partida já foi salva
        if (! $evento->partida && $evento->encerrado()) {
            return response()->json(['mensagem' => 'Partida salva.', 'evento_id' => $evento->id, 'placar' => ['casa' => $evento->placar_casa, 'fora' => $evento->placar_fora]]);
        }
        $evento = $this->motor->encerrar($this->partida($evento), (bool) $d['conta_na_carta'], $d['observacao'] ?? null, $d['em'] ?? null);

        return response()->json(['mensagem' => 'Partida salva.', 'evento_id' => $evento->id, 'placar' => ['casa' => $evento->placar_casa, 'fora' => $evento->placar_fora]]);
    }

    public function descartar(Request $r, Evento $evento)
    {
        $this->exigirGestaoEvento($r, $evento);
        $this->partida($evento)->delete();

        return response()->json(['mensagem' => 'Partida descartada. Nada foi salvo.']);
    }

    /** Cria o evento "de agora" e devolve para o app abrir a escalação. */
    public function rapida(Request $r)
    {
        $d = $r->validate([
            'categoria_id' => ['required', 'exists:categorias,id'],
            'modalidade' => ['required', Rule::in(['Coletivo', 'Amistoso', 'Teste'])],
            'adversario' => ['required_unless:modalidade,Coletivo', 'nullable', 'string', 'max:120'],
            'local' => ['nullable', 'string', 'max:160'],
        ]);
        $this->exigirGestaoCategoria($r, (int) $d['categoria_id']);
        $evento = $this->agenda->partidaRapida($d, $r->user());

        return response()->json(['evento_id' => $evento->id, 'mensagem' => 'Partida criada. Agora escale os times.'], 201);
    }

    private function partida(Evento $evento): Partida
    {
        $p = $evento->partida;
        abort_unless($p, 404, 'Nenhuma partida em andamento para este evento.');

        return $p;
    }
}
