<?php

namespace Database\Seeders;

use App\Enums\Papel;
use App\Models\Aluno;
use App\Models\Categoria;
use App\Models\Evento;
use App\Models\User;
use App\Services\Conquistas;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * 25 alunos por categoria (Sub-7 a Sub-18), responsáveis e uma agenda de exemplo.
 * Só roda em ambiente local ou com APP_DEMO=true. Senha de todos: Demo + ano (ex.: Demo2026, troca obrigatória),
 * exceto o aluno joao.silva e o responsável dele, que já entram com "demo123".
 */
class DemonstracaoSeeder extends Seeder
{
    private const NOMES = ['Lucas', 'Gabriel', 'Matheus', 'Pedro', 'Guilherme', 'Rafael', 'Felipe', 'Gustavo', 'Enzo', 'Davi', 'Arthur', 'Heitor', 'Bernardo', 'Samuel', 'Lorenzo', 'Benjamin', 'Theo', 'Miguel', 'Murilo', 'Vinícius', 'Leonardo', 'Henrique', 'Caio', 'Otávio', 'Nicolas', 'Bryan', 'Joaquim', 'Isaac', 'Bento', 'Emanuel', 'Vicente', 'Anthony', 'Ryan', 'Kauã', 'Yuri', 'Diego', 'Igor', 'Thiago', 'Daniel', 'Eduardo', 'João', 'Cauã', 'Breno', 'Renan', 'Luan', 'Erick', 'Kevin', 'Wesley', 'Augusto', 'Raul'];

    private const SOBRENOMES = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento', 'Lima', 'Araújo', 'Fernandes', 'Carvalho', 'Gomes', 'Martins', 'Rocha', 'Ribeiro', 'Alves', 'Monteiro', 'Mendes', 'Barros', 'Freitas', 'Barbosa', 'Pinto', 'Moura', 'Cavalcanti', 'Dias', 'Castro', 'Campos', 'Cardoso', 'Teixeira', 'Vieira', 'Ramos', 'Nunes', 'Moreira', 'Correia', 'Duarte', 'Machado', 'Lopes', 'Batista', 'Prado', 'Reis', 'Fonseca', 'Siqueira', 'Tavares'];

    private const RESPONSAVEIS = ['Ana', 'Maria', 'Juliana', 'Patrícia', 'Fernanda', 'Camila', 'Aline', 'Renata', 'Carla', 'Simone', 'Luciana', 'Daniela', 'Adriana', 'Cláudia', 'Tatiane', 'Paula', 'Roberto', 'Marcos', 'André', 'Fábio', 'Sérgio', 'Rodrigo'];

    private const POSICOES = [['GOL'], ['ZAG'], ['LD'], ['LE'], ['VOL'], ['MC'], ['MEI'], ['PD'], ['PE'], ['CA'], ['GOL'], ['ZAG', 'LE'], ['LD', 'PD'], ['VOL', 'MC'], ['MEI', 'MC'], ['PE', 'PD'], ['CA', 'PE'], ['ZAG'], ['GOL'], ['MC', 'VOL'], ['MEI'], ['CA'], ['PD', 'PE'], ['LE'], ['ZAG', 'VOL']];

    public function run(): void
    {
        mt_srand(20260923);
        $ano = (int) now()->year;
        $usados = [];
        $celular = 18991000000;
        // Hash calculado uma vez só: o cast 'hashed' não refaz hash de valor já criptografado.
        $hashDemo = Hash::make('demo123');
        $hashPadrao = Hash::make('Demo'.$ano);

        foreach (Categoria::orderBy('idade')->get() as $cat) {
            for ($k = 0; $k < 25; $k++) {
                do {
                    $nome = self::NOMES[mt_rand(0, count(self::NOMES) - 1)].' '.self::SOBRENOMES[mt_rand(0, count(self::SOBRENOMES) - 1)];
                } while (isset($usados[$nome]));
                if ($cat->idade === 11 && $k === 0) {
                    $nome = 'João Silva';
                }
                $usados[$nome] = true;
                $demo = $nome === 'João Silva';
                $senha = $demo ? $hashDemo : $hashPadrao;
                $sobrenome = explode(' ', $nome)[1];

                $resp = User::create([
                    'nome' => self::RESPONSAVEIS[mt_rand(0, count(self::RESPONSAVEIS) - 1)].' '.$sobrenome,
                    'celular' => (string) ($celular++),
                    'papel' => Papel::Responsavel,
                    'password' => $senha,
                    'precisa_trocar_senha' => ! $demo,
                ]);
                $base = Str::lower(Str::ascii(str_replace(' ', '.', $nome)));
                $username = $base;
                $n = 2;
                while (User::where('username', $username)->exists()) {
                    $username = $base.$n++;
                }
                $user = User::create([
                    'nome' => $nome,
                    'username' => $username,
                    'papel' => Papel::Aluno,
                    'password' => $senha,
                    'precisa_trocar_senha' => ! $demo && $k % 12 === 5,
                ]);
                Aluno::create([
                    'user_id' => $user->id,
                    'responsavel_id' => $resp->id,
                    'categoria_id' => $cat->id,
                    'nome' => $nome,
                    'nascimento' => sprintf('%d-%02d-%02d', $cat->anoNascimento(), mt_rand(1, 12), mt_rand(1, 28)),
                    'posicoes' => $demo ? ['MEI', 'PD'] : self::POSICOES[$k % count(self::POSICOES)],
                    'numero_camisa' => $k % 11 === 7 ? null : $k + 1,
                    'treinos_base' => mt_rand(0, $cat->idade >= 13 ? 34 : 26),
                    'termo_versao' => config('escolinha.termo_versao'),
                    'termo_aceito_em' => now(),
                ]);
            }
        }

        $sub11 = Categoria::where('idade', 11)->first();
        $prof = User::where('username', 'professor')->first();
        $base = ['categoria_id' => $sub11->id, 'criado_por' => $prof?->id, 'hora_inicio' => '17:00', 'hora_fim' => '18:30', 'local' => 'Campo 2'];
        Evento::create($base + ['grupo' => 'treino', 'modalidade' => 'Tático', 'titulo' => 'Saída de bola e marcação', 'data' => today(),
            'levar' => ['Chuteira', 'Caneleira', 'Garrafa de água'],
            'plano' => ['objetivo' => 'Sair jogando pelo chão sob pressão', 'atividades' => [['nome' => 'Aquecimento com bola', 'minutos' => 15, 'lousa_id' => null], ['nome' => 'Rondo 5 contra 2', 'minutos' => 20, 'lousa_id' => null], ['nome' => 'Coletivo condicionado', 'minutos' => 25, 'lousa_id' => null]]]]);
        $coletivo = Evento::create($base + ['grupo' => 'treino', 'modalidade' => 'Coletivo', 'titulo' => 'Coletivo 7 x 7', 'data' => today()->addDay()]);
        foreach ($sub11->alunos()->limit(14)->pluck('id') as $id) {
            $coletivo->marcar($id, ['confirmacao' => 'vai', 'confirmado_em' => now()]);
        }
        $jogo = Evento::create($base + ['grupo' => 'jogo', 'modalidade' => 'Amistoso', 'titulo' => 'Amistoso', 'adversario' => 'EC Vila Nova', 'mando' => 'fora',
            'data' => today()->addDays(4), 'hora_inicio' => '09:00', 'hora_fim' => '10:30', 'chegada' => '08:15', 'local' => 'Campo do Vila Nova',
            'uniforme' => 'Camisa amarela, meião preto', 'levar' => ['Chuteira', 'Caneleira', 'Garrafa de água', 'Documento com foto']]);
        foreach ($sub11->alunos()->limit(12)->pluck('id') as $id) {
            $jogo->marcar($id, ['convocado' => true]);
        }

        $conquistas = app(Conquistas::class);
        Aluno::all()->each(fn (Aluno $a) => $conquistas->sincronizar($a, notificar: false, marcarVista: true));
    }
}
