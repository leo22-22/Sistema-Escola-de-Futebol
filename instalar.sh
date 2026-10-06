#!/usr/bin/env bash
# Cria um Laravel 11 novo e aplica o código da Caio Pina por cima.
# Uso: bash instalar.sh [pasta-destino]
set -euo pipefail

DESTINO="${1:-caio-pina-api}"
ORIGEM="$(cd "$(dirname "$0")" && pwd)"

command -v composer >/dev/null || { echo "Instale o Composer primeiro: https://getcomposer.org"; exit 1; }
php -r 'exit(version_compare(PHP_VERSION, "8.2.0", ">=") ? 0 : 1);' || { echo "Precisa de PHP 8.2 ou superior."; exit 1; }

echo "1/5 Criando projeto Laravel 11 em $DESTINO"
composer create-project laravel/laravel "$DESTINO" "^11.0" --no-interaction

cd "$DESTINO"
echo "2/5 Instalando Sanctum (API com token)"
php artisan install:api --without-migration-prompt --no-interaction
# Nome fixo: o install:api põe a data/hora no nome e o banco acharia que é outra migration a cada reinstalação
mv database/migrations/*_create_personal_access_tokens_table.php database/migrations/2019_12_14_000001_create_personal_access_tokens_table.php

echo "3/5 Aplicando o código da escolinha"
rm -f database/migrations/0001_01_01_000000_create_users_table.php
cp -R "$ORIGEM/app" "$ORIGEM/bootstrap" "$ORIGEM/config" "$ORIGEM/database" "$ORIGEM/resources" "$ORIGEM/routes" "$ORIGEM/tests" "$ORIGEM/docs" .
cp -R "$ORIGEM/public/." public/
cp "$ORIGEM/.env.exemplo" .env.exemplo-escolinha

echo "4/5 Ajustando .env"
php -r '
$env = file_get_contents(".env");
$troca = ["APP_NAME=Laravel" => "APP_NAME=\"Caio Pina\"", "APP_LOCALE=en" => "APP_LOCALE=pt_BR", "APP_FAKER_LOCALE=en_US" => "APP_FAKER_LOCALE=pt_BR", "QUEUE_CONNECTION=sync" => "QUEUE_CONNECTION=database", "APP_TIMEZONE=UTC" => "APP_TIMEZONE=America/Sao_Paulo"];
$env = strtr($env, $troca);
if (strpos($env, "APP_TIMEZONE=") === false) { $env .= "\nAPP_TIMEZONE=America/Sao_Paulo\n"; }
file_put_contents(".env", $env);
'
php artisan storage:link

echo "5/5 Pronto."
echo
echo "Próximos passos:"
echo "  1. Configure o MySQL no .env (DB_CONNECTION=mysql, DB_DATABASE, DB_USERNAME, DB_PASSWORD)."
echo "     Para testar rápido sem MySQL, o padrão (SQLite) já funciona."
echo "  2. php artisan migrate --seed            (APP_ENV=local cria 300 alunos de demonstração)"
echo "  3. php artisan test                      (roda os testes da API)"
echo "  4. php artisan serve                     (app em http://127.0.0.1:8000 e API em /api)"
echo
echo "Acessos iniciais (troca de senha obrigatória):"
echo "  dono / CaioPina$(date +%Y)    professor / Professor$(date +%Y)    joao.silva / demo123 (demonstração)"
