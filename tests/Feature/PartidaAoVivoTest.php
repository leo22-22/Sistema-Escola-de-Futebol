<?php

namespace Tests\Feature;

use App\Enums\Papel;
use App\Models\Aluno;
use App\Models\Categoria;
use App\Models\Evento;
use App\Models\User;
use App\Services\Estatisticas;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PartidaAoVivoTest extends TestCase
{
    use RefreshDatabase;

    private function acao(Evento $e, array $d)
    {
        return $this->postJson("/api/eventos/{$e->id}/partida/acoes", $d)->assertOk();
    }

    public function test_partida_completa_com_substituicao_gol_cartoes_e_carta(): void
    {
        $cat = Categoria::factory()->create(['idade' => 11, 'slug' => 'sub11', 'nome' => 'Sub-11']);
        $gol = Aluno::factory()->posicoes(['GOL'])->create(['categoria_id' => $cat->id]);
        $linha = Aluno::factory()->count(6)->create(['categoria_id' => $cat->id]);
        $reserva = Aluno::factory()->create(['categoria_id' => $cat->id]);
        $evento = Evento::factory()->create(['categoria_id' => $cat->id]);
        Sanctum::actingAs(User::factory()->papel(Papel::Dono)->create());

        $titulares = collect([$gol])->merge($linha)->pluck('id')->all();
        $this->postJson("/api/eventos/{$evento->id}/partida", [
            'n' => 7, 'duracao' => 20, 'tempos' => 2, 'titulares' => $titulares, 'reservas' => [$reserva->id],
        ])->assertCreated()->assertJsonPath('campo.a', $titulares);

        // 10 minutos de jogo
        $this->acao($evento, ['acao' => 'cronometro', 'comando' => 'ajustar', 'segundos' => 600]);
        $sai = $linha[0]->id;
        $this->acao($evento, ['acao' => 'substituicao', 'time' => 'a', 'sai_id' => $sai, 'entra_id' => $reserva->id]);

        // fim do 1º tempo aos 20 e 5 min do 2º
        $this->acao($evento, ['acao' => 'cronometro', 'comando' => 'ajustar', 'segundos' => 600]);
        $this->acao($evento, ['acao' => 'fim_tempo']);
        $this->acao($evento, ['acao' => 'segundo_tempo']);
        $this->acao($evento, ['acao' => 'cronometro', 'comando' => 'pausar']);
        $this->acao($evento, ['acao' => 'cronometro', 'comando' => 'ajustar', 'segundos' => 300]);

        $r = $this->acao($evento, ['acao' => 'gol', 'time' => 'a', 'aluno_id' => $reserva->id, 'assistencia_id' => $linha[1]->id, 'detalhe' => 'falta']);
        $r->assertJsonPath('placar.a', 1);
        $this->assertSame("26'", collect($r->json('lances'))->firstWhere('tipo', 'gol')['minuto']);

        // segundo amarelo expulsa
        $this->acao($evento, ['acao' => 'cartao', 'time' => 'a', 'aluno_id' => $linha[2]->id, 'cor' => 'amarelo']);
        $r = $this->acao($evento, ['acao' => 'cartao', 'time' => 'a', 'aluno_id' => $linha[2]->id, 'cor' => 'amarelo']);
        $this->assertContains($linha[2]->id, $r->json('expulsos'));
        $this->assertNotContains($linha[2]->id, $r->json('campo.a'));

        // desfazer volta o segundo amarelo
        $r = $this->acao($evento, ['acao' => 'desfazer']);
        $this->assertContains($linha[2]->id, $r->json('campo.a'));

        // gol do adversário não pode ter autor da Caio Pina
        $this->postJson("/api/eventos/{$evento->id}/partida/acoes", ['acao' => 'gol', 'time' => 'b', 'aluno_id' => $gol->id])->assertStatus(422);
        $this->acao($evento, ['acao' => 'gol', 'time' => 'b']);

        // fim aos 20 do 2º tempo
        $this->acao($evento, ['acao' => 'cronometro', 'comando' => 'ajustar', 'segundos' => 600]);
        $this->acao($evento, ['acao' => 'cronometro', 'comando' => 'ajustar', 'segundos' => 300]);
        $this->postJson("/api/eventos/{$evento->id}/partida/encerrar", ['conta_na_carta' => true])->assertOk()->assertJsonPath('placar.casa', 1);

        $evento->refresh();
        $this->assertTrue($evento->encerrado());
        $this->assertDatabaseMissing('partidas', ['evento_id' => $evento->id]);
        $minutos = $evento->alunos()->get()->pluck('pivot.minutos', 'id');
        $this->assertSame(10, (int) $minutos[$sai]);
        $this->assertSame(30, (int) $minutos[$reserva->id]);
        $this->assertSame(40, (int) $minutos[$gol->id]);

        $est = app(Estatisticas::class);
        $s = $est->doAluno($reserva->fresh());
        $this->assertSame(1, $s['gols']);
        $this->assertSame(1, $s['gols_falta']);
        $this->assertSame(1, $est->doAluno($linha[1]->fresh())['assistencias']);
        $this->assertDatabaseHas('aluno_conquistas', ['aluno_id' => $reserva->id, 'codigo' => 'falta']);

        $this->assertSame('1 x 1', $evento->placarExibicao());
        $evento->update(['mando' => 'fora', 'placar_fora' => 0]);
        $this->assertSame('0 x 1', $evento->fresh()->placarExibicao());

        $this->getJson("/api/eventos/{$evento->id}/resumo")->assertOk()->assertJsonPath('gols.0.aluno_id', $reserva->id);
    }

    public function test_coletivo_lista_quem_confirmou_e_aceita_quem_chegou_sem_confirmar(): void
    {
        $cat = Categoria::factory()->create(['idade' => 11, 'slug' => 'sub11', 'nome' => 'Sub-11']);
        $alunos = Aluno::factory()->count(8)->create(['categoria_id' => $cat->id]);
        $evento = Evento::factory()->coletivo()->create(['categoria_id' => $cat->id]);

        Sanctum::actingAs($alunos[0]->user);
        $this->postJson("/api/eventos/{$evento->id}/confirmacao", ['aluno_id' => $alunos[0]->id, 'status' => 'vai'])->assertOk();
        $this->assertSame([$alunos[0]->id], $evento->convocadosIds());

        Sanctum::actingAs(User::factory()->papel(Papel::Dono)->create());
        $this->postJson("/api/eventos/{$evento->id}/partida", [
            'n' => 5, 'duracao' => 15, 'tempos' => 1,
            'time_a' => $alunos->slice(0, 3)->pluck('id')->all(), 'time_b' => $alunos->slice(3, 3)->pluck('id')->all(),
        ])->assertCreated();

        $r = $this->acao($evento, ['acao' => 'adicionar', 'time' => 'b', 'aluno_id' => $alunos[7]->id]);
        $this->assertContains($alunos[7]->id, $r->json('campo.b'));
        $this->assertSame('presente', $evento->alunos()->find($alunos[7]->id)->pivot->chamada);

        $this->postJson("/api/eventos/{$evento->id}/partida/encerrar", ['conta_na_carta' => false])->assertOk();
        $this->assertSame(0, app(Estatisticas::class)->doAluno($alunos[0]->fresh())['jogos']);
    }
}
