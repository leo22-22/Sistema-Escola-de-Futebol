@php
    // ?v= muda quando o arquivo muda, para o navegador e o service worker não servirem versão velha
    $versao = fn (string $arquivo) => asset($arquivo).'?v='.filemtime(public_path($arquivo));
    $cores = config('escolinha.cores');
    // Lido pelo public/js/app.js como window.CAIOPINA
    $configApp = [
        'api' => url('/api'),
        'sw' => asset('sw.js'),
        'nome' => config('escolinha.nome'),
        'nomeCurto' => config('escolinha.nome_curto'),
    ];
@endphp
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{{ config('escolinha.nome_curto') }} — App da escolinha</title>
<link rel="manifest" href="{{ asset('manifest.webmanifest') }}">
<meta name="theme-color" content="{{ $cores['secundaria'] }}">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="{{ config('escolinha.nome_curto') }}">
<link rel="icon" href="{{ asset('icone-64.png') }}" type="image/png">
<link rel="apple-touch-icon" href="{{ asset('icone-192.png') }}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{{ $versao('css/app.css') }}">
</head>
<body>
<div id="app"></div>
<script>
window.CAIOPINA = @json($configApp);
</script>
<script src="{{ $versao('js/app.js') }}"></script>
</body>
</html>
