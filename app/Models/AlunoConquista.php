<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AlunoConquista extends Model
{
    protected $fillable = ['aluno_id', 'codigo', 'conquistada_em', 'vista_em'];

    protected function casts(): array
    {
        return ['conquistada_em' => 'datetime', 'vista_em' => 'datetime'];
    }

    public function aluno(): BelongsTo
    {
        return $this->belongsTo(Aluno::class);
    }
}
