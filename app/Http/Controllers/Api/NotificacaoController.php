<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NotificacaoController extends Controller
{
    public function index(Request $r)
    {
        $u = $r->user();

        return response()->json([
            'nao_lidas' => $u->unreadNotifications()->count(),
            'itens' => $u->notifications()->limit(100)->get()->map(fn ($n) => ['id' => $n->id, 'lida' => $n->read_at !== null, 'em' => $n->created_at] + $n->data),
        ]);
    }

    public function marcarLidas(Request $r)
    {
        $r->user()->unreadNotifications->markAsRead();

        return response()->noContent();
    }
}
