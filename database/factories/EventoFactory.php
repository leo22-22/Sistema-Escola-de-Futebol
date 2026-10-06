<?php

namespace Database\Factories;

use App\Models\Categoria;
use App\Models\Evento;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Evento> */
class EventoFactory extends Factory
{
    protected $model = Evento::class;

    public function definition(): array
    {
        return [
            'categoria_id' => Categoria::factory(),
            'grupo' => 'jogo',
            'modalidade' => 'Amistoso',
            'titulo' => 'Amistoso',
            'adversario' => 'EC Rival',
            'data' => today()->toDateString(),
            'hora_inicio' => '09:00',
            'hora_fim' => '10:30',
            'local' => 'Campo 2',
        ];
    }

    public function coletivo(): static
    {
        return $this->state(fn () => ['grupo' => 'treino', 'modalidade' => 'Coletivo', 'titulo' => 'Coletivo', 'adversario' => null]);
    }
}
