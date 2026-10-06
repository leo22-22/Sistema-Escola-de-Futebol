<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Evento */
class EventoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $gestor = $user?->ehGestor() ?? false;
        $alunos = $this->relationLoaded('alunos') ? $this->alunos : collect();
        $vai = $alunos->where('pivot.confirmacao', 'vai');
        $convocados = $this->ehJogo() ? $alunos->where('pivot.convocado', true) : $vai;

        $meus = [];
        if (! $gestor && $user) {
            $visiveis = $user->alunosVisiveisIds();
            foreach ($alunos->whereIn('id', $visiveis) as $a) {
                $meus[] = [
                    'aluno_id' => $a->id,
                    'convocado' => (bool) $a->pivot->convocado,
                    'confirmacao' => $a->pivot->confirmacao,
                    'chamada' => $a->pivot->chamada,
                    'no_coletivo' => $this->ehColetivo() && $a->pivot->confirmacao === 'vai',
                ];
            }
        }

        return [
            'id' => $this->id,
            'categoria' => $this->whenLoaded('categoria', fn () => ['id' => $this->categoria->id, 'nome' => $this->categoria->nome]),
            'grupo' => $this->grupo,
            'modalidade' => $this->modalidade,
            'titulo' => $this->titulo,
            'titulo_exibicao' => $this->tituloExibicao(),
            'adversario' => $this->adversario,
            'mando' => $this->mando,
            'data' => $this->data->toDateString(),
            'hora_inicio' => substr($this->hora_inicio, 0, 5),
            'hora_fim' => substr($this->hora_fim, 0, 5),
            'chegada' => $this->chegada ? substr($this->chegada, 0, 5) : null,
            'local' => $this->local,
            'uniforme' => $this->uniforme,
            'levar' => $this->levar ?? [],
            'plano' => $this->plano,
            'observacoes' => $this->observacoes,
            'semanal' => $this->serie !== null,
            'serie' => $this->when($gestor, $this->serie),
            'rapida' => $this->rapida,
            'cancelado' => $this->cancelado(),
            'motivo_cancelamento' => $this->motivo_cancelamento,
            'encerrado' => $this->encerrado(),
            'placar' => $this->encerrado() ? ['casa' => $this->placar_casa, 'fora' => $this->placar_fora, 'texto' => $this->placarExibicao()] : null,
            'conta_na_carta' => $this->conta_na_carta,
            'tem_ao_vivo' => $this->temModoAoVivo(),
            'ao_vivo_agora' => $this->whenLoaded('partida', fn () => $this->partida !== null),
            'contagem' => [
                'convocados' => $convocados->count(),
                'vai' => $vai->count(),
                'nao_vai' => $alunos->where('pivot.confirmacao', 'nao_vai')->count(),
                'chamada_feita' => $alunos->whereNotNull('pivot.chamada')->count() > 0,
            ],
            'convocados' => $this->when($this->relationLoaded('alunos'), fn () => $convocados->map(fn ($a) => ['id' => $a->id, 'nome' => $a->nome])->values()),
            'meus' => $this->when(! $gestor, $meus),
            'vinculos' => $this->when($gestor && $this->relationLoaded('alunos'), fn () => $alunos->map(fn ($a) => [
                'aluno_id' => $a->id,
                'convocado' => (bool) $a->pivot->convocado,
                'confirmacao' => $a->pivot->confirmacao,
                'chamada' => $a->pivot->chamada,
            ])->values()),
        ];
    }
}
