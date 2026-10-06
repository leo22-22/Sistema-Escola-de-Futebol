<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categorias', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 20)->unique();
            $table->string('nome', 20);
            $table->unsignedTinyInteger('idade')->unique()->comment('Sub-N: alunos que completam N anos ou menos no ano');
            $table->timestamps();
        });

        Schema::create('categoria_professor', function (Blueprint $table) {
            $table->foreignId('categoria_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->primary(['categoria_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categoria_professor');
        Schema::dropIfExists('categorias');
    }
};
