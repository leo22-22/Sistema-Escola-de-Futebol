#!/usr/bin/env bash
set -e

# Lê os dados do banco do .env só para esperar o MySQL, sem exportar nada para a aplicação
(
  set -a; . ./.env; set +a
  echo "Aguardando o MySQL em $DB_HOST:$DB_PORT..."
  until php -r 'try { new PDO("mysql:host=".getenv("DB_HOST").";port=".getenv("DB_PORT"), getenv("DB_USERNAME"), getenv("DB_PASSWORD")); } catch (Throwable $e) { exit(1); }'; do
    sleep 2
  done
)

if [ "${RODAR_MIGRACOES:-0}" = "1" ]; then
  if php artisan migrate:status >/dev/null 2>&1; then
    php artisan migrate --force
  else
    echo "Primeira execução: criando tabelas e dados de demonstração"
    php artisan migrate --seed --force
  fi
fi

exec "$@"
