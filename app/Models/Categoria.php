<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Categoria extends Model
{
    use HasFactory;

    protected $fillable = ['slug', 'nome', 'idade'];

    protected $appends = ['ano_nascimento'];

    public function alunos(): HasMany
    {
        return $this->hasMany(Aluno::class);
    }

    public function professores(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'categoria_professor');
    }

    public function eventos(): HasMany
    {
        return $this->hasMany(Evento::class);
    }

    public function anoNascimento(?int $ano = null): int
    {
        return ($ano ?? (int) now()->year) - $this->idade;
    }

    public function getAnoNascimentoAttribute(): int
    {
        return $this->anoNascimento();
    }

    /** Categoria de quem nasceu em $anoNascimento, considerando o ano $ano (padrão: ano atual). */
    public static function paraAnoNascimento(int $anoNascimento, ?int $ano = null): ?self
    {
        $idade = ($ano ?? (int) now()->year) - $anoNascimento;

        return static::where('idade', $idade)->first();
    }
}
