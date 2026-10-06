<?php

namespace App\Enums;

enum Posicao: string
{
    case GOL = 'GOL';
    case LD = 'LD';
    case ZAG = 'ZAG';
    case LE = 'LE';
    case VOL = 'VOL';
    case MC = 'MC';
    case MEI = 'MEI';
    case PD = 'PD';
    case PE = 'PE';
    case CA = 'CA';

    public function nome(): string
    {
        return match ($this) {
            self::GOL => 'Goleiro',
            self::LD => 'Lateral direito',
            self::ZAG => 'Zagueiro',
            self::LE => 'Lateral esquerdo',
            self::VOL => 'Volante',
            self::MC => 'Meio-campo',
            self::MEI => 'Meia',
            self::PD => 'Ponta direita',
            self::PE => 'Ponta esquerda',
            self::CA => 'Centroavante',
        };
    }

    /** Linha do campo usada para ordenar a escalação (0 = gol, 4 = ataque). */
    public function linha(): int
    {
        return match ($this) {
            self::GOL => 0,
            self::LD, self::ZAG, self::LE => 1,
            self::VOL => 2,
            self::MC, self::MEI => 3,
            self::PD, self::PE, self::CA => 4,
        };
    }

    public function defensiva(): bool
    {
        return in_array($this, [self::GOL, self::ZAG, self::LD, self::LE, self::VOL], true);
    }

    public static function valores(): array
    {
        return array_column(self::cases(), 'value');
    }
}
