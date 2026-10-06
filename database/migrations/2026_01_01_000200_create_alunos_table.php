<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alunos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('responsavel_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('categoria_id')->constrained()->restrictOnDelete();
            $table->string('nome');
            $table->date('nascimento');
            $table->json('posicoes')->comment('Lista ordenada: a primeira é a principal');
            $table->unsignedTinyInteger('numero_camisa')->nullable();
            $table->string('pe_dominante', 10)->nullable();
            $table->string('tamanho_uniforme', 5)->nullable();
            $table->string('foto_path')->nullable();
            $table->unsignedSmallInteger('treinos_base')->default(0)->comment('Presenças anteriores ao sistema');
            $table->boolean('promovido')->default(false);
            $table->string('termo_versao', 20)->nullable();
            $table->timestamp('termo_aceito_em')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['categoria_id', 'nome']);
        });

        Schema::create('promocoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('aluno_id')->constrained()->cascadeOnDelete();
            $table->foreignId('de_categoria_id')->constrained('categorias');
            $table->foreignId('para_categoria_id')->constrained('categorias');
            $table->foreignId('promovido_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promocoes');
        Schema::dropIfExists('alunos');
    }
};
