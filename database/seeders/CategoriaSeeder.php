<?php

namespace Database\Seeders;

use App\Models\Categoria;
use Illuminate\Database\Seeder;

class CategoriaSeeder extends Seeder
{
    public function run(): void
    {
        for ($n = (int) config('escolinha.idade_minima'); $n <= (int) config('escolinha.idade_maxima'); $n++) {
            Categoria::updateOrCreate(['idade' => $n], ['slug' => 'sub'.$n, 'nome' => 'Sub-'.$n]);
        }
    }
}
