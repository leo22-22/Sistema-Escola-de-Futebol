<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('eventos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('categoria_id')->constrained()->cascadeOnDelete();
            $table->foreignId('criado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('grupo', ['treino', 'jogo']);
            $table->string('modalidade', 30)->comment('Tático, Coletivo, Amistoso, Teste...');
            $table->string('titulo');
            $table->string('adversario')->nullable();
            $table->enum('mando', ['casa', 'fora'])->default('casa');
            $table->date('data');
            $table->time('hora_inicio');
            $table->time('hora_fim');
            $table->time('chegada')->nullable();
            $table->string('local');
            $table->string('uniforme')->nullable();
            $table->json('levar')->nullable();
            $table->json('plano')->nullable()->comment('{objetivo, atividades:[{nome, minutos, lousa_id}]}');
            $table->text('observacoes')->nullable();
            $table->uuid('serie')->nullable()->index();
            $table->boolean('rapida')->default(false);
            $table->timestamp('cancelado_em')->nullable();
            $table->string('motivo_cancelamento')->nullable();
            $table->timestamp('encerrado_em')->nullable();
            $table->unsignedTinyInteger('placar_casa')->nullable();
            $table->unsignedTinyInteger('placar_fora')->nullable();
            $table->boolean('conta_na_carta')->default(true);
            $table->json('estatisticas')->nullable();
            $table->text('observacao_professor')->nullable();
            $table->timestamp('lembrete_24h_em')->nullable();
            $table->timestamp('lembrete_2h_em')->nullable();
            $table->timestamps();
            $table->index(['categoria_id', 'data']);
        });

        Schema::create('evento_aluno', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evento_id')->constrained()->cascadeOnDelete();
            $table->foreignId('aluno_id')->constrained()->cascadeOnDelete();
            $table->boolean('convocado')->default(false);
            $table->enum('confirmacao', ['vai', 'nao_vai'])->nullable();
            $table->timestamp('confirmado_em')->nullable();
            $table->enum('chamada', ['presente', 'falta', 'justificada'])->nullable();
            $table->boolean('participou')->default(false);
            $table->unsignedSmallInteger('minutos')->nullable();
            $table->timestamps();
            $table->unique(['evento_id', 'aluno_id']);
            $table->index(['aluno_id', 'chamada']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evento_aluno');
        Schema::dropIfExists('eventos');
    }
};
