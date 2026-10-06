<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Aluno;
use App\Models\Meta;
use App\Services\Notificador;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MetaController extends Controller
{
    public function __construct(private Notificador $notificador) {}

    public function index(Request $r)
    {
        return Meta::with('aluno:id,nome,categoria_id')->whereIn('aluno_id', $r->user()->alunosVisiveisIds())
            ->orderByRaw("status = 'concluida'")->orderBy('prazo')->get()
            ->map(fn (Meta $m) => $m->toArray() + ['atrasada' => $m->atrasada()]);
    }

    public function store(Request $r)
    {
        $d = $r->validate(['aluno_id' => ['required', 'exists:alunos,id'], 'texto' => ['required', 'string', 'max:200'], 'prazo' => ['required', 'date', 'after_or_equal:today']]);
        $aluno = Aluno::findOrFail($d['aluno_id']);
        $this->exigirGestaoAluno($r, $aluno);
        $meta = Meta::create($d + ['professor_id' => $r->user()->id]);
        $this->notificador->aluno($aluno, 'Nova meta', $meta->texto.' (até '.$meta->prazo->format('d/m').')', 'meta');

        return response()->json($meta, 201);
    }

    public function update(Request $r, Meta $meta)
    {
        $this->exigirGestaoAluno($r, $meta->aluno);
        $d = $r->validate(['status' => ['required', Rule::in(['andamento', 'concluida'])]]);
        $meta->update(['status' => $d['status'], 'concluida_em' => $d['status'] === 'concluida' ? now() : null]);
        if ($d['status'] === 'concluida') {
            $this->notificador->aluno($meta->aluno, 'Meta concluída', $meta->texto.'. Parabéns!', 'meta');
        }

        return $meta;
    }

    public function destroy(Request $r, Meta $meta)
    {
        $this->exigirGestaoAluno($r, $meta->aluno);
        $meta->delete();

        return response()->noContent();
    }
}
