<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dicas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('aluno_id')->constrained()->cascadeOnDelete();
            $table->foreignId('professor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('tipo', ['Técnica', 'Tática', 'Física', 'Comportamento', 'Elogio']);
            $table->text('texto');
            $table->foreignId('evento_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('lousa_id')->nullable()->constrained()->nullOnDelete();
            $table->boolean('fixada')->default(false);
            $table->timestamp('lida_em')->nullable();
            $table->timestamp('entendida_em')->nullable();
            $table->timestamps();
            $table->index(['aluno_id', 'fixada']);
        });

        Schema::create('metas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('aluno_id')->constrained()->cascadeOnDelete();
            $table->foreignId('professor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('texto');
            $table->date('prazo');
            $table->enum('status', ['andamento', 'concluida'])->default('andamento');
            $table->timestamp('concluida_em')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('metas');
        Schema::dropIfExists('dicas');
    }
};
