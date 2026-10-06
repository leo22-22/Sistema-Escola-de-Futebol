<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Bloqueia o app até o usuário trocar a senha inicial. */
class ExigeSenhaTrocada
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->precisa_trocar_senha) {
            return response()->json(['message' => 'Troque a senha inicial para continuar.', 'codigo' => 'trocar_senha'], 423);
        }

        return $next($request);
    }
}
