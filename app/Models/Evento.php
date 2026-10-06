<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Evento extends Model
{
    use HasFactory;

    public const MODALIDADES = [
        'treino' => ['Tático', 'Técnico', 'Físico', 'Ataque', 'Defesa', 'Bola parada', 'Coletivo'],
        'jogo' => ['Amistoso', 'Competição', 'Teste', 'Festival'],
    ];

    public const ITENS_LEVAR = ['Chuteira', 'Caneleira', 'Garrafa de água', 'Uniforme reserva', 'Documento com foto', 'Protetor solar', 'Lanche'];

    protected $fillable = [
        'categoria_id', 'criado_por', 'grupo', 'modalidade', 'titulo', 'adversario', 'mando', 'data', 'hora_inicio', 'hora_fim',
        'chegada', 'local', 'uniforme', 'levar', 'plano', 'observacoes', 'serie', 'rapida', 'cancelado_em', 'motivo_cancelamento',
        'encerrado_em', 'placar_casa', 'placar_fora', 'conta_na_carta', 'estatisticas', 'observacao_professor',
        'lembrete_24h_em', 'lembrete_2h_em',
    ];

    protected function casts(): array
    {
        return [
            'data' => 'date',
            'levar' => 'array',
            'plano' => 'array',
            'estatisticas' => 'array',
            'rapida' => 'boolean',
            'conta_na_carta' => 'boolean',
            'cancelado_em' => 'datetime',
            'encerrado_em' => 'datetime',
            'lembrete_24h_em' => 'datetime',
            'lembrete_2h_em' => 'datetime',
            'placar_casa' => 'integer',
            'placar_fora' => 'integer',
        ];
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class);
    }

    public function criador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'criado_por');
    }

    public function alunos(): BelongsToMany
    {
        return $this->belongsToMany(Aluno::class, 'evento_aluno')
            ->withPivot(['convocado', 'confirmacao', 'confirmado_em', 'chamada', 'participou', 'minutos'])
            ->withTimestamps();
    }

    public function lances(): HasMany
    {
        return $this->hasMany(Lance::class)->orderBy('segundo_jogo');
    }

    public function partida(): HasOne
    {
        return $this->hasOne(Partida::class);
    }

    public function scopeAtivos(Builder $q): Builder
    {
        return $q->whereNull('cancelado_em');
    }

    public function ehJogo(): bool
    {
        return $this->grupo === 'jogo';
    }

    public function ehColetivo(): bool
    {
        return $this->grupo === 'treino' && $this->modalidade === 'Coletivo';
    }

    public function temModoAoVivo(): bool
    {
        return $this->ehJogo() || $this->ehColetivo();
    }

    public function cancelado(): bool
    {
        return $this->cancelado_em !== null;
    }

    public function encerrado(): bool
    {
        return $this->encerrado_em !== null;
    }

    public function inicio(): Carbon
    {
        return Carbon::parse($this->data->format('Y-m-d').' '.$this->hora_inicio);
    }

    public function tituloExibicao(): string
    {
        if (! $this->ehJogo()) {
            return $this->titulo;
        }
        $casa = config('escolinha.nome_curto', 'Caio Pina');

        return $this->mando === 'fora' ? "{$this->adversario} x {$casa}" : "{$casa} x {$this->adversario}";
    }

    /** Placar na mesma ordem dos nomes de tituloExibicao() (fora de casa, o adversário vem primeiro). */
    public function placarExibicao(): string
    {
        if ($this->placar_casa === null) {
            return '';
        }

        return $this->ehJogo() && $this->mando === 'fora'
            ? "{$this->placar_fora} x {$this->placar_casa}"
            : "{$this->placar_casa} x {$this->placar_fora}";
    }

    /**
     * Jogo: quem o professor convocou. Coletivo: quem confirmou presença.
     *
     * @return int[]
     */
    public function convocadosIds(): array
    {
        $q = $this->alunos();
        $q = $this->ehJogo() ? $q->wherePivot('convocado', true) : $q->wherePivot('confirmacao', 'vai');

        return array_map('intval', $q->pluck('alunos.id')->all());
    }

    /** Cria ou atualiza o vínculo do aluno com o evento. */
    public function marcar(int $alunoId, array $atributos): void
    {
        $this->alunos()->syncWithoutDetaching([$alunoId => $atributos]);
    }
}
