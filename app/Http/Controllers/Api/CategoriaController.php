<?php

namespace App\Http\Controllers\Api;

use App\Enums\Papel;
use App\Http\Controllers\Controller;
use App\Models\Categoria;
use App\Models\User;
use Illuminate\Http\Request;

class CategoriaController extends Controller
{
    public function index(Request $r)
    {
        $ids = $r->user()->categoriaIdsVisiveis();

        return Categoria::whereIn('id', $ids)->withCount('alunos')->with('professores:id,nome')->orderBy('idade')->get()
            ->map(fn (Categoria $c) => [
                'id' => $c->id,
                'nome' => $c->nome,
                'idade' => $c->idade,
                'ano_nascimento' => $c->ano_nascimento,
                'alunos' => $c->alunos_count,
                'professores' => $c->professores->map(fn ($p) => ['id' => $p->id, 'nome' => $p->nome]),
            ]);
    }

    /** Dono define quais professores cuidam da categoria. */
    public function professores(Request $r, Categoria $categoria)
    {
        $d = $r->validate(['professores' => ['present', 'array'], 'professores.*' => ['integer', 'exists:users,id']]);
        $validos = User::whereIn('id', $d['professores'])->where('papel', Papel::Professor)->pluck('id');
        $categoria->professores()->sync($validos);

        return response()->json(['mensagem' => 'Professores atualizados.']);
    }
}
