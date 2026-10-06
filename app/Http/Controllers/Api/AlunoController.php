<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAlunoRequest;
use App\Http\Requests\UpdateAlunoRequest;
use App\Http\Resources\AlunoResource;
use App\Models\Aluno;
use App\Models\User;
use App\Services\CadastroAlunos;
use App\Services\Senhas;
use Illuminate\Http\Request;

class AlunoController extends Controller
{
    public function __construct(private CadastroAlunos $cadastro) {}

    public function index(Request $r)
    {
        $r->validate(['categoria_id' => ['nullable', 'integer'], 'busca' => ['nullable', 'string', 'max:60'], 'por_pagina' => ['nullable', 'integer', 'between:1,500']]);
        $q = Aluno::with('user', 'categoria', 'responsavel')->whereIn('id', $r->user()->alunosVisiveisIds());
        if ($r->filled('categoria_id')) {
            $q->where('categoria_id', $r->integer('categoria_id'));
        }
        if ($r->filled('busca')) {
            $b = '%'.$r->input('busca').'%';
            $q->where(fn ($w) => $w->where('nome', 'like', $b)->orWhereHas('user', fn ($u) => $u->where('username', 'like', $b)));
        }

        return AlunoResource::collection($q->orderBy('nome')->paginate($r->integer('por_pagina', 50)));
    }

    public function show(Request $r, Aluno $aluno)
    {
        $this->exigirVisaoAluno($r, $aluno);

        return new AlunoResource($aluno->load('user', 'categoria', 'responsavel'));
    }

    public function store(StoreAlunoRequest $r)
    {
        $res = $this->cadastro->criar($r->validated(), $r->file('foto'));
        $a = $res['aluno']->load('user', 'categoria', 'responsavel');

        return response()->json([
            'aluno' => new AlunoResource($a),
            'acessos' => [
                'aluno' => ['login' => $a->user->username, 'senha_inicial' => $res['senha_inicial']],
                'responsavel' => ['login' => $a->responsavel->celular, 'senha_inicial' => $res['responsavel_novo'] ? $res['senha_inicial'] : null, 'ja_tinha_conta' => ! $res['responsavel_novo']],
                'observacao' => 'A senha precisa ser trocada no primeiro acesso.',
            ],
        ], 201);
    }

    public function update(UpdateAlunoRequest $r, Aluno $aluno)
    {
        $this->exigirGestaoAluno($r, $aluno);

        return new AlunoResource($this->cadastro->atualizar($aluno, $r->validated(), $r->file('foto'))->load('user', 'categoria', 'responsavel'));
    }

    public function destroy(Request $r, Aluno $aluno)
    {
        $this->exigirGestaoAluno($r, $aluno);
        $aluno->user->tokens()->delete();
        $aluno->delete();
        // Responsável que ficou sem nenhum aluno ativo também perde a sessão
        $resp = $aluno->responsavel;
        if ($resp && ! $resp->dependentes()->exists()) {
            $resp->tokens()->delete();
        }

        return response()->noContent();
    }

    public function resetarSenha(Request $r, Aluno $aluno)
    {
        $this->exigirGestaoAluno($r, $aluno);

        return response()->json(['login' => $aluno->user->username, 'senha_inicial' => $this->cadastro->resetarSenha($aluno)]);
    }

    public function sugerirUsuario(Request $r)
    {
        $r->validate(['nome' => ['required', 'string', 'max:120']]);

        return response()->json(['username' => Senhas::sugerirUsuario($r->input('nome'), fn ($u) => User::where('username', $u)->exists())]);
    }
}
