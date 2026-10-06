<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lance extends Model
{
    protected $fillable = ['evento_id', 'tipo', 'time', 'aluno_id', 'assistencia_id', 'sai_id', 'entra_id', 'detalhe', 'minuto', 'segundo_jogo'];

    protected function casts(): array
    {
        return ['aluno_id' => 'integer', 'assistencia_id' => 'integer', 'sai_id' => 'integer', 'entra_id' => 'integer', 'segundo_jogo' => 'integer'];
    }

    public function evento(): BelongsTo
    {
        return $this->belongsTo(Evento::class);
    }

    public function aluno(): BelongsTo
    {
        return $this->belongsTo(Aluno::class)->withTrashed();
    }

    public function assistencia(): BelongsTo
    {
        return $this->belongsTo(Aluno::class, 'assistencia_id')->withTrashed();
    }
}
