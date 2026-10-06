<?php

namespace Database\Factories;

use App\Enums\Papel;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<User> */
class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'nome' => fake()->name(),
            'username' => Str::lower(Str::random(10)),
            'papel' => Papel::Aluno,
            'password' => 'senha123',
            'precisa_trocar_senha' => false,
        ];
    }

    public function papel(Papel $papel): static
    {
        return $this->state(fn () => ['papel' => $papel]);
    }
}
