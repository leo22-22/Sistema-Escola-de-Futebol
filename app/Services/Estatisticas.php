<?php

namespace App\Services;

use App\Models\Aluno;
use App\Models\Lance;
use Illuminate\Support\Facades\DB;

class Estatisticas
{
    /**
     * Números da carta. Só entram partidas encerradas com "contar na carta".
     *
     * @return array{jogos:int,minutos:int,gols:int,gols_falta:int,assistencias:int,penaltis_defendidos:int,jogos_sem_sofrer:int,amarelos:int,treinos:int,faltas_treino:int,promovido:bool}
     */
    public function doAluno(Aluno $aluno): array
    {
        $participacoes = DB::table('evento_aluno as ea')
            ->join('eventos as e', 'e.id', '=', 'ea.evento_id')
            ->where('ea.aluno_id', $aluno->id)
            ->where('ea.participou', true)
            ->whereNotNull('e.encerrado_em')
            ->where('e.conta_na_carta', true)
            ->get(['e.id', 'e.grupo', 'e.placar_fora', 'ea.minutos']);

        $idsEventos = $participacoes->pluck('id')->all();
        $defensivo = collect($aluno->posicoes ?? [])->contains(fn ($p) => in_array($p, ['GOL', 'ZAG', 'LD', 'LE', 'VOL'], true));

        $s = [
            'jogos' => $participacoes->count(),
            'minutos' => (int) $participacoes->sum('minutos'),
            'gols' => 0,
            'gols_falta' => 0,
            'assistencias' => 0,
            'penaltis_defendidos' => 0,
            'jogos_sem_sofrer' => $defensivo ? $participacoes->where('grupo', 'jogo')->filter(fn ($p) => (int) $p->placar_fora === 0)->count() : 0,
            'amarelos' => 0,
            'treinos' => (int) $aluno->treinos_base,
            'faltas_treino' => 0,
            'promovido' => (bool) $aluno->promovido,
        ];

        if ($idsEventos) {
            $lances = Lance::whereIn('evento_id', $idsEventos)
                ->where(fn ($q) => $q->where('aluno_id', $aluno->id)->orWhere('assistencia_id', $aluno->id))
                ->get(['tipo', 'aluno_id', 'assistencia_id', 'detalhe']);
            foreach ($lances as $l) {
                if ($l->tipo === 'gol' && $l->aluno_id === $aluno->id) {
                    $s['gols']++;
                    if ($l->detalhe === 'falta') {
                        $s['gols_falta']++;
                    }
                }
                if ($l->tipo === 'gol' && $l->assistencia_id === $aluno->id) {
                    $s['assistencias']++;
                }
                if ($l->tipo === 'penalti_defendido' && $l->aluno_id === $aluno->id) {
                    $s['penaltis_defendidos']++;
                }
                if ($l->tipo === 'amarelo' && $l->aluno_id === $aluno->id) {
                    $s['amarelos']++;
                }
            }
        }

        $chamadas = DB::table('evento_aluno as ea')
            ->join('eventos as e', 'e.id', '=', 'ea.evento_id')
            ->where('ea.aluno_id', $aluno->id)
            ->where('e.grupo', 'treino')
            ->whereNull('e.cancelado_em')
            ->whereNotNull('ea.chamada')
            ->selectRaw('ea.chamada, count(*) as total')
            ->groupBy('ea.chamada')
            ->pluck('total', 'chamada');
        $s['treinos'] += (int) ($chamadas['presente'] ?? 0);
        $s['faltas_treino'] = (int) ($chamadas['falta'] ?? 0);

        return $s;
    }

    /** @return array{nivel:string,cor:string,proximo:?array} */
    public function nivel(array $s): array
    {
        $prata = (int) config('escolinha.carta.prata', 10);
        $ouro = (int) config('escolinha.carta.ouro', 25);
        if ($s['treinos'] >= $ouro) {
            return ['nivel' => 'ouro', 'cor' => '#F7C600', 'proximo' => null];
        }
        if ($s['treinos'] >= $prata) {
            return ['nivel' => 'prata', 'cor' => '#C9CCD1', 'proximo' => ['nivel' => 'ouro', 'faltam' => $ouro - $s['treinos'], 'meta' => $ouro]];
        }

        return ['nivel' => 'bronze', 'cor' => '#C98A4B', 'proximo' => ['nivel' => 'prata', 'faltam' => $prata - $s['treinos'], 'meta' => $prata]];
    }
}
