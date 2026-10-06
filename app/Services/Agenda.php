<?php

namespace App\Services;

use App\Models\Aluno;
use App\Models\Evento;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class Agenda
{
    public function __construct(private Notificador $notificador, private Conquistas $conquistas) {}

    /** @return Collection<int, Evento> */
    public function criar(array $d, User $por): Collection
    {
        $base = $this->campos($d) + ['criado_por' => $por->id];
        $datas = [$d['data']];

        if ($base['grupo'] === 'treino' && ! empty($d['repetir'])) {
            $dias = array_map('intval', $d['dias_semana'] ?? []);
            abort_if(! $dias, 422, 'Escolha pelo menos um dia da semana.');
            $datas = [];
            $dia = Carbon::parse($d['data']);
            $ate = Carbon::parse($d['repetir_ate']);
            while ($dia->lte($ate) && count($datas) < 60) {
                if (in_array($dia->dayOfWeek, $dias, true)) {
                    $datas[] = $dia->toDateString();
                }
                $dia->addDay();
            }
            abort_if(! $datas, 422, 'Nenhuma data entre o início e o fim da repetição.');
        }

        $serie = count($datas) > 1 ? (string) Str::uuid() : null;
        $eventos = DB::transaction(fn () => collect($datas)->map(fn ($data) => Evento::create($base + ['data' => $data, 'serie' => $serie])));

        $primeiro = $eventos->first();
        $texto = $eventos->count() > 1
            ? "Novos treinos semanais: {$primeiro->titulo} ({$eventos->count()} datas a partir de {$primeiro->data->format('d/m')})."
            : 'Novo '.($primeiro->ehJogo() ? 'jogo: '.$primeiro->tituloExibicao() : 'treino: '.$primeiro->titulo)." em {$primeiro->data->format('d/m')} às ".substr($primeiro->hora_inicio, 0, 5).'.'
              .($primeiro->ehColetivo() ? ' Confirme presença para entrar nos times.' : '');
        $this->notificador->categoria($primeiro->categoria_id, 'Agenda', $texto, 'agenda', ['evento_id' => $primeiro->id]);

        return $eventos;
    }

    public function atualizar(Evento $e, array $d): Evento
    {
        $novos = $this->campos($d) + ['data' => $d['data']];
        $mudou = [];
        if ($e->data->toDateString() !== $novos['data']) {
            $mudou[] = 'data';
        }
        if (substr($e->hora_inicio, 0, 5) !== substr($novos['hora_inicio'], 0, 5)) {
            $mudou[] = 'horário';
        }
        if ($e->local !== $novos['local']) {
            $mudou[] = 'local';
        }
        if (array_intersect($mudou, ['data', 'horário'])) {
            // Novo horário: os lembretes de 24h e 2h precisam sair de novo
            $novos += ['lembrete_24h_em' => null, 'lembrete_2h_em' => null];
        }
        $e->update($novos);
        $texto = $e->tituloExibicao().' ('.$e->data->format('d/m').') foi alterado'.($mudou ? ': mudou '.implode(', ', $mudou) : '').'.';
        $this->notificador->categoria($e->categoria_id, 'Agenda alterada', $texto, 'agenda', ['evento_id' => $e->id]);

        return $e;
    }

    public function cancelar(Evento $e, string $motivo, bool $serie): int
    {
        $alvo = $serie && $e->serie
            ? Evento::where('serie', $e->serie)->where('data', '>=', $e->data)->whereNull('encerrado_em')->get()
            : collect([$e]);
        foreach ($alvo as $x) {
            $x->update(['cancelado_em' => now(), 'motivo_cancelamento' => $motivo]);
        }
        $texto = $alvo->count() > 1
            ? "{$alvo->count()} treinos de {$e->titulo} a partir de {$e->data->format('d/m')} foram cancelados. Motivo: {$motivo}"
            : $e->tituloExibicao()." de {$e->data->format('d/m')} foi cancelado. Motivo: {$motivo}";
        $this->notificador->categoria($e->categoria_id, 'Cancelado', $texto, 'agenda', ['evento_id' => $e->id]);

        return $alvo->count();
    }

    public function reativar(Evento $e): Evento
    {
        $e->update(['cancelado_em' => null, 'motivo_cancelamento' => null]);
        $this->notificador->categoria($e->categoria_id, 'Agenda', $e->tituloExibicao().' de '.$e->data->format('d/m').' está confirmado de novo.', 'agenda', ['evento_id' => $e->id]);

        return $e;
    }

    public function duplicar(Evento $e, User $por): Evento
    {
        $copia = $e->replicate(['serie', 'cancelado_em', 'motivo_cancelamento', 'encerrado_em', 'placar_casa', 'placar_fora', 'estatisticas', 'observacao_professor', 'lembrete_24h_em', 'lembrete_2h_em', 'rapida']);
        $copia->data = $e->data->copy()->addWeek();
        $copia->criado_por = $por->id;
        $copia->conta_na_carta = true;
        $copia->save();

        return $copia;
    }

    /** Só para jogos. No coletivo a lista vem de quem confirma presença. */
    public function convocar(Evento $e, array $ids): int
    {
        abort_unless($e->ehJogo(), 422, 'No coletivo, quem confirma presença entra na lista automaticamente.');
        $ids = array_map('intval', $ids);
        $validos = Aluno::whereIn('id', $ids)->pluck('id')->map(fn ($i) => (int) $i)->all();
        $antes = $e->convocadosIds();
        foreach ($antes as $id) {
            if (! in_array($id, $validos, true)) {
                $e->marcar($id, ['convocado' => false]);
            }
        }
        foreach ($validos as $id) {
            $e->marcar($id, ['convocado' => true]);
        }
        $novos = Aluno::whereIn('id', array_diff($validos, $antes))->get();
        $chegada = substr($e->chegada ?? $e->hora_inicio, 0, 5);
        $this->notificador->alunos($novos, 'Convocação', 'Você foi convocado para '.$e->tituloExibicao()." ({$e->data->format('d/m')}, chegada {$chegada}).", 'convocacao', ['evento_id' => $e->id]);

        return count($validos);
    }

    public function confirmar(Evento $e, Aluno $a, string $status): void
    {
        abort_if($e->cancelado() || $e->encerrado(), 422, 'Este evento não aceita mais confirmação.');
        $e->marcar($a->id, ['confirmacao' => $status, 'confirmado_em' => now()]);
    }

    /** @param array<int,string> $mapa aluno_id => presente|falta|justificada */
    public function chamada(Evento $e, array $mapa): int
    {
        abort_unless($e->grupo === 'treino', 422, 'Chamada é só para treinos.');
        // Ignora ids que não são alunos (evita erro de chave estrangeira com dado inválido)
        $validos = Aluno::whereIn('id', array_keys($mapa))->pluck('id')->map(fn ($i) => (int) $i)->all();
        $mapa = array_intersect_key($mapa, array_flip($validos));
        $presentes = [];
        foreach ($mapa as $id => $status) {
            $e->marcar((int) $id, ['chamada' => $status]);
            if ($status === 'presente') {
                $presentes[] = (int) $id;
            }
        }
        Aluno::whereIn('id', $presentes)->get()->each(fn ($a) => $this->conquistas->sincronizar($a));

        return count($presentes);
    }

    /** Todos presentes, menos quem avisou que não ia. */
    public function chamadaRapida(Evento $e): int
    {
        $confirmacoes = $e->alunos()->pluck('evento_aluno.confirmacao', 'alunos.id');
        $mapa = [];
        foreach (Aluno::where('categoria_id', $e->categoria_id)->pluck('id') as $id) {
            $mapa[$id] = ($confirmacoes[$id] ?? null) === 'nao_vai' ? 'falta' : 'presente';
        }

        return $this->chamada($e, $mapa);
    }

    public function lembrete(Evento $e): int
    {
        $responderam = $e->alunos()->whereNotNull('evento_aluno.confirmacao')->pluck('alunos.id')->all();
        $faltam = Aluno::where('categoria_id', $e->categoria_id)->whereNotIn('id', $responderam)->get();
        $this->notificador->alunos($faltam, 'Lembrete', 'Confirme se vai em '.$e->tituloExibicao().' ('.$e->data->format('d/m').', '.substr($e->hora_inicio, 0, 5).').', 'lembrete', ['evento_id' => $e->id]);

        return $faltam->count();
    }

    /** Cria um evento "de agora" para iniciar o modo ao vivo sem passar pela agenda. */
    public function partidaRapida(array $d, User $por): Evento
    {
        $coletivo = $d['modalidade'] === 'Coletivo';
        $inicio = now();
        $fim = $inicio->copy()->addMinutes(90);

        return Evento::create([
            'categoria_id' => $d['categoria_id'],
            'criado_por' => $por->id,
            'grupo' => $coletivo ? 'treino' : 'jogo',
            'modalidade' => $d['modalidade'],
            'titulo' => $coletivo ? 'Coletivo' : $d['modalidade'],
            'adversario' => $coletivo ? null : $d['adversario'],
            'data' => $inicio->toDateString(),
            'hora_inicio' => $inicio->format('H:i'),
            'hora_fim' => $fim->isSameDay($inicio) ? $fim->format('H:i') : '23:59',
            'local' => $d['local'] ?? 'Campo',
            'rapida' => true,
        ]);
    }

    private function campos(array $d): array
    {
        $jogo = $d['grupo'] === 'jogo';
        $plano = null;
        if (! $jogo && (! empty($d['plano']['objetivo']) || ! empty($d['plano']['atividades']))) {
            $plano = [
                'objetivo' => trim($d['plano']['objetivo'] ?? ''),
                'atividades' => collect($d['plano']['atividades'] ?? [])
                    ->filter(fn ($a) => trim($a['nome'] ?? '') !== '')
                    ->map(fn ($a) => ['nome' => trim($a['nome']), 'minutos' => (int) ($a['minutos'] ?? 0), 'lousa_id' => $a['lousa_id'] ?? null])
                    ->values()->all(),
            ];
        }

        return [
            'categoria_id' => $d['categoria_id'],
            'grupo' => $d['grupo'],
            'modalidade' => $d['modalidade'],
            'titulo' => $jogo ? $d['modalidade'] : trim($d['titulo']),
            'adversario' => $jogo ? trim($d['adversario']) : null,
            'mando' => $jogo ? ($d['mando'] ?? 'casa') : 'casa',
            'hora_inicio' => $d['hora_inicio'],
            'hora_fim' => $d['hora_fim'],
            'chegada' => $jogo ? ($d['chegada'] ?? null) : null,
            'local' => trim($d['local']),
            'uniforme' => $d['uniforme'] ?? null,
            'levar' => $d['levar'] ?? [],
            'plano' => $plano,
            'observacoes' => $d['observacoes'] ?? null,
        ];
    }
}
