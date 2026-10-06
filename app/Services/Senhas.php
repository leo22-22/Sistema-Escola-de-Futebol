<?php

namespace App\Services;

use Illuminate\Support\Str;

class Senhas
{
    /** Senha inicial: primeiro nome + ano (ex.: Joao2026). Troca obrigatória no primeiro acesso. */
    public static function padrao(string $nome): string
    {
        $primeiro = Str::ascii(explode(' ', trim($nome))[0]);

        return Str::ucfirst(Str::lower($primeiro)).now()->year;
    }

    public static function somenteDigitos(?string $celular): ?string
    {
        if ($celular === null) {
            return null;
        }
        $d = preg_replace('/\D/', '', $celular);

        return $d === '' ? null : $d;
    }

    public static function sugerirUsuario(string $nome, callable $existe): string
    {
        $partes = array_values(array_filter(explode(' ', Str::lower(Str::ascii($nome))), fn ($p) => preg_match('/^[a-z]+$/', $p)));
        $base = count($partes) > 1 ? $partes[0].'.'.end($partes) : ($partes[0] ?? 'aluno');
        $u = $base;
        $k = 2;
        while ($existe($u)) {
            $u = $base.$k;
            $k++;
        }

        return $u;
    }
}
