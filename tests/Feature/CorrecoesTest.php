<?php

namespace Tests\Feature;

use App\Enums\Papel;
use App\Models\Aluno;
use App\Models\Categoria;
use App\Models\Evento;
use App\Models\User;
use App\Services\Promocoes;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CorrecoesTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_lembrete_de_evento_no_mesmo_dia_diz_hoje(): void
    {
        Carbon::setTestNow('2026-10-06 11:50:00');
        $aluno = Aluno::factory()->create();
        Evento::factory()->coletivo()->create(['categoria_id' => $aluno->categoria_id, 'data' => '2026-10-06', 'hora_inicio' => '17:00', 'hora_fim' => '18:30', 'titulo' => 'Treino']);

        $this->artisan('escolinha:lembretes')->assertSuccessful();

        $texto = $aluno->user->notifications()->first()->data['texto'];
        $this->assertStringContainsString('é hoje', $texto);
    }

    public function test_remarcar_evento_libera_os_lembretes_de_novo(): void
    {
        $dono = User::factory()->papel(Papel::Dono)->create();
        $e = Evento::factory()->create(['lembrete_24h_em' => now(), 'lembrete_2h_em' => now()]);
        Sanctum::actingAs($dono);

        $this->putJson("/api/eventos/{$e->id}", [
            'categoria_id' => $e->categoria_id, 'grupo' => 'jogo', 'modalidade' => 'Amistoso', 'adversario' => 'EC Rival',
            'data' => today()->addDays(3)->toDateString(), 'hora_inicio' => '10:00', 'hora_fim' => '11:30', 'local' => 'Campo 2',
        ])->assertOk();

        $e->refresh();
        $this->assertNull($e->lembrete_24h_em);
        $this->assertNull($e->lembrete_2h_em);
    }

    public function test_aluno_removido_nao_consegue_entrar(): void
    {
        $resp = User::factory()->papel(Papel::Responsavel)->create(['username' => null, 'celular' => '18990000001', 'password' => 'segredo2']);
        $aluno = Aluno::factory()->create(['responsavel_id' => $resp->id]);
        $aluno->user->update(['username' => 'pedro.lima', 'password' => 'segredo1']);
        Sanctum::actingAs(User::factory()->papel(Papel::Dono)->create());
        $this->deleteJson("/api/alunos/{$aluno->id}")->assertNoContent();

        $this->postJson('/api/login', ['login' => 'pedro.lima', 'senha' => 'segredo1'])->assertStatus(422)->assertJsonPath('errors.login.0', 'Este acesso foi desativado pela escolinha.');
        $this->postJson('/api/login', ['login' => '18990000001', 'senha' => 'segredo2'])->assertStatus(422);
    }

    public function test_promocao_em_janeiro_usa_a_temporada_que_acabou_de_virar(): void
    {
        foreach ([10, 11, 12] as $idade) {
            Categoria::factory()->create(['idade' => $idade, 'slug' => "sub{$idade}", 'nome' => "Sub-{$idade}"]);
        }
        $sub10 = Categoria::where('idade', 10)->first();
        Carbon::setTestNow('2027-01-15 10:00:00');
        // Nascido em 2016: em 2027 é Sub-11 (não Sub-12, que seria a temporada de 2028)
        Aluno::factory()->create(['categoria_id' => $sub10->id, 'nascimento' => '2016-03-01']);

        $s = app(Promocoes::class)->sugestoes();

        $this->assertSame(2027, $s['ano']);
        $this->assertSame('Sub-11', $s['sugestoes'][0]['para']['nome']);
    }
}
