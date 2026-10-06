<?php

namespace App\Http\Controllers\Api;

use App\Enums\Papel;
use App\Http\Controllers\Controller;
use App\Http\Resources\EventoResource;
use App\Models\Aluno;
use App\Models\Categoria;
use App\Models\Dica;
use App\Models\Evento;
use App\Models\Meta;
use App\Models\Partida;
use App\Services\Estatisticas;
use App\Services\PartidaAoVivo;
use App\Services\Promocoes;
use Illuminate\Http\Request;

/** Tela inicial de cada perfil. Para aluno/responsável, passe ?aluno_id= quando houver mais de um. */
class InicioController extends Controller
{
    public function __construct(private Estatisticas $estatisticas, private Promocoes $promocoes, private PartidaAoVivo $motor) {}

    public function show(Request $r)
    {
        return match ($r->user()->papel) {
            Papel::Dono => $this->dono($r),
            Papel::Professor => $this->professor($r),
            default => $this->aluno($r),
        };
    }

    private function dono(Request $r)
    {
        $promo = $this->promocoes->sugestoes();

        return response()->json([
            'alunos' => Aluno::count(),
            'categorias_com_alunos' => Categoria::has('alunos')->count(),
            'aguardando_primeiro_acesso' => Aluno::whereHas('user', fn ($q) => $q->where('precisa_trocar_senha', true))->with('user:id,username')->orderBy('nome')->get(['id', 'nome', 'user_id'])
                ->map(fn ($a) => ['id' => $a->id, 'nome' => $a->nome, 'username' => $a->user->username]),
            'eventos_7_dias' => Evento::ativos()->whereBetween('data', [today(), today()->addDays(7)])->count(),
            'promocao' => ['mostrar_aviso' => $promo['mostrar_aviso'], 'total' => count($promo['sugestoes']), 'ano' => $promo['ano']],
        ] + $this->professor($r, true));
    }

    private function professor(Request $r, bool $comoArray = false)
    {
        $cats = $r->user()->categoriaIdsGeridas();
        $proximos = Evento::with('categoria', 'alunos:id,nome', 'partida:id,evento_id')->whereIn('categoria_id', $cats)->ativos()->whereNull('encerrado_em')
            ->where('data', '>=', today())->orderBy('data')->orderBy('hora_inicio')->limit(5)->get();
        $semChamada = Evento::with('categoria')->whereIn('categoria_id', $cats)->ativos()->where('grupo', 'treino')
            ->whereBetween('data', [today()->subDays(14), today()])
            ->whereDoesntHave('alunos', fn ($q) => $q->whereNotNull('evento_aluno.chamada'))->orderByDesc('data')->get();
        $semConvocacao = Evento::with('categoria')->whereIn('categoria_id', $cats)->ativos()->whereNull('encerrado_em')->where('grupo', 'jogo')
            ->whereBetween('data', [today(), today()->addDays(10)])
            ->whereDoesntHave('alunos', fn ($q) => $q->where('evento_aluno.convocado', true))->get();
        $alunos = Aluno::whereIn('categoria_id', $cats)->pluck('id');
        $partidas = Partida::with('evento')->whereHas('evento', fn ($q) => $q->whereIn('categoria_id', $cats))->get();

        $dados = [
            'partidas_em_andamento' => $partidas->map(fn ($p) => ['evento_id' => $p->evento_id, 'titulo' => $p->evento->tituloExibicao()] + array_intersect_key($this->motor->publico($p), array_flip(['placar', 'periodo', 'fase', 'times']))),
            'proximos' => EventoResource::collection($proximos),
            'pendencias' => [
                'chamadas' => $semChamada->map(fn ($e) => ['evento_id' => $e->id, 'titulo' => $e->titulo, 'categoria' => $e->categoria->nome, 'data' => $e->data->toDateString()]),
                'jogos_sem_convocacao' => $semConvocacao->map(fn ($e) => ['evento_id' => $e->id, 'titulo' => $e->tituloExibicao(), 'categoria' => $e->categoria->nome, 'data' => $e->data->toDateString()]),
                'metas_atrasadas' => Meta::with('aluno:id,nome')->whereIn('aluno_id', $alunos)->where('status', 'andamento')->where('prazo', '<', today())->get(['id', 'aluno_id', 'texto', 'prazo']),
                'dicas_nao_lidas' => Dica::whereIn('aluno_id', $alunos)->whereNull('lida_em')->count(),
            ],
        ];

        return $comoArray ? $dados : response()->json($dados);
    }

    private function aluno(Request $r)
    {
        $ids = $r->user()->alunosVisiveisIds();
        abort_if(! $ids, 404, 'Nenhum aluno vinculado a este acesso.');
        $id = $r->filled('aluno_id') ? $r->integer('aluno_id') : $ids[0];
        abort_unless(in_array($id, $ids, true), 403);
        $a = Aluno::with('categoria')->findOrFail($id);
        $s = $this->estatisticas->doAluno($a);
        $proximo = Evento::with('categoria', 'alunos:id,nome', 'partida:id,evento_id')->where('categoria_id', $a->categoria_id)->ativos()->whereNull('encerrado_em')
            ->where('data', '>=', today())->orderBy('data')->orderBy('hora_inicio')->first();
        $dica = $a->dicas()->orderByDesc('fixada')->latest()->first();

        return response()->json([
            'aluno' => ['id' => $a->id, 'nome' => $a->nome, 'categoria' => $a->categoria->nome, 'numero' => $a->numero_camisa, 'foto_url' => $a->fotoUrl()],
            'estatisticas' => $s,
            'nivel' => $this->estatisticas->nivel($s),
            'proximo' => $proximo ? new EventoResource($proximo) : null,
            'dica' => $dica,
            'metas' => $a->metas()->where('status', 'andamento')->orderBy('prazo')->get(['id', 'texto', 'prazo']),
            'conquistas_novas' => $a->conquistas()->whereNull('vista_em')->pluck('codigo'),
            'avisos_nao_lidos' => $r->user()->unreadNotifications()->count(),
        ]);
    }
}
