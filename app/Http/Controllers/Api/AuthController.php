<?php

namespace App\Http\Controllers\Api;

use App\Enums\Papel;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Senhas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /** Login por nome de usuário, e-mail ou celular. */
    public function login(Request $r)
    {
        $d = $r->validate([
            'login' => ['required', 'string', 'max:120'],
            'senha' => ['required', 'string'],
            'dispositivo' => ['nullable', 'string', 'max:60'],
        ]);
        $login = trim($d['login']);
        $digitos = Senhas::somenteDigitos($login);

        $user = User::where('username', strtolower($login))
            ->orWhere('email', strtolower($login))
            ->when($digitos && strlen($digitos) >= 10, fn ($q) => $q->orWhere('celular', $digitos))
            ->first();

        if (! $user || ! Hash::check($d['senha'], $user->password)) {
            throw ValidationException::withMessages(['login' => 'Usuário ou senha incorretos.']);
        }
        // Aluno removido pelo dono (ou responsável que só tinha alunos removidos) não entra mais
        $removido = match ($user->papel) {
            Papel::Aluno => ! $user->aluno()->exists() && $user->aluno()->onlyTrashed()->exists(),
            Papel::Responsavel => ! $user->dependentes()->exists() && $user->dependentes()->onlyTrashed()->exists(),
            default => false,
        };
        if ($removido) {
            throw ValidationException::withMessages(['login' => 'Este acesso foi desativado pela escolinha.']);
        }

        $user->update(['ultimo_acesso_em' => now()]);
        $token = $user->createToken($d['dispositivo'] ?? 'app')->plainTextToken;

        return response()->json(['token' => $token, 'usuario' => $this->perfil($user)]);
    }

    public function me(Request $r)
    {
        return response()->json($this->perfil($r->user()));
    }

    public function logout(Request $r)
    {
        $r->user()->currentAccessToken()?->delete();

        return response()->noContent();
    }

    public function trocarSenha(Request $r)
    {
        $user = $r->user();
        $d = $r->validate([
            'senha_atual' => [$user->precisa_trocar_senha ? 'nullable' : 'required', 'string'],
            'nova_senha' => ['required', 'string', 'min:6', 'confirmed'],
        ]);
        if (! $user->precisa_trocar_senha && ! Hash::check($d['senha_atual'], $user->password)) {
            throw ValidationException::withMessages(['senha_atual' => 'Senha atual incorreta.']);
        }
        if (Hash::check($d['nova_senha'], $user->password)) {
            throw ValidationException::withMessages(['nova_senha' => 'Escolha uma senha diferente da atual.']);
        }
        $user->update(['password' => $d['nova_senha'], 'precisa_trocar_senha' => false]);

        return response()->json(['mensagem' => 'Senha trocada.', 'usuario' => $this->perfil($user->fresh())]);
    }

    private function perfil(User $u): array
    {
        $u->loadMissing('aluno.categoria', 'dependentes.categoria');
        $resumo = fn ($a) => ['id' => $a->id, 'nome' => $a->nome, 'categoria' => $a->categoria->nome, 'foto_url' => $a->fotoUrl()];

        return [
            'id' => $u->id,
            'nome' => $u->nome,
            'username' => $u->username,
            'papel' => $u->papel->value,
            'precisa_trocar_senha' => $u->precisa_trocar_senha,
            'alunos' => match ($u->papel) {
                Papel::Aluno => $u->aluno ? [$resumo($u->aluno)] : [],
                Papel::Responsavel => $u->dependentes->map($resumo)->values()->all(),
                default => [],
            },
            'categorias' => $u->ehGestor() ? $u->categoriaIdsGeridas() : [],
        ];
    }
}
