<?php

namespace App\Enums;

enum Papel: string
{
    case Dono = 'dono';
    case Professor = 'professor';
    case Aluno = 'aluno';
    case Responsavel = 'responsavel';

    public function gestor(): bool
    {
        return $this === self::Dono || $this === self::Professor;
    }
}
