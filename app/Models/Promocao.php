<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Promocao extends Model
{
    protected $table = 'promocoes';

    protected $fillable = ['aluno_id', 'de_categoria_id', 'para_categoria_id', 'promovido_por'];

    public function aluno(): BelongsTo
    {
        return $this->belongsTo(Aluno::class);
    }

    public function de(): BelongsTo
    {
        return $this->belongsTo(Categoria::class, 'de_categoria_id');
    }

    public function para(): BelongsTo
    {
        return $this->belongsTo(Categoria::class, 'para_categoria_id');
    }
}
