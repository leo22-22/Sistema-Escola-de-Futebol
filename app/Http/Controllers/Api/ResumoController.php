<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Evento;
use Illuminate\Http\Request;

class ResumoController extends Controller
{
    public function show(Request $r, Evento $evento)
    {
        $this->exigirVisaoEvento($r, $evento);
        abort_unless($evento->encerrado(), 422, 'A partida ainda não foi encerrada.');

        $lances = $evento->lances()->with(['aluno:id,nome', 'assistencia:id,nome'])->get();
        $nomes = $evento->alunos()->withTrashed()->get(['alunos.id', 'alunos.nome'])->pluck('nome', 'id');
        $participantes = $evento->alunos()->wherePivot('participou', true)->get();

        $contar = function (string $campo) use ($lances) {
            return $lances->where('tipo', 'gol')->whereNotNull($campo)->groupBy($campo)
                ->map(fn ($g, $id) => ['aluno_id' => (int) $id, 'total' => $g->count()])->sortByDesc('total')->values();
        };

        return response()->json([
            'evento' => ['id' => $evento->id, 'titulo' => $evento->tituloExibicao(), 'data' => $evento->data->toDateString(), 'modalidade' => $evento->modalidade, 'local' => $evento->local],
            'times' => ['a' => $evento->ehJogo() ? config('escolinha.nome_curto') : 'Time A', 'b' => $evento->ehJogo() ? $evento->adversario : 'Time B'],
            'placar' => ['a' => $evento->placar_casa, 'b' => $evento->placar_fora],
            'conta_na_carta' => $evento->conta_na_carta,
            'estatisticas' => $evento->estatisticas,
            'gols' => $contar('aluno_id')->map(fn ($x) => $x + ['nome' => $nomes[$x['aluno_id']] ?? null]),
            'assistencias' => $contar('assistencia_id')->map(fn ($x) => $x + ['nome' => $nomes[$x['aluno_id']] ?? null]),
            'minutos' => $participantes->map(fn ($a) => ['aluno_id' => $a->id, 'nome' => $a->nome, 'minutos' => (int) $a->pivot->minutos])->sortByDesc('minutos')->values(),
            'linha_do_tempo' => $lances->where('tipo', '!=', 'chute')->map(fn ($l) => [
                'minuto' => $l->minuto,
                'tipo' => $l->tipo,
                'time' => $l->time,
                'detalhe' => $l->detalhe,
                'aluno' => $l->aluno?->nome,
                'assistencia' => $l->assistencia?->nome,
                'sai' => $l->sai_id ? ($nomes[$l->sai_id] ?? null) : null,
                'entra' => $l->entra_id ? ($nomes[$l->entra_id] ?? null) : null,
            ])->values(),
            'observacao_professor' => $r->user()->ehGestor() ? $evento->observacao_professor : null,
        ]);
    }
}
