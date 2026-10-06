<?php

namespace Database\Factories;

use App\Enums\Papel;
use App\Models\Aluno;
use App\Models\Categoria;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Aluno> */
class AlunoFactory extends Factory
{
    protected $model = Aluno::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory()->papel(Papel::Aluno),
            'categoria_id' => Categoria::factory(),
            'nome' => fake()->firstNameMale().' '.fake()->lastName(),
            'nascimento' => now()->subYears(11)->format('Y').'-05-10',
            'posicoes' => ['MEI'],
            'numero_camisa' => fake()->numberBetween(2, 99),
        ];
    }

    public function posicoes(array $p): static
    {
        return $this->state(fn () => ['posicoes' => $p]);
    }
}
