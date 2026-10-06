<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class Aviso extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $titulo,
        public string $texto,
        public string $tipo = 'geral',
        public array $dados = [],
    ) {}

    public function via(object $notifiable): array
    {
        $canais = ['database'];
        if (class_exists(\NotificationChannels\WebPush\WebPushChannel::class) && method_exists($notifiable, 'pushSubscriptions')) {
            $canais[] = \NotificationChannels\WebPush\WebPushChannel::class;
        }

        return $canais;
    }

    public function toArray(object $notifiable): array
    {
        return ['titulo' => $this->titulo, 'texto' => $this->texto, 'tipo' => $this->tipo, 'dados' => $this->dados];
    }

    /** Usado só quando o pacote laravel-notification-channels/webpush estiver instalado. */
    public function toWebPush(object $notifiable, $notification)
    {
        return (new \NotificationChannels\WebPush\WebPushMessage)
            ->title($this->titulo)
            ->body($this->texto)
            ->icon('/icone-192.png')
            ->data(['tipo' => $this->tipo] + $this->dados);
    }
}
