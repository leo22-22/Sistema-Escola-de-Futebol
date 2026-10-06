<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Aluno;
use App\Services\Conquistas;
use App\Services\Estatisticas;
use Illuminate\Http\Request;

class CartaController extends Controller
{
    public function __construct(private Estatisticas $estatisticas) {}

    public function show(Request $r, Aluno $aluno)
    {
        $this->exigirVisaoAluno($r, $aluno);
        $s = $this->estatisticas->doAluno($aluno);
        $tem = $aluno->conquistas()->get()->keyBy('codigo');
        $dica = $aluno->dicas()->orderByDesc('fixada')->latest()->first();

        return response()->json([
            'aluno' => ['id' => $aluno->id, 'nome' => $aluno->nome, 'numero' => $aluno->numero_camisa, 'posicoes' => $aluno->posicoes, 'categoria' => $aluno->categoria->nome, 'foto_url' => $aluno->fotoUrl()],
            'estatisticas' => $s,
            'nivel' => $this->estatisticas->nivel($s),
            'conquistas' => collect(Conquistas::catalogo())->map(fn ($c, $codigo) => [
                'codigo' => $codigo,
                'nome' => $c['nome'],
                'valoriza' => $c['valoriza'],
                'liberada' => $tem->has($codigo),
                'nova' => $tem->has($codigo) && $tem[$codigo]->vista_em === null,
                'em' => $tem->get($codigo)?->conquistada_em,
            ])->values(),
            'dica' => $dica ? ['id' => $dica->id, 'tipo' => $dica->tipo, 'texto' => $dica->texto, 'entendida' => $dica->entendida_em !== null] : null,
            'metas' => $aluno->metas()->where('status', 'andamento')->orderBy('prazo')->get(['id', 'texto', 'prazo']),
        ]);
    }

    /** Depois da animação de "conquista desbloqueada". */
    public function marcarVistas(Request $r, Aluno $aluno)
    {
        $this->exigirVisaoAluno($r, $aluno);
        $aluno->conquistas()->whereNull('vista_em')->update(['vista_em' => now()]);

        return response()->noContent();
    }
}
