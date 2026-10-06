<?php

namespace App\Http\Resources;

use App\Enums\Posicao;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Aluno */
class AlunoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $gestor = $request->user()?->ehGestor() ?? false;
        $principal = $this->posicaoPrincipal();

        return [
            'id' => $this->id,
            'nome' => $this->nome,
            'username' => $this->whenLoaded('user', fn () => $this->user->username),
            'categoria' => $this->whenLoaded('categoria', fn () => ['id' => $this->categoria->id, 'nome' => $this->categoria->nome]),
            'nascimento' => $this->nascimento->toDateString(),
            'posicoes' => $this->posicoes,
            'posicao_principal' => $principal ? ['sigla' => $principal->value, 'nome' => $principal->nome()] : null,
            'posicoes_nomes' => collect($this->posicoes)->map(fn ($p) => Posicao::tryFrom($p)?->nome())->filter()->values(),
            'numero_camisa' => $this->numero_camisa,
            'pe_dominante' => $this->pe_dominante,
            'tamanho_uniforme' => $this->tamanho_uniforme,
            'foto_url' => $this->fotoUrl(),
            'acesso_ativo' => $this->whenLoaded('user', fn () => ! $this->user->precisa_trocar_senha),
            'responsavel' => $this->when($gestor, fn () => $this->whenLoaded('responsavel', fn () => $this->responsavel ? [
                'nome' => $this->responsavel->nome,
                'celular' => $this->responsavel->celular,
                'acesso_ativo' => ! $this->responsavel->precisa_trocar_senha,
            ] : null)),
        ];
    }
}
