<?php

namespace App\Console\Commands;

use App\Models\Evento;
use App\Services\Notificador;
use Illuminate\Console\Command;

/** Lembrete 24h e 2h antes de treinos e jogos. Roda a cada 10 minutos pelo scheduler. */
class EnviarLembretes extends Command
{
    protected $signature = 'escolinha:lembretes';

    protected $description = 'Envia lembretes de treinos e jogos (24h e 2h antes)';

    public function handle(Notificador $notificador): int
    {
        $agora = now();
        $total = 0;
        $candidatos = Evento::ativos()->whereNull('encerrado_em')
            ->whereBetween('data', [$agora->toDateString(), $agora->copy()->addDays(2)->toDateString()])
            ->get();

        foreach ($candidatos as $e) {
            $minutos = $agora->diffInMinutes($e->inicio(), false);
            if ($minutos <= 0) {
                continue;
            }
            if ($minutos <= 24 * 60 && $e->lembrete_24h_em === null && $minutos > 120) {
                // A janela de 24h pega eventos de hoje à noite também: "amanhã" só quando é mesmo amanhã
                $this->avisar($notificador, $e, $e->inicio()->isSameDay($agora) ? 'hoje' : 'amanhã');
                $e->update(['lembrete_24h_em' => $agora]);
                $total++;
            }
            if ($minutos <= 120 && $e->lembrete_2h_em === null) {
                $this->avisar($notificador, $e, 'daqui a pouco');
                $e->update(['lembrete_2h_em' => $agora, 'lembrete_24h_em' => $e->lembrete_24h_em ?? $agora]);
                $total++;
            }
        }
        $this->info("{$total} lembretes enviados.");

        return self::SUCCESS;
    }

    private function avisar(Notificador $n, Evento $e, string $quando): void
    {
        $hora = substr($e->chegada ?? $e->hora_inicio, 0, 5);
        $texto = $e->tituloExibicao()." é {$quando}, ".($e->chegada ? "chegada às {$hora}" : "às {$hora}")." em {$e->local}.";
        if ($e->ehJogo()) {
            $convocados = $e->alunos()->wherePivot('convocado', true)->get();
            $n->alunos($convocados, 'Lembrete de jogo', $texto, 'lembrete', ['evento_id' => $e->id]);

            return;
        }
        $n->categoria($e->categoria_id, 'Lembrete de treino', $texto, 'lembrete', ['evento_id' => $e->id]);
    }
}
