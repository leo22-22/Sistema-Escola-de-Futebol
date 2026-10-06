<?php

namespace App\Services;

use App\Models\Aluno;
use App\Models\AlunoConquista;

class Conquistas
{
    public function __construct(private Estatisticas $estatisticas, private Notificador $notificador) {}

    /** Catálogo. Todas são automáticas. */
    public static function catalogo(): array
    {
        return [
            'g1' => ['nome' => 'Primeiro gol', 'valoriza' => 'Todas', 'regra' => fn ($s) => $s['gols'] >= 1],
            'g10' => ['nome' => 'Artilheiro 10', 'valoriza' => 'Todas', 'regra' => fn ($s) => $s['gols'] >= 10],
            'falta' => ['nome' => 'Gol de falta', 'valoriza' => 'Todas', 'regra' => fn ($s) => $s['gols_falta'] >= 1],
            'a1' => ['nome' => 'Primeira assistência', 'valoriza' => 'Meio e ataque', 'regra' => fn ($s) => $s['assistencias'] >= 1],
            'a5' => ['nome' => 'Garçom 5', 'valoriza' => 'Meio e ataque', 'regra' => fn ($s) => $s['assistencias'] >= 5],
            'cs' => ['nome' => 'Jogo sem sofrer gol', 'valoriza' => 'Goleiro e defesa', 'regra' => fn ($s) => $s['jogos_sem_sofrer'] >= 1],
            'pd' => ['nome' => 'Pênalti defendido', 'valoriza' => 'Goleiro', 'regra' => fn ($s) => $s['penaltis_defendidos'] >= 1],
            'm300' => ['nome' => '300 minutos em campo', 'valoriza' => 'Todas', 'regra' => fn ($s) => $s['minutos'] >= 300],
            't10' => ['nome' => '10 treinos', 'valoriza' => 'Todas', 'regra' => fn ($s) => $s['treinos'] >= 10],
            't25' => ['nome' => '25 treinos', 'valoriza' => 'Todas', 'regra' => fn ($s) => $s['treinos'] >= 25],
            'promo' => ['nome' => 'Promovido', 'valoriza' => 'Todas', 'regra' => fn ($s) => $s['promovido']],
        ];
    }

    /**
     * Grava as conquistas que o aluno passou a ter e avisa.
     *
     * @return string[] códigos novos
     */
    public function sincronizar(Aluno $aluno, bool $notificar = true, bool $marcarVista = false): array
    {
        $s = $this->estatisticas->doAluno($aluno);
        $tem = $aluno->conquistas()->pluck('codigo')->all();
        $novas = [];
        foreach (self::catalogo() as $codigo => $c) {
            if (! in_array($codigo, $tem, true) && ($c['regra'])($s)) {
                AlunoConquista::create([
                    'aluno_id' => $aluno->id,
                    'codigo' => $codigo,
                    'conquistada_em' => now(),
                    'vista_em' => $marcarVista ? now() : null,
                ]);
                $novas[] = $codigo;
            }
        }
        if ($notificar) {
            foreach ($novas as $codigo) {
                $this->notificador->aluno($aluno, 'Conquista liberada!', self::catalogo()[$codigo]['nome'], 'conquista', ['codigo' => $codigo]);
            }
        }

        return $novas;
    }
}
