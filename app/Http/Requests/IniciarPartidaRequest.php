<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class IniciarPartidaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'n' => ['required', 'integer', 'between:5,11'],
            'duracao' => ['required', 'integer', 'between:5,45'],
            'tempos' => ['required', 'integer', 'in:1,2'],
            'adversario' => ['nullable', 'string', 'max:120'],
            'titulares' => ['nullable', 'array'],
            'titulares.*' => ['integer', 'exists:alunos,id'],
            'reservas' => ['nullable', 'array'],
            'reservas.*' => ['integer', 'exists:alunos,id'],
            'time_a' => ['nullable', 'array'],
            'time_a.*' => ['integer', 'exists:alunos,id'],
            'time_b' => ['nullable', 'array'],
            'time_b.*' => ['integer', 'exists:alunos,id'],
            'acao_id' => ['nullable', 'string', 'max:40', 'regex:/^[A-Za-z0-9_-]+$/'],
            'em' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
