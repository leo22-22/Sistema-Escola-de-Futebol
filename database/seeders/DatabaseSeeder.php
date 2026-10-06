<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            CategoriaSeeder::class,
            EquipeSeeder::class,
        ]);

        if (app()->environment('local') || config('app.demo', env('APP_DEMO', false))) {
            $this->call(DemonstracaoSeeder::class);
        }
    }
}
