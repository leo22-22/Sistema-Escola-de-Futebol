<?php

namespace App\Models;

use App\Enums\Posicao;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Aluno extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id', 'responsavel_id', 'categoria_id', 'nome', 'nascimento', 'posicoes', 'numero_camisa',
        'pe_dominante', 'tamanho_uniforme', 'foto_path', 'treinos_base', 'promovido', 'termo_versao', 'termo_aceito_em',
    ];

    protected function casts(): array
    {
        return [
            'nascimento' => 'date',
            'posicoes' => 'array',
            'promovido' => 'boolean',
            'termo_aceito_em' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function responsavel(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responsavel_id');
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class);
    }

    public function eventos(): BelongsToMany
    {
        return $this->belongsToMany(Evento::class, 'evento_aluno')
            ->withPivot(['convocado', 'confirmacao', 'confirmado_em', 'chamada', 'participou', 'minutos'])
            ->withTimestamps();
    }

    public function dicas(): HasMany
    {
        return $this->hasMany(Dica::class);
    }

    public function metas(): HasMany
    {
        return $this->hasMany(Meta::class);
    }

    public function conquistas(): HasMany
    {
        return $this->hasMany(AlunoConquista::class);
    }

    public function promocoes(): HasMany
    {
        return $this->hasMany(Promocao::class);
    }

    public function posicaoPrincipal(): ?Posicao
    {
        $p = $this->posicoes[0] ?? null;

        return $p ? Posicao::tryFrom($p) : null;
    }

    public function ehGoleiro(): bool
    {
        return $this->posicaoPrincipal() === Posicao::GOL;
    }

    /** Linha principal usada para ordenar escalações. */
    public function linha(): int
    {
        return $this->posicaoPrincipal()?->linha() ?? 3;
    }

    public function anoNascimento(): int
    {
        return (int) $this->nascimento->year;
    }

    public function fotoUrl(): ?string
    {
        return $this->foto_path ? Storage::disk('public')->url($this->foto_path) : null;
    }

    public function primeiroNome(): string
    {
        return explode(' ', trim($this->nome))[0];
    }
}
