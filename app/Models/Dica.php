<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Dica extends Model
{
    public const TIPOS = ['Técnica', 'Tática', 'Física', 'Comportamento', 'Elogio'];

    protected $fillable = ['aluno_id', 'professor_id', 'tipo', 'texto', 'evento_id', 'lousa_id', 'fixada', 'lida_em', 'entendida_em'];

    protected function casts(): array
    {
        return ['fixada' => 'boolean', 'lida_em' => 'datetime', 'entendida_em' => 'datetime'];
    }

    public function aluno(): BelongsTo
    {
        return $this->belongsTo(Aluno::class);
    }

    public function evento(): BelongsTo
    {
        return $this->belongsTo(Evento::class);
    }

    public function lousa(): BelongsTo
    {
        return $this->belongsTo(Lousa::class);
    }
}
