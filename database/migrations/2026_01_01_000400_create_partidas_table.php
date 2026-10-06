<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partidas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evento_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('iniciada_por')->nullable()->constrained('users')->nullOnDelete();
            $table->json('estado');
            $table->json('historico')->nullable()->comment('Pilha de estados para desfazer');
            $table->timestamps();
        });

        Schema::create('lances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evento_id')->constrained()->cascadeOnDelete();
            $table->enum('tipo', ['gol', 'chute', 'defesa', 'penalti_defendido', 'amarelo', 'vermelho', 'substituicao']);
            $table->enum('time', ['a', 'b']);
            $table->foreignId('aluno_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('assistencia_id')->nullable()->constrained('alunos')->nullOnDelete();
            $table->foreignId('sai_id')->nullable()->constrained('alunos')->nullOnDelete();
            $table->foreignId('entra_id')->nullable()->constrained('alunos')->nullOnDelete();
            $table->string('detalhe', 20)->nullable();
            $table->string('minuto', 10);
            $table->unsignedInteger('segundo_jogo')->default(0);
            $table->timestamps();
            $table->index(['aluno_id', 'tipo']);
            $table->index(['assistencia_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lances');
        Schema::dropIfExists('partidas');
    }
};
