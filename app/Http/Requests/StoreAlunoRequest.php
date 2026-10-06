<?php

namespace App\Http\Requests;

use App\Enums\Posicao;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAlunoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('username')) {
            $this->merge(['username' => strtolower(trim((string) $this->input('username')))]);
        }
    }

    public function rules(): array
    {
        return [
            'nome' => ['required', 'string', 'max:120'],
            'nascimento' => ['required', 'date', 'before:today'],
            'categoria_id' => ['required', 'exists:categorias,id'],
            'posicoes' => ['required', 'array', 'min:1', 'max:10'],
            'posicoes.*' => ['distinct', Rule::in(Posicao::valores())],
            'numero_camisa' => ['nullable', 'integer', 'between:1,99'],
            'pe_dominante' => ['nullable', Rule::in(['direito', 'esquerdo', 'ambos'])],
            'tamanho_uniforme' => ['nullable', 'string', 'max:5'],
            'username' => ['required', 'regex:/^[a-z0-9._]{3,24}$/', 'unique:users,username'],
            'responsavel_nome' => ['required', 'string', 'max:120'],
            'responsavel_celular' => ['required', 'string', 'min:10', 'max:20'],
            'termo_aceito' => ['accepted'],
            'foto' => ['nullable', 'image', 'max:8192'],
        ];
    }

    public function messages(): array
    {
        return [
            'username.regex' => 'O nome de usuário deve ter de 3 a 24 caracteres: letras minúsculas, números, ponto ou sublinhado.',
            'username.unique' => 'Esse nome de usuário já existe.',
            'termo_aceito.accepted' => 'O responsável precisa aceitar o termo de uso de imagem e dados.',
            'posicoes.required' => 'Escolha pelo menos a posição principal.',
        ];
    }
}
