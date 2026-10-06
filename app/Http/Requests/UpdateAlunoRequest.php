<?php

namespace App\Http\Requests;

use App\Enums\Posicao;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAlunoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nome' => ['sometimes', 'string', 'max:120'],
            'nascimento' => ['sometimes', 'date', 'before:today'],
            'posicoes' => ['sometimes', 'array', 'min:1', 'max:10'],
            'posicoes.*' => ['distinct', Rule::in(Posicao::valores())],
            'numero_camisa' => ['sometimes', 'nullable', 'integer', 'between:1,99'],
            'pe_dominante' => ['sometimes', 'nullable', Rule::in(['direito', 'esquerdo', 'ambos'])],
            'tamanho_uniforme' => ['sometimes', 'nullable', 'string', 'max:5'],
            'foto' => ['nullable', 'image', 'max:8192'],
        ];
    }
}
