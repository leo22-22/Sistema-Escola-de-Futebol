<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Uso: ->middleware('papel:dono,professor') */
class ExigePapel
{
    public function handle(Request $request, Closure $next, string ...$papeis): Response
    {
        $papel = $request->user()?->papel?->value;
        abort_unless($papel !== null && in_array($papel, $papeis, true), 403, 'Seu perfil não tem acesso a esta área.');

        return $next($request);
    }
}
