<?php

namespace Database\Seeders;

use App\Enums\Papel;
use App\Models\Categoria;
use App\Models\User;
use Illuminate\Database\Seeder;

/** Usuário do dono e um professor. Troque as senhas no primeiro acesso. */
class EquipeSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(['username' => 'dono'], [
            'nome' => env('DONO_NOME', 'Dono da escolinha'),
            'email' => env('DONO_EMAIL'),
            'papel' => Papel::Dono,
            'password' => env('DONO_SENHA_INICIAL', 'CaioPina'.now()->year),
            'precisa_trocar_senha' => true,
        ]);

        $prof = User::updateOrCreate(['username' => 'professor'], [
            'nome' => 'Professor',
            'papel' => Papel::Professor,
            'password' => 'Professor'.now()->year,
            'precisa_trocar_senha' => true,
        ]);
        $prof->categorias()->sync(Categoria::pluck('id'));
    }
}
