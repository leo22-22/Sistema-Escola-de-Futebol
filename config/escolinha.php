<?php

return [
    'nome' => env('ESCOLINHA_NOME', 'Clínica de Futebol Caio Pina'),
    'nome_curto' => env('ESCOLINHA_NOME_CURTO', 'Caio Pina'),
    'cores' => ['primaria' => '#F7C600', 'secundaria' => '#0A0A08'],
    'idade_minima' => 7,
    'idade_maxima' => 18,
    'termo_versao' => env('ESCOLINHA_TERMO_VERSAO', '2026-1'),
    'carta' => ['prata' => 10, 'ouro' => 25],
    'foto_tamanho' => 360,
    'gravacao_max_ms' => 120000,
    'meses_aviso_promocao' => [11, 12, 1],
    'historico_desfazer' => 30,
];
