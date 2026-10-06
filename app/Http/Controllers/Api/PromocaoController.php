<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Aluno;
use App\Models\Categoria;
use App\Services\Promocoes;
use Illuminate\Http\Request;

class PromocaoController extends Controller
{
    public function __construct(private Promocoes $promocoes) {}

    public function index()
    {
        return response()->json($this->promocoes->sugestoes());
    }

    public function promover(Request $r)
    {
        $d = $r->validate(['alunos' => ['required', 'array', 'min:1'], 'alunos.*' => ['integer', 'exists:alunos,id']]);
        $total = $this->promocoes->promoverLote($d['alunos'], $r->user());

        return response()->json(['mensagem' => "{$total} alunos promovidos.", 'total' => $total]);
    }

    public function mudarCategoria(Request $r, Aluno $aluno)
    {
        $d = $r->validate(['categoria_id' => ['required', 'exists:categorias,id']]);
        abort_if((int) $d['categoria_id'] === (int) $aluno->categoria_id, 422, 'O aluno já está nessa categoria.');
        $this->promocoes->mover($aluno, Categoria::findOrFail($d['categoria_id']), $r->user());

        return response()->json(['mensagem' => 'Categoria alterada.']);
    }
}
