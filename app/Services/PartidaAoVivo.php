<?php

namespace App\Services;

use App\Models\Aluno;
use App\Models\Evento;
use App\Models\Lance;
use App\Models\Partida;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Motor do jogo ao vivo. O estado inteiro fica em partidas.estado (JSON) enquanto a partida roda.
 * O cronômetro é calculado no servidor: seg_base + tempo decorrido desde rodando_desde.
 * Ao encerrar, os lances vão para a tabela lances e os minutos para evento_aluno.
 */
class PartidaAoVivo
{
    public const DETALHES_GOL = ['normal', 'falta', 'penalti', 'cabeca', 'fora_area'];

    /** Quantos ids de ações já aplicadas ficam guardados para ignorar reenvio da fila offline. */
    private const IDS_GUARDADOS = 500;

    /** Momento (segundos, com fração) em que a ação aconteceu: o do aparelho quando veio da fila offline. */
    private float $agora = 0;

    /** Base do id dos lances criados pela ação atual (o app gera o mesmo id offline). */
    private ?string $idLance = null;

    private int $lancesNaAcao = 0;

    public function __construct(private Conquistas $conquistas, private Notificador $notificador) {}

    /** Quanto o relógio do aparelho está adiantado em relação ao servidor (s), medido nesta partida. */
    private float $desvio = 0;

    /**
     * Define o "agora" da ação. Ação feita offline chega depois com o horário em que aconteceu ($emMs);
     * ele nunca volta antes da última ação aplicada. Se o aparelho estiver adiantado, o desvio é descontado
     * de todas as ações (e não só cortado), para o tempo entre um lance e outro continuar certo.
     */
    private function relogio(?int $emMs, float $ultimo = 0, float $desvio = 0): void
    {
        $real = microtime(true);
        $this->desvio = $desvio;
        if (! $emMs) {
            $this->agora = max($ultimo, $real);

            return;
        }
        $em = $emMs / 1000 - $this->desvio;
        if ($em > $real) {
            $this->desvio += $em - $real;
            $em = $real;
        }
        $this->agora = max($ultimo, $em);
    }

    public static function statsZero(): array
    {
        return ['chutes' => 0, 'no_gol' => 0, 'escanteios' => 0, 'faltas' => 0, 'amarelos' => 0, 'vermelhos' => 0];
    }

    /**
     * @param  array{n:int,duracao:int,tempos:int,adversario?:string,titulares?:int[],reservas?:int[],time_a?:int[],time_b?:int[]}  $d
     */
    public function iniciar(Evento $evento, array $d, User $por): Partida
    {
        $this->exigir($evento->temModoAoVivo(), 'Só jogos e coletivos têm modo ao vivo.');
        $this->exigir(! $evento->encerrado() && ! $evento->cancelado(), 'Este evento já foi encerrado ou cancelado.');
        if ($p = $evento->partida()->first()) {
            // Reenvio da fila offline: a partida que esse mesmo início criou já existe
            if (! empty($d['acao_id']) && ($p->estado['inicio_id'] ?? null) === $d['acao_id']) {
                return $p;
            }
            abort(409, 'Já existe uma partida em andamento para este evento.');
        }
        $this->relogio($d['em'] ?? null);

        $n = (int) $d['n'];
        $jogo = $evento->ehJogo();
        $campo = ['a' => [], 'b' => $jogo ? null : []];
        $banco = ['a' => [], 'b' => []];
        $time = [];

        if ($jogo) {
            $titulares = $this->ids($d['titulares'] ?? []);
            $reservas = array_values(array_diff($this->ids($d['reservas'] ?? []), $titulares));
            $this->exigir(count($titulares) >= 1, 'Escolha os titulares.');
            $this->exigir(count($titulares) <= $n, 'Você escolheu '.count($titulares)." titulares para {$n} vagas.");
            $campo['a'] = $titulares;
            $banco['a'] = $reservas;
            foreach (array_merge($titulares, $reservas) as $id) {
                $time[$id] = 'a';
            }
        } else {
            $a = $this->ids($d['time_a'] ?? []);
            $b = array_values(array_diff($this->ids($d['time_b'] ?? []), $a));
            $this->exigir(count($a) >= 1 && count($b) >= 1, 'Coloque jogadores nos dois times.');
            $campo['a'] = array_slice($a, 0, $n);
            $banco['a'] = array_slice($a, $n);
            $campo['b'] = array_slice($b, 0, $n);
            $banco['b'] = array_slice($b, $n);
            foreach ($a as $id) {
                $time[$id] = 'a';
            }
            foreach ($b as $id) {
                $time[$id] = 'b';
            }
        }

        $entrou = [];
        foreach (array_merge($campo['a'], $campo['b'] ?? []) as $id) {
            $entrou[$id] = 0;
        }

        $estado = [
            'evento_id' => $evento->id,
            'jogo' => $jogo,
            'adversario' => $jogo ? trim($d['adversario'] ?? $evento->adversario ?? 'Adversário') : 'Time B',
            'n' => $n,
            'dur' => (int) $d['duracao'],
            'tempos' => (int) $d['tempos'],
            'periodo' => 1,
            'seg_base' => 0,
            'rodando' => false,
            'rodando_desde' => null,
            'fase' => 'jogo',
            'placar' => ['a' => 0, 'b' => 0],
            'campo' => $campo,
            'banco' => $banco,
            'time' => $time,
            'entrou' => $entrou,
            'minutos' => [],
            'jogou' => array_keys($entrou),
            'cartoes' => [],
            'expulsos' => [],
            'stats' => ['a' => self::statsZero(), 'b' => self::statsZero()],
            'lances' => [],
            'inicio_id' => $d['acao_id'] ?? null,
            'aplicadas' => [],
            'ultimo_em' => $this->agora,
            'desvio_relogio' => $this->desvio,
        ];

        return Partida::create(['evento_id' => $evento->id, 'iniciada_por' => $por->id, 'estado' => $estado, 'historico' => []]);
    }

    public function executar(Partida $partida, string $acao, array $d, User $por): Partida
    {
        return DB::transaction(function () use ($partida, $acao, $d) {
            $p = Partida::whereKey($partida->id)->lockForUpdate()->firstOrFail();
            $e = $p->estado;
            // Ficam fora do desfazer: quais ações já entraram e até que horário
            $aplicadas = $e['aplicadas'] ?? [];
            $acaoId = $d['acao_id'] ?? null;
            if ($acaoId !== null && in_array($acaoId, $aplicadas, true)) {
                return $p;
            }
            $this->relogio($d['em'] ?? null, (float) ($e['ultimo_em'] ?? 0), (float) ($e['desvio_relogio'] ?? 0));
            $this->idLance = $acaoId;
            $this->lancesNaAcao = 0;
            $this->congelar($e);
            $historico = $p->historico ?? [];
            $antes = $e;

            switch ($acao) {
                case 'cronometro':
                    $this->cronometro($e, $d);
                    break;
                case 'fim_tempo':
                    $this->exigir($e['tempos'] === 2 && $e['periodo'] === 1 && $e['fase'] === 'jogo', 'Não há primeiro tempo para encerrar.');
                    $e['rodando'] = false;
                    $e['rodando_desde'] = null;
                    $e['fase'] = 'intervalo';
                    $this->lance($e, ['tipo' => 'marco', 'time' => 'a', 'texto' => "Fim do 1º tempo: {$e['placar']['a']} x {$e['placar']['b']}"]);
                    break;
                case 'segundo_tempo':
                    $this->exigir($e['fase'] === 'intervalo', 'O segundo tempo só começa depois do intervalo.');
                    $fim = $this->segJogo($e);
                    foreach ($e['entrou'] as $id => $desde) {
                        $e['minutos'][$id] = ($e['minutos'][$id] ?? 0) + max(0, $fim - $desde);
                    }
                    $e['periodo'] = 2;
                    $e['seg_base'] = 0;
                    $e['fase'] = 'jogo';
                    $e['rodando'] = true;
                    $e['rodando_desde'] = $this->agora;
                    $inicio = $this->segJogo($e);
                    foreach (array_keys($e['entrou']) as $id) {
                        $e['entrou'][$id] = $inicio;
                    }
                    $this->lance($e, ['tipo' => 'marco', 'time' => 'a', 'texto' => 'Começou o 2º tempo']);
                    break;
                case 'gol':
                    $t = $this->time($d);
                    $autor = $this->opcionalEmCampo($e, $t, $d['aluno_id'] ?? null);
                    $assist = $this->opcionalEmCampo($e, $t, $d['assistencia_id'] ?? null);
                    if ($assist === $autor) {
                        $assist = null;
                    }
                    $detalhe = in_array($d['detalhe'] ?? 'normal', self::DETALHES_GOL, true) ? ($d['detalhe'] ?? 'normal') : 'normal';
                    $e['placar'][$t]++;
                    $e['stats'][$t]['chutes']++;
                    $e['stats'][$t]['no_gol']++;
                    $this->lance($e, ['tipo' => 'gol', 'time' => $t, 'aluno_id' => $autor, 'assistencia_id' => $assist, 'detalhe' => $detalhe]);
                    break;
                case 'chute':
                    $t = $this->time($d);
                    $no = (bool) ($d['no_gol'] ?? false);
                    $e['stats'][$t]['chutes']++;
                    if ($no) {
                        $e['stats'][$t]['no_gol']++;
                    }
                    $this->lance($e, ['tipo' => 'chute', 'time' => $t, 'aluno_id' => $this->opcionalEmCampo($e, $t, $d['aluno_id'] ?? null), 'detalhe' => $no ? 'gol' : 'fora']);
                    break;
                case 'escanteio':
                    $e['stats'][$this->time($d)]['escanteios']++;
                    break;
                case 'falta':
                    $e['stats'][$this->time($d)]['faltas']++;
                    break;
                case 'cartao':
                    $t = $this->time($d);
                    $cor = ($d['cor'] ?? 'amarelo') === 'vermelho' ? 'vermelho' : 'amarelo';
                    $this->cartao($e, $t, $this->opcionalEmCampo($e, $t, $d['aluno_id'] ?? null), $cor);
                    break;
                case 'defesa':
                    $t = $this->time($d);
                    $outro = $t === 'a' ? 'b' : 'a';
                    $e['stats'][$outro]['chutes']++;
                    $e['stats'][$outro]['no_gol']++;
                    $this->lance($e, ['tipo' => 'defesa', 'time' => $t, 'aluno_id' => $this->obrigatorioEmCampo($e, $t, $d['aluno_id'] ?? null)]);
                    break;
                case 'penalti_defendido':
                    $t = $this->time($d);
                    $this->lance($e, ['tipo' => 'penalti_defendido', 'time' => $t, 'aluno_id' => $this->obrigatorioEmCampo($e, $t, $d['aluno_id'] ?? null)]);
                    break;
                case 'substituicao':
                    $t = $this->time($d);
                    $sai = $this->obrigatorioEmCampo($e, $t, $d['sai_id'] ?? null);
                    $entra = (int) ($d['entra_id'] ?? 0);
                    $this->exigir(in_array($entra, $e['banco'][$t], true), 'Quem entra precisa estar no banco.');
                    $this->tirarDeCampo($e, $sai);
                    $e['banco'][$t][] = $sai;
                    $e['banco'][$t] = array_values(array_diff($e['banco'][$t], [$entra]));
                    $this->colocarEmCampo($e, $t, $entra);
                    $this->lance($e, ['tipo' => 'substituicao', 'time' => $t, 'sai_id' => $sai, 'entra_id' => $entra]);
                    break;
                case 'entrar':
                    $t = $this->time($d);
                    $id = (int) ($d['aluno_id'] ?? 0);
                    $this->exigir(in_array($id, $e['banco'][$t], true), 'O jogador precisa estar no banco.');
                    $this->exigir(count($e['campo'][$t]) < $e['n'], 'O time já está completo. Faça uma substituição.');
                    $e['banco'][$t] = array_values(array_diff($e['banco'][$t], [$id]));
                    $this->colocarEmCampo($e, $t, $id);
                    $this->lance($e, ['tipo' => 'marco', 'time' => $t, 'texto' => $this->nome($id).' entrou em campo']);
                    break;
                case 'adicionar':
                    $t = $this->time($d);
                    $id = (int) ($d['aluno_id'] ?? 0);
                    $this->exigir(Aluno::whereKey($id)->exists(), 'Aluno não encontrado.');
                    $this->exigir(! array_key_exists($id, $e['time']), 'Este aluno já está na partida.');
                    $e['time'][$id] = $t;
                    if (count($e['campo'][$t]) < $e['n']) {
                        $this->colocarEmCampo($e, $t, $id);
                        $texto = $this->nome($id).' chegou e entrou em campo';
                    } else {
                        $e['banco'][$t][] = $id;
                        $texto = $this->nome($id).' chegou e foi para o banco';
                    }
                    $this->lance($e, ['tipo' => 'marco', 'time' => $t, 'texto' => $texto]);
                    $evento = Evento::find($e['evento_id']);
                    $evento->marcar($id, array_filter([
                        'confirmacao' => 'vai',
                        'confirmado_em' => now(),
                        'chamada' => $evento->grupo === 'treino' ? 'presente' : null,
                    ]));
                    break;
                case 'remover_lance':
                    $this->removerLance($e, (string) ($d['lance_id'] ?? ''));
                    break;
                case 'desfazer':
                    $this->exigir(count($historico) > 0, 'Não há nada para desfazer.');
                    $anterior = array_pop($historico);
                    if ($anterior['periodo'] === $e['periodo']) {
                        $anterior['seg_base'] = $e['seg_base'];
                        $anterior['rodando'] = $e['rodando'];
                        $anterior['rodando_desde'] = $e['rodando_desde'];
                    }
                    $e = $anterior;
                    break;
                default:
                    abort(422, 'Ação desconhecida.');
            }

            if (! in_array($acao, ['cronometro', 'desfazer'], true)) {
                $historico[] = $antes;
                $limite = (int) config('escolinha.historico_desfazer', 30);
                if (count($historico) > $limite) {
                    $historico = array_slice($historico, -$limite);
                }
            }

            if ($acaoId !== null) {
                $aplicadas[] = $acaoId;
            }
            $e['aplicadas'] = array_slice($aplicadas, -self::IDS_GUARDADOS);
            $e['ultimo_em'] = $this->agora;
            $e['desvio_relogio'] = $this->desvio;
            $p->estado = $e;
            $p->historico = $historico;
            $p->save();

            return $p;
        });
    }

    public function encerrar(Partida $partida, bool $contaNaCarta, ?string $observacao, ?int $emMs = null): Evento
    {
        $participantes = [];
        $evento = DB::transaction(function () use ($partida, $contaNaCarta, $observacao, $emMs, &$participantes) {
            $p = Partida::whereKey($partida->id)->lockForUpdate()->firstOrFail();
            $e = $p->estado;
            $this->relogio($emMs, (float) ($e['ultimo_em'] ?? 0), (float) ($e['desvio_relogio'] ?? 0));
            $this->congelar($e);
            $fim = $this->segJogo($e);
            foreach ($e['entrou'] as $id => $desde) {
                $e['minutos'][$id] = ($e['minutos'][$id] ?? 0) + max(0, $fim - $desde);
            }

            $evento = Evento::findOrFail($e['evento_id']);
            $evento->update([
                'encerrado_em' => now(),
                'placar_casa' => $e['placar']['a'],
                'placar_fora' => $e['placar']['b'],
                'conta_na_carta' => $contaNaCarta,
                'estatisticas' => $e['stats'],
                'observacao_professor' => $observacao,
            ]);

            foreach ($e['jogou'] as $id) {
                $evento->marcar((int) $id, ['participou' => true, 'minutos' => (int) round(($e['minutos'][$id] ?? 0) / 60)]);
            }

            foreach ($e['lances'] as $l) {
                if ($l['tipo'] === 'marco') {
                    continue;
                }
                Lance::create([
                    'evento_id' => $evento->id,
                    'tipo' => $l['tipo'],
                    'time' => $l['time'],
                    'aluno_id' => $l['aluno_id'] ?? null,
                    'assistencia_id' => $l['assistencia_id'] ?? null,
                    'sai_id' => $l['sai_id'] ?? null,
                    'entra_id' => $l['entra_id'] ?? null,
                    'detalhe' => $l['detalhe'] ?? null,
                    'minuto' => $l['minuto'],
                    'segundo_jogo' => $l['segundo_jogo'],
                ]);
            }

            $p->delete();
            $participantes = array_map('intval', $e['jogou']);

            return $evento;
        });

        if ($contaNaCarta) {
            Aluno::whereIn('id', $participantes)->get()->each(fn (Aluno $a) => $this->conquistas->sincronizar($a));
        }
        $titulo = $evento->ehJogo() ? 'Fim de jogo' : 'Coletivo encerrado';
        $this->notificador->categoria($evento->categoria_id, $titulo, $evento->tituloExibicao().' · '.$evento->placarExibicao().'. Veja o resumo na agenda.', 'resultado', ['evento_id' => $evento->id]);

        return $evento->fresh();
    }

    /** Estado para o app: inclui cronômetro atual, minutos de cada jogador e nomes. */
    public function publico(Partida $p): array
    {
        $e = $p->estado;
        $this->agora = microtime(true);
        $seg = $this->segAtual($e);
        $e['seg_base'] = $seg;
        $agora = $this->segJogo($e);
        $minutos = [];
        foreach (array_keys($e['time']) as $id) {
            $em = array_key_exists($id, $e['entrou']) ? max(0, $agora - $e['entrou'][$id]) : 0;
            $minutos[$id] = intdiv(($e['minutos'][$id] ?? 0) + $em, 60);
        }
        $jogadores = Aluno::withTrashed()->whereIn('id', array_keys($e['time']))->get()->mapWithKeys(fn (Aluno $a) => [$a->id => [
            'id' => $a->id,
            'nome' => $a->nome,
            'numero' => $a->numero_camisa,
            'posicoes' => $a->posicoes,
            'foto_url' => $a->fotoUrl(),
        ]]);

        return [
            'evento_id' => $e['evento_id'],
            'jogo' => $e['jogo'],
            'times' => ['a' => $e['jogo'] ? config('escolinha.nome_curto') : 'Time A', 'b' => $e['adversario']],
            'jogadores_por_time' => $e['n'],
            'duracao' => $e['dur'],
            'tempos' => $e['tempos'],
            'periodo' => $e['periodo'],
            'fase' => $e['fase'],
            'rodando' => $e['rodando'],
            'segundos' => $seg,
            'minuto' => $this->minuto($e),
            'placar' => $e['placar'],
            'campo' => $e['campo'],
            'banco' => $e['banco'],
            'expulsos' => $e['expulsos'],
            'time' => (object) $e['time'],
            'jogou' => $e['jogou'],
            'cartoes' => (object) $e['cartoes'],
            'minutos_jogados' => (object) $minutos,
            'estatisticas' => $e['stats'],
            'lances' => $e['lances'],
            'jogadores' => (object) $jogadores->all(),
            'pode_desfazer' => count($p->historico ?? []) > 0,
        ];
    }

    // ---------- regras internas ----------

    private function cronometro(array &$e, array $d): void
    {
        $cmd = $d['comando'] ?? '';
        if ($cmd === 'iniciar') {
            $this->exigir($e['fase'] !== 'intervalo', 'Comece o 2º tempo para voltar a contar.');
            $e['rodando'] = true;
            $e['rodando_desde'] = $this->agora;
        } elseif ($cmd === 'pausar') {
            $e['rodando'] = false;
            $e['rodando_desde'] = null;
        } elseif ($cmd === 'ajustar') {
            $e['seg_base'] = max(0, $e['seg_base'] + (int) ($d['segundos'] ?? 0));
        } else {
            abort(422, 'Comando de cronômetro inválido.');
        }
    }

    private function cartao(array &$e, string $t, ?int $id, string $cor): void
    {
        $chave = $cor === 'vermelho' ? 'vermelhos' : 'amarelos';
        if ($id === null) {
            $e['stats'][$t][$chave]++;
            $this->lance($e, ['tipo' => $cor, 'time' => $t]);

            return;
        }
        $c = $e['cartoes'][$id] ?? ['amarelos' => 0, 'vermelho' => false];
        if ($cor === 'amarelo') {
            $c['amarelos']++;
            $e['stats'][$t]['amarelos']++;
            $this->lance($e, ['tipo' => 'amarelo', 'time' => $t, 'aluno_id' => $id]);
            if ($c['amarelos'] >= 2) {
                $c['vermelho'] = true;
                $e['stats'][$t]['vermelhos']++;
                $this->lance($e, ['tipo' => 'vermelho', 'time' => $t, 'aluno_id' => $id, 'detalhe' => 'segundo_amarelo']);
                $this->expulsar($e, $id);
            }
        } else {
            $c['vermelho'] = true;
            $e['stats'][$t]['vermelhos']++;
            $this->lance($e, ['tipo' => 'vermelho', 'time' => $t, 'aluno_id' => $id]);
            $this->expulsar($e, $id);
        }
        $e['cartoes'][$id] = $c;
    }

    private function expulsar(array &$e, int $id): void
    {
        $this->tirarDeCampo($e, $id);
        $e['expulsos'][] = $id;
    }

    private function removerLance(array &$e, string $lanceId): void
    {
        $idx = null;
        foreach ($e['lances'] as $i => $l) {
            if ($l['id'] === $lanceId) {
                $idx = $i;
            }
        }
        $this->exigir($idx !== null, 'Lance não encontrado.');
        $l = $e['lances'][$idx];
        $this->exigir(in_array($l['tipo'], ['gol', 'chute', 'defesa', 'penalti_defendido', 'amarelo'], true), 'Esse lance só pode ser revertido com "desfazer".');
        $t = $l['time'];
        $s = &$e['stats'][$t];
        if ($l['tipo'] === 'gol') {
            $e['placar'][$t] = max(0, $e['placar'][$t] - 1);
            $s['chutes'] = max(0, $s['chutes'] - 1);
            $s['no_gol'] = max(0, $s['no_gol'] - 1);
        }
        if ($l['tipo'] === 'chute') {
            $s['chutes'] = max(0, $s['chutes'] - 1);
            if (($l['detalhe'] ?? '') === 'gol') {
                $s['no_gol'] = max(0, $s['no_gol'] - 1);
            }
        }
        if ($l['tipo'] === 'defesa') {
            $o = &$e['stats'][$t === 'a' ? 'b' : 'a'];
            $o['chutes'] = max(0, $o['chutes'] - 1);
            $o['no_gol'] = max(0, $o['no_gol'] - 1);
            unset($o);
        }
        if ($l['tipo'] === 'amarelo') {
            $s['amarelos'] = max(0, $s['amarelos'] - 1);
            $aid = $l['aluno_id'] ?? null;
            if ($aid !== null && isset($e['cartoes'][$aid])) {
                $e['cartoes'][$aid]['amarelos'] = max(0, $e['cartoes'][$aid]['amarelos'] - 1);
            }
        }
        unset($s);
        array_splice($e['lances'], $idx, 1);
    }

    private function colocarEmCampo(array &$e, string $t, int $id): void
    {
        $e['campo'][$t][] = $id;
        $e['entrou'][$id] = $this->segJogo($e);
        if (! in_array($id, $e['jogou'], true)) {
            $e['jogou'][] = $id;
        }
    }

    private function tirarDeCampo(array &$e, int $id): void
    {
        $t = $e['time'][$id];
        if (array_key_exists($id, $e['entrou'])) {
            $e['minutos'][$id] = ($e['minutos'][$id] ?? 0) + max(0, $this->segJogo($e) - $e['entrou'][$id]);
            unset($e['entrou'][$id]);
        }
        $e['campo'][$t] = array_values(array_diff($e['campo'][$t], [$id]));
    }

    private function lance(array &$e, array $dados): void
    {
        // Com acao_id, o id do lance é o mesmo que o app criou offline (2º lance da mesma ação ganha "-2")
        $n = $this->lancesNaAcao++;
        $id = $this->idLance !== null ? $this->idLance.($n ? '-'.($n + 1) : '') : (string) Str::ulid();
        $e['lances'][] = array_merge([
            'id' => $id,
            'aluno_id' => null,
            'assistencia_id' => null,
            'sai_id' => null,
            'entra_id' => null,
            'detalhe' => null,
            'texto' => null,
            'minuto' => $this->minuto($e),
            'segundo_jogo' => $this->segJogo($e),
        ], $dados);
    }

    public function segAtual(array $e): int
    {
        $s = (int) $e['seg_base'];
        if ($e['rodando'] && $e['rodando_desde']) {
            $s += (int) floor(max(0, $this->agora - (float) $e['rodando_desde']));
        }

        return $s;
    }

    /** Transforma o tempo corrido em seg_base para as regras trabalharem com um valor fixo. */
    private function congelar(array &$e): void
    {
        $e['seg_base'] = $this->segAtual($e);
        if ($e['rodando']) {
            $e['rodando_desde'] = $this->agora;
        }
    }

    private function segJogo(array $e): int
    {
        return ($e['periodo'] - 1) * $e['dur'] * 60 + (int) $e['seg_base'];
    }

    private function minuto(array $e): string
    {
        $reg = $e['dur'] * 60;
        $seg = (int) $e['seg_base'];
        if ($seg > $reg) {
            return ($e['periodo'] * $e['dur']).'+'.(int) ceil(($seg - $reg) / 60)."'";
        }

        return (intdiv($seg, 60) + 1 + ($e['periodo'] - 1) * $e['dur'])."'";
    }

    private function time(array $d): string
    {
        $t = $d['time'] ?? '';
        $this->exigir(in_array($t, ['a', 'b'], true), 'Informe o time (a ou b).');

        return $t;
    }

    private function opcionalEmCampo(array $e, string $t, $id): ?int
    {
        if ($id === null || $id === '') {
            return null;
        }

        return $this->obrigatorioEmCampo($e, $t, $id);
    }

    private function obrigatorioEmCampo(array $e, string $t, $id): int
    {
        $id = (int) $id;
        $this->exigir($e['campo'][$t] !== null && in_array($id, $e['campo'][$t], true), 'O jogador precisa estar em campo nesse time.');

        return $id;
    }

    private function nome(int $id): string
    {
        return Aluno::withTrashed()->find($id)?->primeiroNome() ?? 'Jogador';
    }

    /** @return int[] */
    private function ids(array $ids): array
    {
        return array_values(array_unique(array_map('intval', $ids)));
    }

    private function exigir(bool $condicao, string $mensagem): void
    {
        if (! $condicao) {
            abort(422, $mensagem);
        }
    }
}
