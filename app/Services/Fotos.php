<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Fotos
{
    /** Recorta no centro em quadrado, reduz e salva como JPEG no disco público. */
    public function salvar(UploadedFile $arquivo): string
    {
        $tamanho = (int) config('escolinha.foto_tamanho', 360);
        $caminho = 'fotos/'.Str::uuid().'.jpg';

        if (! function_exists('imagecreatefromstring')) {
            return $arquivo->storeAs('fotos', basename($caminho), 'public');
        }

        $origem = imagecreatefromstring((string) file_get_contents($arquivo->getRealPath()));
        if ($origem === false) {
            abort(422, 'Não foi possível ler a imagem enviada.');
        }
        // Foto de celular vem "deitada" com a orientação no EXIF: gira antes de recortar
        if (function_exists('exif_read_data')) {
            $exif = @exif_read_data($arquivo->getRealPath());
            $giro = [3 => 180, 6 => -90, 8 => 90][$exif['Orientation'] ?? 1] ?? 0;
            if ($giro && ($girada = imagerotate($origem, $giro, 0)) !== false) {
                imagedestroy($origem);
                $origem = $girada;
            }
        }
        $w = imagesx($origem);
        $h = imagesy($origem);
        $lado = min($w, $h);
        $destino = imagecreatetruecolor($tamanho, $tamanho);
        imagecopyresampled($destino, $origem, 0, 0, (int) (($w - $lado) / 2), (int) (($h - $lado) / 2), $tamanho, $tamanho, $lado, $lado);

        ob_start();
        imagejpeg($destino, null, 82);
        $jpeg = ob_get_clean();
        imagedestroy($origem);
        imagedestroy($destino);

        Storage::disk('public')->put($caminho, $jpeg);

        return $caminho;
    }

    public function remover(?string $caminho): void
    {
        if ($caminho) {
            Storage::disk('public')->delete($caminho);
        }
    }
}
