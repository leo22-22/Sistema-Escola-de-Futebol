<?php

namespace Tests\Feature;

use App\Enums\Papel;
use App\Models\Aluno;
use App\Models\Categoria;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AlunosTest extends TestCase
{
    use RefreshDatabase;

    public function test_dono_cadastra_aluno_e_recebe_os_acessos(): void
    {
        $cat = Categoria::factory()->create(['idade' => 11, 'slug' => 'sub11', 'nome' => 'Sub-11']);
        Sanctum::actingAs(User::factory()->papel(Papel::Dono)->create());

        $r = $this->postJson('/api/alunos', [
            'nome' => 'Pedro Lima',
            'nascimento' => (now()->year - 11).'-08-02',
            'categoria_id' => $cat->id,
            'posicoes' => ['CA', 'PE'],
            'username' => 'pedro.lima',
            'responsavel_nome' => 'Carlos Lima',
            'responsavel_celular' => '(18) 99100-0002',
            'termo_aceito' => true,
        ])->assertCreated();

        $r->assertJsonPath('acessos.aluno.login', 'pedro.lima')
            ->assertJsonPath('acessos.aluno.senha_inicial', 'Pedro'.now()->year)
            ->assertJsonPath('aluno.posicao_principal.sigla', 'CA');
        $this->assertDatabaseHas('users', ['celular' => '18991000002', 'papel' => 'responsavel']);
    }

    public function test_professor_so_ve_alunos_das_categorias_dele(): void
    {
        $sub11 = Categoria::factory()->create(['idade' => 11, 'slug' => 'sub11', 'nome' => 'Sub-11']);
        $sub13 = Categoria::factory()->create(['idade' => 13, 'slug' => 'sub13', 'nome' => 'Sub-13']);
        $meu = Aluno::factory()->create(['categoria_id' => $sub11->id]);
        $outro = Aluno::factory()->create(['categoria_id' => $sub13->id]);
        $prof = User::factory()->papel(Papel::Professor)->create();
        $prof->categorias()->attach($sub11);
        Sanctum::actingAs($prof);

        $this->getJson("/api/alunos/{$meu->id}")->assertOk();
        $this->getJson("/api/alunos/{$outro->id}")->assertForbidden();
        $this->postJson('/api/alunos', [])->assertForbidden();
    }

    public function test_aluno_ve_so_a_propria_carta(): void
    {
        $cat = Categoria::factory()->create(['idade' => 11, 'slug' => 'sub11', 'nome' => 'Sub-11']);
        $eu = Aluno::factory()->create(['categoria_id' => $cat->id]);
        $colega = Aluno::factory()->create(['categoria_id' => $cat->id]);
        Sanctum::actingAs($eu->user);

        $this->getJson("/api/alunos/{$eu->id}/carta")->assertOk()->assertJsonPath('nivel.nivel', 'bronze');
        $this->getJson("/api/alunos/{$colega->id}/carta")->assertForbidden();
    }
}
