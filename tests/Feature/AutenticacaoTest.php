<?php

namespace Tests\Feature;

use App\Enums\Papel;
use App\Models\Aluno;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AutenticacaoTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_por_usuario_e_por_celular(): void
    {
        User::factory()->create(['username' => 'joao.silva', 'password' => 'segredo1']);
        User::factory()->papel(Papel::Responsavel)->create(['username' => null, 'celular' => '18991234567', 'password' => 'segredo2']);

        $this->postJson('/api/login', ['login' => 'joao.silva', 'senha' => 'segredo1'])->assertOk()->assertJsonStructure(['token', 'usuario' => ['papel']]);
        $this->postJson('/api/login', ['login' => '(18) 99123-4567', 'senha' => 'segredo2'])->assertOk()->assertJsonPath('usuario.papel', 'responsavel');
        $this->postJson('/api/login', ['login' => 'joao.silva', 'senha' => 'errada'])->assertStatus(422);
    }

    public function test_senha_inicial_bloqueia_o_app_ate_ser_trocada(): void
    {
        $aluno = Aluno::factory()->create();
        $aluno->user->update(['precisa_trocar_senha' => true]);
        $token = $aluno->user->createToken('t')->plainTextToken;

        $this->withToken($token)->getJson('/api/inicio')->assertStatus(423)->assertJsonPath('codigo', 'trocar_senha');
        $this->withToken($token)->postJson('/api/senha', ['nova_senha' => 'novaSenha1', 'nova_senha_confirmation' => 'novaSenha1'])->assertOk();
        $this->withToken($token)->getJson('/api/inicio')->assertOk();
    }
}
