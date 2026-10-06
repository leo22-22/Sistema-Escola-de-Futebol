<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lousa;
use App\Services\Notificador;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LousaController extends Controller
{
    public function __construct(private Notificador $notificador) {}

    public function index(Request $r)
    {
        $r->validate(['categoria_id' => ['nullable', 'integer'], 'tipo' => ['nullable', 'string']]);
        $cats = $r->user()->categoriaIdsVisiveis();
        if ($r->filled('categoria_id')) {
            $this->exigirVisaoCategoria($r, $r->integer('categoria_id'));
            $cats = [$r->integer('categoria_id')];
        }

        return Lousa::whereIn('categoria_id', $cats)
            ->when($r->filled('tipo'), fn ($q) => $q->where('tipo', $r->input('tipo')))
            ->select(['id', 'categoria_id', 'nome', 'tipo', 'descricao', 'jogadores_por_time', 'updated_at'])
            ->selectRaw('gravacao IS NOT NULL as tem_gravacao')
            ->latest()->get()
            ->map(fn ($l) => array_merge($l->toArray(), ['tem_gravacao' => (bool) $l->tem_gravacao]));
    }

    public function show(Request $r, Lousa $lousa)
    {
        $this->exigirVisaoCategoria($r, (int) $lousa->categoria_id);

        return $lousa;
    }

    public function store(Request $r)
    {
        $d = $this->validar($r);
        $this->exigirGestaoCategoria($r, (int) $d['categoria_id']);
        $lousa = Lousa::create($d + ['criado_por' => $r->user()->id]);
        $this->notificador->categoria($lousa->categoria_id, 'Nova jogada', "O professor compartilhou: {$lousa->nome} ({$lousa->tipo}).", 'jogada', ['lousa_id' => $lousa->id]);

        return response()->json($lousa, 201);
    }

    public function update(Request $r, Lousa $lousa)
    {
        $this->exigirGestaoCategoria($r, (int) $lousa->categoria_id);
        $d = $this->validar($r);
        $this->exigirGestaoCategoria($r, (int) $d['categoria_id']);
        $lousa->update($d);

        return $lousa;
    }

    public function destroy(Request $r, Lousa $lousa)
    {
        $this->exigirGestaoCategoria($r, (int) $lousa->categoria_id);
        $lousa->delete();

        return response()->noContent();
    }

    private function validar(Request $r): array
    {
        $d = $r->validate([
            'categoria_id' => ['required', 'exists:categorias,id'],
            'nome' => ['required', 'string', 'max:120'],
            'tipo' => ['required', Rule::in(Lousa::TIPOS)],
            'descricao' => ['nullable', 'string', 'max:2000'],
            'jogadores_por_time' => ['required', 'integer', 'between:5,11'],
            'dados' => ['required', 'array'],
            'dados.casa' => ['required', 'array'],
            'dados.fora' => ['required', 'array'],
            'dados.bola' => ['required', 'array'],
            'gravacao' => ['nullable', 'array'],
            'gravacao.dur' => ['required_with:gravacao', 'integer', 'between:1,'.config('escolinha.gravacao_max_ms')],
            'gravacao.frames' => ['required_with:gravacao', 'array', 'max:5000'],
            'gravacao.itens' => ['required_with:gravacao', 'array'],
        ]);
        abort_if(strlen(json_encode($r->input('gravacao'))) > 2_000_000, 422, 'A gravação ficou grande demais. Grave uma jogada mais curta.');

        return $d;
    }
}
