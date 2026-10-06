<?php

namespace App\Services;

use App\Models\Aluno;
use App\Models\Categoria;
use App\Models\Promocao;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class Promocoes
{
    public function __construct(private Notificador $notificador, private Conquistas $conquistas) {}

    /** Quem muda de categoria na virada do ano e quem passa da idade máxima. */
    /** Ano da temporada que vem: em nov/dez é o ano seguinte; a partir de janeiro, a virada já aconteceu. */
    private function proximaTemporada(): int
    {
        return (int) now()->year + (now()->month >= 11 ? 1 : 0);
    }

    public function sugestoes(): array
    {
        $proximoAno = $this->proximaTemporada();
        $categorias = Categoria::all()->keyBy('idade');
        $sugestoes = [];
        $saem = [];
        Aluno::with('categoria')->orderBy('nome')->get()->each(function (Aluno $a) use ($proximoAno, $categorias, &$sugestoes, &$saem) {
            $idade = $proximoAno - $a->anoNascimento();
            $alvo = $categorias->get($idade);
            if ($alvo && (int) $alvo->id !== (int) $a->categoria_id) {
                $sugestoes[] = ['aluno' => ['id' => $a->id, 'nome' => $a->nome], 'de' => $a->categoria->nome, 'para' => ['id' => $alvo->id, 'nome' => $alvo->nome]];
            }
            if (! $alvo && $idade > (int) config('escolinha.idade_maxima')) {
                $saem[] = ['id' => $a->id, 'nome' => $a->nome, 'categoria' => $a->categoria->nome];
            }
        });

        return [
            'ano' => $proximoAno,
            'mostrar_aviso' => in_array((int) now()->month, config('escolinha.meses_aviso_promocao'), true),
            'sugestoes' => $sugestoes,
            'saem_da_escolinha' => $saem,
        ];
    }

    /** @param int[] $ids */
    public function promoverLote(array $ids, User $por): int
    {
        $proximoAno = $this->proximaTemporada();
        $total = 0;
        foreach (Aluno::whereIn('id', $ids)->get() as $a) {
            $alvo = Categoria::paraAnoNascimento($a->anoNascimento(), $proximoAno);
            if ($alvo && (int) $alvo->id !== (int) $a->categoria_id) {
                $this->mover($a, $alvo, $por);
                $total++;
            }
        }

        return $total;
    }

    public function mover(Aluno $a, Categoria $para, User $por): void
    {
        $de = $a->categoria;
        $sobe = $para->idade > $de->idade;
        DB::transaction(function () use ($a, $de, $para, $por, $sobe) {
            Promocao::create(['aluno_id' => $a->id, 'de_categoria_id' => $de->id, 'para_categoria_id' => $para->id, 'promovido_por' => $por->id]);
            $a->update(['categoria_id' => $para->id, 'promovido' => $a->promovido || $sobe]);
        });
        if ($sobe) {
            $this->notificador->aluno($a, 'Promoção', "Parabéns! Você subiu para o {$para->nome}.", 'promocao');
            $this->conquistas->sincronizar($a);
        }
    }
}
