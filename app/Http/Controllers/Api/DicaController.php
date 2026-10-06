<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Aluno;
use App\Models\Dica;
use App\Services\Notificador;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DicaController extends Controller
{
    public function __construct(private Notificador $notificador) {}

    /** Professor: histórico com filtros. Aluno/responsável: as dicas dele (marca como lidas). */
    public function index(Request $r)
    {
        $r->validate(['aluno_id' => ['nullable', 'integer'], 'tipo' => ['nullable', Rule::in(Dica::TIPOS)]]);
        $ids = $r->user()->alunosVisiveisIds();
        if ($r->filled('aluno_id')) {
            abort_unless(in_array($r->integer('aluno_id'), $ids, true), 403);
            $ids = [$r->integer('aluno_id')];
        }
        $q = Dica::with('aluno:id,nome', 'evento:id,titulo,adversario,grupo,data', 'lousa:id,nome')->whereIn('aluno_id', $ids)
            ->when($r->filled('tipo'), fn ($w) => $w->where('tipo', $r->input('tipo')))
            ->orderByDesc('fixada')->latest();
        $dicas = $q->limit(200)->get();

        if (! $r->user()->ehGestor()) {
            Dica::whereIn('id', $dicas->whereNull('lida_em')->pluck('id'))->update(['lida_em' => now()]);
        }

        return $dicas;
    }

    /** modo: um | varios | categoria */
    public function store(Request $r)
    {
        $d = $r->validate([
            'modo' => ['required', Rule::in(['um', 'varios', 'categoria'])],
            'alunos' => ['required_unless:modo,categoria', 'array'],
            'alunos.*' => ['integer', 'exists:alunos,id'],
            'categoria_id' => ['required_if:modo,categoria', 'nullable', 'exists:categorias,id'],
            'tipo' => ['required', Rule::in(Dica::TIPOS)],
            'texto' => ['required', 'string', 'max:1000'],
            'evento_id' => ['nullable', 'exists:eventos,id'],
            'lousa_id' => ['nullable', 'exists:lousas,id'],
            'fixar' => ['nullable', 'boolean'],
        ]);
        $alunos = $d['modo'] === 'categoria'
            ? Aluno::where('categoria_id', $d['categoria_id'])->get()
            : Aluno::whereIn('id', $d['alunos'])->get();
        abort_if($alunos->isEmpty(), 422, 'Escolha pelo menos um aluno.');
        $alunos->pluck('categoria_id')->unique()->each(fn ($c) => $this->exigirGestaoCategoria($r, (int) $c));

        foreach ($alunos as $a) {
            if (! empty($d['fixar'])) {
                $a->dicas()->update(['fixada' => false]);
            }
            $a->dicas()->create([
                'professor_id' => $r->user()->id,
                'tipo' => $d['tipo'],
                'texto' => trim($d['texto']),
                'evento_id' => $d['evento_id'] ?? null,
                'lousa_id' => $d['lousa_id'] ?? null,
                'fixada' => ! empty($d['fixar']),
            ]);
        }
        $this->notificador->alunos($alunos, 'Nova dica do professor', $d['tipo'], 'dica');

        return response()->json(['mensagem' => 'Dica enviada para '.($alunos->count() === 1 ? $alunos->first()->primeiroNome() : $alunos->count().' alunos').'.'], 201);
    }

    public function fixar(Request $r, Dica $dica)
    {
        $this->exigirGestaoAluno($r, $dica->aluno);
        if (! $dica->fixada) {
            Dica::where('aluno_id', $dica->aluno_id)->update(['fixada' => false]);
        }
        $dica->update(['fixada' => ! $dica->fixada]);

        return $dica;
    }

    public function entendida(Request $r, Dica $dica)
    {
        $this->exigirVisaoAluno($r, $dica->aluno);
        abort_if($r->user()->ehGestor(), 403, 'Só o aluno marca a dica como entendida.');
        $dica->update(['entendida_em' => now(), 'lida_em' => $dica->lida_em ?? now()]);

        return response()->json(['mensagem' => 'O professor vai ver que você entendeu.']);
    }

    public function destroy(Request $r, Dica $dica)
    {
        $this->exigirGestaoAluno($r, $dica->aluno);
        $dica->delete();

        return response()->noContent();
    }
}
