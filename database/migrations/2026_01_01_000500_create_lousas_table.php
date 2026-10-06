<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lousas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('categoria_id')->constrained()->cascadeOnDelete();
            $table->foreignId('criado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->string('nome');
            $table->string('tipo', 30)->default('Saída de bola');
            $table->text('descricao')->nullable();
            $table->unsignedTinyInteger('jogadores_por_time')->default(7);
            $table->json('dados')->comment('casa, fora, bola, itens, formações, adversário e visão do campo');
            $table->json('gravacao')->nullable()->comment('{dur, nc, nf, frames:[{t,p}], itens:[{t,its}]}');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lousas');
    }
};
