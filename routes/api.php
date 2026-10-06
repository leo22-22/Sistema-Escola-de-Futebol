<?php

use App\Http\Controllers\Api\AlunoController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartaController;
use App\Http\Controllers\Api\CategoriaController;
use App\Http\Controllers\Api\DicaController;
use App\Http\Controllers\Api\EventoController;
use App\Http\Controllers\Api\InicioController;
use App\Http\Controllers\Api\LousaController;
use App\Http\Controllers\Api\MetaController;
use App\Http\Controllers\Api\NotificacaoController;
use App\Http\Controllers\Api\PartidaController;
use App\Http\Controllers\Api\PromocaoController;
use App\Http\Controllers\Api\ResumoController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/senha', [AuthController::class, 'trocarSenha']);

    Route::middleware('senha.trocada')->group(function () {
        // Comum a todos (o acesso a cada registro é checado no controller)
        Route::get('/inicio', [InicioController::class, 'show']);
        Route::get('/categorias', [CategoriaController::class, 'index']);
        Route::get('/notificacoes', [NotificacaoController::class, 'index']);
        Route::post('/notificacoes/lidas', [NotificacaoController::class, 'marcarLidas']);

        Route::get('/alunos', [AlunoController::class, 'index']);
        Route::get('/alunos/{aluno}', [AlunoController::class, 'show']);
        Route::get('/alunos/{aluno}/carta', [CartaController::class, 'show']);
        Route::post('/alunos/{aluno}/conquistas/vistas', [CartaController::class, 'marcarVistas']);

        Route::get('/eventos', [EventoController::class, 'index']);
        Route::get('/eventos/{evento}', [EventoController::class, 'show']);
        Route::get('/eventos/{evento}/resumo', [ResumoController::class, 'show']);
        Route::get('/eventos/{evento}/partida', [PartidaController::class, 'show']);
        Route::post('/eventos/{evento}/confirmacao', [EventoController::class, 'confirmar'])->middleware('papel:aluno,responsavel');

        Route::get('/lousas', [LousaController::class, 'index']);
        Route::get('/lousas/{lousa}', [LousaController::class, 'show']);
        Route::get('/dicas', [DicaController::class, 'index']);
        Route::post('/dicas/{dica}/entendida', [DicaController::class, 'entendida'])->middleware('papel:aluno,responsavel');
        Route::get('/metas', [MetaController::class, 'index']);

        // Dono
        Route::middleware('papel:dono')->group(function () {
            Route::post('/alunos', [AlunoController::class, 'store']);
            Route::post('/alunos/{aluno}', [AlunoController::class, 'update']); // multipart (foto)
            Route::delete('/alunos/{aluno}', [AlunoController::class, 'destroy']);
            Route::post('/alunos/{aluno}/resetar-senha', [AlunoController::class, 'resetarSenha']);
            Route::post('/alunos/{aluno}/categoria', [PromocaoController::class, 'mudarCategoria']);
            Route::get('/usuarios/sugerir', [AlunoController::class, 'sugerirUsuario']);
            Route::get('/promocoes', [PromocaoController::class, 'index']);
            Route::post('/promocoes', [PromocaoController::class, 'promover']);
            Route::put('/categorias/{categoria}/professores', [CategoriaController::class, 'professores']);
        });

        // Dono e professor
        Route::middleware('papel:dono,professor')->group(function () {
            Route::post('/eventos', [EventoController::class, 'store']);
            Route::put('/eventos/{evento}', [EventoController::class, 'update']);
            Route::delete('/eventos/{evento}', [EventoController::class, 'destroy']);
            Route::get('/eventos/{evento}/presenca', [EventoController::class, 'presenca']);
            Route::post('/eventos/{evento}/cancelar', [EventoController::class, 'cancelar']);
            Route::post('/eventos/{evento}/reativar', [EventoController::class, 'reativar']);
            Route::post('/eventos/{evento}/duplicar', [EventoController::class, 'duplicar']);
            Route::put('/eventos/{evento}/convocacao', [EventoController::class, 'convocar']);
            Route::put('/eventos/{evento}/chamada', [EventoController::class, 'chamada']);
            Route::post('/eventos/{evento}/chamada-rapida', [EventoController::class, 'chamadaRapida']);
            Route::post('/eventos/{evento}/lembrete', [EventoController::class, 'lembrete']);

            Route::post('/partidas/rapida', [PartidaController::class, 'rapida']);
            Route::post('/eventos/{evento}/partida', [PartidaController::class, 'iniciar']);
            Route::post('/eventos/{evento}/partida/acoes', [PartidaController::class, 'acao']);
            Route::post('/eventos/{evento}/partida/encerrar', [PartidaController::class, 'encerrar']);
            Route::delete('/eventos/{evento}/partida', [PartidaController::class, 'descartar']);

            Route::post('/lousas', [LousaController::class, 'store']);
            Route::put('/lousas/{lousa}', [LousaController::class, 'update']);
            Route::delete('/lousas/{lousa}', [LousaController::class, 'destroy']);

            Route::post('/dicas', [DicaController::class, 'store']);
            Route::post('/dicas/{dica}/fixar', [DicaController::class, 'fixar']);
            Route::delete('/dicas/{dica}', [DicaController::class, 'destroy']);

            Route::post('/metas', [MetaController::class, 'store']);
            Route::put('/metas/{meta}', [MetaController::class, 'update']);
            Route::delete('/metas/{meta}', [MetaController::class, 'destroy']);
        });
    });
});
