<?php

namespace App\Services;

use App\Models\Aluno;
use App\Models\User;
use App\Notifications\Aviso;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Notification;

class Notificador
{
    /** Avisa o aluno e o responsável dele. */
    public function aluno(Aluno $aluno, string $titulo, string $texto, string $tipo = 'geral', array $dados = []): void
    {
        $aluno->loadMissing('user', 'responsavel');
        $this->enviar(collect([$aluno->user, $aluno->responsavel]), $titulo, $texto, $tipo, $dados);
    }

    /** Avisa alunos (e responsáveis) de uma lista. */
    public function alunos(Collection $alunos, string $titulo, string $texto, string $tipo = 'geral', array $dados = []): void
    {
        $alunos->loadMissing('user', 'responsavel');
        $usuarios = $alunos->flatMap(fn (Aluno $a) => [$a->user, $a->responsavel]);
        $this->enviar($usuarios, $titulo, $texto, $tipo, $dados);
    }

    /** Avisa toda a categoria. */
    public function categoria(int $categoriaId, string $titulo, string $texto, string $tipo = 'geral', array $dados = []): void
    {
        $alunos = Aluno::with('user', 'responsavel')->where('categoria_id', $categoriaId)->get();
        $this->alunos($alunos, $titulo, $texto, $tipo, $dados);
    }

    private function enviar(Collection $usuarios, string $titulo, string $texto, string $tipo, array $dados): void
    {
        $destino = $usuarios->filter(fn ($u) => $u instanceof User)->unique('id')->values();
        if ($destino->isEmpty()) {
            return;
        }
        Notification::send($destino, new Aviso($titulo, $texto, $tipo, $dados));
    }
}
