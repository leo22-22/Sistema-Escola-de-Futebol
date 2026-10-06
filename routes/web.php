<?php

use Illuminate\Support\Facades\Route;

// O app (PWA) é a view resources/views/app.blade.php; CSS e JS ficam em public/css e public/js. A API fica em /api.
Route::get('/', fn () => response()->view('app')->header('Cache-Control', 'no-cache'));
