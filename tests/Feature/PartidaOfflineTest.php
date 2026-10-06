<?php

namespace Tests\Feature;

use App\Enums\Papel;
use App\Models\Aluno;
use App\Models\Categoria;
use App\Models\Evento;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Ações feitas no campo sem internet chegam depois, pela fila do app, com o horário em que aconteceram. */
class PartidaOfflineTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_fila_offline_chega_atrasada_com_os_minutos_certos_e_sem_duplicar(): void
    {
        $cat = Categoria::factory()->create(['idade' => 11, 'slug' => 'sub11', 'nome' => 'Sub-11']);
        $jog = Aluno::factory()->count(5)->create(['categoria_id' => $cat->id]);
        $evento = Evento::factory()->create(['categoria_id' => $cat->id]);
        Sanctum::actingAs(User::factory()->papel(Papel::Professor)->create());
        $evento->categoria->professores()->attach(auth()->id());

        // O professor jogou tudo offline às 10:00; a internet só voltou às 10:40
        $inicio = Carbon::parse('2026-10-06 10:00:00');
        Carbon::setTestNow($inicio->copy()->addMinutes(40));
        $ms = fn (int $seg) => (int) ($inicio->copy()->addSeconds($seg)->getPreciseTimestamp(3));
        $url = "/api/eventos/{$evento->id}/partida";
        $iniciar = ['n' => 5, 'duracao' => 20, 'tempos' => 1, 'titulares' => $jog->pluck('id')->all(), 'acao_id' => 'ini1', 'em' => $ms(0)];

        $this->postJson($url, $iniciar)->assertCreated();
        // Reenvio do mesmo início (sinal caiu antes da resposta) não dá erro
        $this->postJson($url, $iniciar)->assertCreated();

        $this->postJson("{$url}/acoes", ['acao' => 'cronometro', 'comando' => 'iniciar', 'acao_id' => 'a1', 'em' => $ms(5)])->assertOk();
        $gol = ['acao' => 'gol', 'time' => 'a', 'aluno_id' => $jog[0]->id, 'acao_id' => 'a2', 'em' => $ms(5 + 12 * 60 + 30)];
        $this->postJson("{$url}/acoes", $gol)->assertOk();
        $r = $this->postJson("{$url}/acoes", $gol)->assertOk();

        // Gol aos 12min30 de bola rolando = 13', mesmo chegando ao servidor 40 minutos depois
        $r->assertJsonPath('placar.a', 1);
        $lance = collect($r->json('lances'))->firstWhere('tipo', 'gol');
        $this->assertSame("13'", $lance['minuto']);
        $this->assertSame('a2', $lance['id']);

        // O app remove o lance pelo id que ele mesmo criou
        $this->postJson("{$url}/acoes", ['acao' => 'remover_lance', 'lance_id' => 'a2', 'acao_id' => 'a3', 'em' => $ms(800)])
            ->assertOk()->assertJsonPath('placar.a', 0);

        $fim = ['conta_na_carta' => true, 'em' => $ms(1200)];
        $this->postJson("{$url}/encerrar", $fim)->assertOk();
        $this->postJson("{$url}/encerrar", $fim)->assertOk();
        $this->assertNotNull($evento->fresh()->encerrado_em);
    }

    public function test_aparelho_com_relogio_adiantado_mantem_o_tempo_entre_os_lances(): void
    {
        $cat = Categoria::factory()->create(['idade' => 11, 'slug' => 'sub11', 'nome' => 'Sub-11']);
        $jog = Aluno::factory()->count(5)->create(['categoria_id' => $cat->id]);
        $evento = Evento::factory()->create(['categoria_id' => $cat->id]);
        Sanctum::actingAs(User::factory()->papel(Papel::Dono)->create());

        // Servidor às 10:00; o celular acha que são 10:05. A fila chega toda de uma vez às 10:12 do servidor.
        Carbon::setTestNow('2026-10-06 10:12:00');
        $celular = Carbon::parse('2026-10-06 10:05:00');
        $ms = fn (int $seg) => (int) ($celular->copy()->addSeconds($seg)->getPreciseTimestamp(3));
        $url = "/api/eventos/{$evento->id}/partida";

        $this->postJson($url, ['n' => 5, 'duracao' => 20, 'tempos' => 1, 'titulares' => $jog->pluck('id')->all(), 'acao_id' => 'i', 'em' => $ms(0)])->assertCreated();
        $this->postJson("{$url}/acoes", ['acao' => 'cronometro', 'comando' => 'iniciar', 'acao_id' => 'c', 'em' => $ms(0)])->assertOk();
        // Gol 10 minutos depois de começar (pelo relógio do celular, que está 10:15, "no futuro" para o servidor)
        $r = $this->postJson("{$url}/acoes", ['acao' => 'gol', 'time' => 'a', 'acao_id' => 'g', 'em' => $ms(600)])->assertOk();

        $this->assertSame("11'", collect($r->json('lances'))->firstWhere('tipo', 'gol')['minuto']);
    }
}
