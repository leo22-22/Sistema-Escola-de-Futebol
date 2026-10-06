<?php

namespace App\Http\Requests;

use App\Models\Evento;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EventoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $grupo = $this->input('grupo');
        $modalidades = Evento::MODALIDADES[$grupo] ?? [];

        return [
            'categoria_id' => ['required', 'exists:categorias,id'],
            'grupo' => ['required', Rule::in(['treino', 'jogo'])],
            'modalidade' => ['required', Rule::in($modalidades)],
            'titulo' => ['required_if:grupo,treino', 'nullable', 'string', 'max:120'],
            'adversario' => ['required_if:grupo,jogo', 'nullable', 'string', 'max:120'],
            'mando' => ['nullable', Rule::in(['casa', 'fora'])],
            'data' => ['required', 'date'],
            'hora_inicio' => ['required', 'date_format:H:i'],
            'hora_fim' => ['required', 'date_format:H:i', 'after:hora_inicio'],
            'chegada' => ['nullable', 'date_format:H:i'],
            'local' => ['required', 'string', 'max:160'],
            'uniforme' => ['nullable', 'string', 'max:160'],
            'levar' => ['nullable', 'array'],
            'levar.*' => [Rule::in(Evento::ITENS_LEVAR)],
            'plano' => ['nullable', 'array'],
            'plano.objetivo' => ['nullable', 'string', 'max:200'],
            'plano.atividades' => ['nullable', 'array', 'max:20'],
            'plano.atividades.*.nome' => ['nullable', 'string', 'max:120'],
            'plano.atividades.*.minutos' => ['nullable', 'integer', 'between:1,180'],
            'plano.atividades.*.lousa_id' => ['nullable', 'exists:lousas,id'],
            'observacoes' => ['nullable', 'string', 'max:1000'],
            'repetir' => ['nullable', 'boolean'],
            'dias_semana' => ['required_if_accepted:repetir', 'array'],
            'dias_semana.*' => ['integer', 'between:0,6'],
            'repetir_ate' => ['required_if_accepted:repetir', 'nullable', 'date', 'after_or_equal:data'],
        ];
    }

    public function messages(): array
    {
        return ['hora_fim.after' => 'O horário de fim precisa ser depois do início.'];
    }
}
