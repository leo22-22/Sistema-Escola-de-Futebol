<?php

namespace App\Services;

use App\Enums\Papel;
use App\Models\Aluno;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class CadastroAlunos
{
    public function __construct(private Fotos $fotos) {}

    /**
     * Cria o aluno, o login dele e o login do responsável (ou reaproveita o responsável pelo celular).
     *
     * @return array{aluno:Aluno, senha_inicial:string, responsavel_novo:bool}
     */
    public function criar(array $d, ?UploadedFile $foto): array
    {
        $senha = Senhas::padrao($d['nome']);
        $celular = Senhas::somenteDigitos($d['responsavel_celular']);
        $fotoPath = $foto ? $this->fotos->salvar($foto) : null;

        return DB::transaction(function () use ($d, $senha, $celular, $fotoPath) {
            $responsavel = User::where('celular', $celular)->first();
            $novo = false;
            if (! $responsavel) {
                $responsavel = User::create([
                    'nome' => $d['responsavel_nome'],
                    'celular' => $celular,
                    'papel' => Papel::Responsavel,
                    'password' => $senha,
                    'precisa_trocar_senha' => true,
                ]);
                $novo = true;
            }
            abort_if($responsavel->papel !== Papel::Responsavel, 422, 'Este celular já pertence a outro tipo de usuário.');

            $usuario = User::create([
                'nome' => $d['nome'],
                'username' => strtolower($d['username']),
                'papel' => Papel::Aluno,
                'password' => $senha,
                'precisa_trocar_senha' => true,
            ]);

            $aluno = Aluno::create([
                'user_id' => $usuario->id,
                'responsavel_id' => $responsavel->id,
                'categoria_id' => $d['categoria_id'],
                'nome' => $d['nome'],
                'nascimento' => $d['nascimento'],
                'posicoes' => array_values(array_unique($d['posicoes'])),
                'numero_camisa' => $d['numero_camisa'] ?? null,
                'pe_dominante' => $d['pe_dominante'] ?? null,
                'tamanho_uniforme' => $d['tamanho_uniforme'] ?? null,
                'foto_path' => $fotoPath,
                'termo_versao' => config('escolinha.termo_versao'),
                'termo_aceito_em' => now(),
            ]);

            return ['aluno' => $aluno, 'senha_inicial' => $senha, 'responsavel_novo' => $novo];
        });
    }

    public function atualizar(Aluno $aluno, array $d, ?UploadedFile $foto): Aluno
    {
        if ($foto) {
            $this->fotos->remover($aluno->foto_path);
            $d['foto_path'] = $this->fotos->salvar($foto);
        }
        if (isset($d['posicoes'])) {
            $d['posicoes'] = array_values(array_unique($d['posicoes']));
        }
        $aluno->update(collect($d)->only(['nome', 'nascimento', 'posicoes', 'numero_camisa', 'pe_dominante', 'tamanho_uniforme', 'foto_path'])->all());
        if (isset($d['nome'])) {
            $aluno->user()->update(['nome' => $d['nome']]);
        }

        return $aluno->fresh();
    }

    /** Gera nova senha padrão e força a troca no próximo acesso. */
    public function resetarSenha(Aluno $aluno): string
    {
        $senha = Senhas::padrao($aluno->nome);
        $aluno->user->update(['password' => $senha, 'precisa_trocar_senha' => true]);
        $aluno->user->tokens()->delete();

        return $senha;
    }
}
