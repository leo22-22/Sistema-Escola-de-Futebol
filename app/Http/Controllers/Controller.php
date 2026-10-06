<?php

namespace App\Http\Controllers;

use App\Models\Aluno;
use App\Models\Evento;
use Illuminate\Http\Request;

abstract class Controller
{
    protected function exigirGestaoCategoria(Request $r, int $categoriaId): void
    {
        abort_unless($r->user()->podeGerirCategoria($categoriaId), 403, 'Você não tem acesso a esta categoria.');
    }

    protected function exigirVisaoCategoria(Request $r, int $categoriaId): void
    {
        abort_unless(in_array($categoriaId, $r->user()->categoriaIdsVisiveis(), true), 403, 'Você não tem acesso a esta categoria.');
    }

    protected function exigirVisaoAluno(Request $r, Aluno $aluno): void
    {
        abort_unless($r->user()->podeVerAluno($aluno), 403, 'Você não tem acesso a este aluno.');
    }

    protected function exigirGestaoAluno(Request $r, Aluno $aluno): void
    {
        $this->exigirGestaoCategoria($r, (int) $aluno->categoria_id);
    }

    protected function exigirGestaoEvento(Request $r, Evento $evento): void
    {
        $this->exigirGestaoCategoria($r, (int) $evento->categoria_id);
    }

    protected function exigirVisaoEvento(Request $r, Evento $evento): void
    {
        $this->exigirVisaoCategoria($r, (int) $evento->categoria_id);
    }
}
