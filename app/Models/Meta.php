<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Meta extends Model
{
    protected $fillable = ['aluno_id', 'professor_id', 'texto', 'prazo', 'status', 'concluida_em'];

    protected function casts(): array
    {
        return ['prazo' => 'date', 'concluida_em' => 'datetime'];
    }

    public function aluno(): BelongsTo
    {
        return $this->belongsTo(Aluno::class);
    }

    public function atrasada(): bool
    {
        return $this->status === 'andamento' && $this->prazo->lt(today());
    }
}
