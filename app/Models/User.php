<?php

namespace App\Models;

use App\Enums\Papel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = ['nome', 'username', 'email', 'celular', 'papel', 'password', 'precisa_trocar_senha', 'ultimo_acesso_em'];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'papel' => Papel::class,
            'password' => 'hashed',
            'precisa_trocar_senha' => 'boolean',
            'ultimo_acesso_em' => 'datetime',
        ];
    }

    public function aluno(): HasOne
    {
        return $this->hasOne(Aluno::class);
    }

    public function dependentes(): HasMany
    {
        return $this->hasMany(Aluno::class, 'responsavel_id');
    }

    public function categorias(): BelongsToMany
    {
        return $this->belongsToMany(Categoria::class, 'categoria_professor');
    }

    public function ehGestor(): bool
    {
        return $this->papel->gestor();
    }

    /** @return int[] */
    public function categoriaIdsGeridas(): array
    {
        if ($this->papel === Papel::Dono) {
            return array_map('intval', Categoria::pluck('id')->all());
        }
        if ($this->papel === Papel::Professor) {
            return array_map('intval', $this->categorias()->pluck('categorias.id')->all());
        }

        return [];
    }

    public function podeGerirCategoria(int $categoriaId): bool
    {
        return in_array($categoriaId, $this->categoriaIdsGeridas(), true);
    }

    /** @return int[] Alunos que este usuário pode ver. */
    public function alunosVisiveisIds(): array
    {
        $ids = match ($this->papel) {
            Papel::Aluno => $this->aluno ? [$this->aluno->id] : [],
            Papel::Responsavel => $this->dependentes()->pluck('id')->all(),
            default => Aluno::whereIn('categoria_id', $this->categoriaIdsGeridas())->pluck('id')->all(),
        };

        return array_map('intval', $ids);
    }

    /** @return int[] Categorias que este usuário pode ver (gestor: geridas; aluno/responsável: dos alunos). */
    public function categoriaIdsVisiveis(): array
    {
        if ($this->ehGestor()) {
            return $this->categoriaIdsGeridas();
        }

        return array_map('intval', Aluno::whereIn('id', $this->alunosVisiveisIds())->pluck('categoria_id')->unique()->values()->all());
    }

    public function podeVerAluno(Aluno $aluno): bool
    {
        return in_array($aluno->id, $this->alunosVisiveisIds(), true);
    }
}
