<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Partida extends Model
{
    protected $fillable = ['evento_id', 'iniciada_por', 'estado', 'historico'];

    protected function casts(): array
    {
        return ['estado' => 'array', 'historico' => 'array'];
    }

    public function evento(): BelongsTo
    {
        return $this->belongsTo(Evento::class);
    }
}
