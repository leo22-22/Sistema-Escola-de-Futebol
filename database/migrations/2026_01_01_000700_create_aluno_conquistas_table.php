<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('aluno_conquistas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('aluno_id')->constrained()->cascadeOnDelete();
            $table->string('codigo', 20);
            $table->timestamp('conquistada_em');
            $table->timestamp('vista_em')->nullable();
            $table->timestamps();
            $table->unique(['aluno_id', 'codigo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('aluno_conquistas');
    }
};
