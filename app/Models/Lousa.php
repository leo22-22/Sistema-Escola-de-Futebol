<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lousa extends Model
{
    public const TIPOS = ['Saída de bola', 'Ataque', 'Defesa', 'Bola parada', 'Transição', 'Aquecimento'];

    protected $fillable = ['categoria_id', 'criado_por', 'nome', 'tipo', 'descricao', 'jogadores_por_time', 'dados', 'gravacao'];

    protected function casts(): array
    {
        return ['dados' => 'array', 'gravacao' => 'array'];
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class);
    }
}
