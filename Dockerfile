FROM php:8.3-cli

RUN apt-get update && apt-get install -y --no-install-recommends \
        git unzip libzip-dev libpng-dev libjpeg62-turbo-dev libwebp-dev libfreetype6-dev \
    && docker-php-ext-configure gd --with-jpeg --with-webp --with-freetype \
    && docker-php-ext-install -j"$(nproc)" gd exif pdo_mysql zip bcmath pcntl \
    && rm -rf /var/lib/apt/lists/*

# Composer 2.8: o 2.9+ bloqueia o Laravel 11 por avisos de segurança
COPY --from=composer:2.8 /usr/bin/composer /usr/bin/composer
# Máquina lenta: sem limite de tempo nos scripts do Composer (padrão 300 s) e mais paciência com a rede
ENV COMPOSER_PROCESS_TIMEOUT=0 COMPOSER_HTTP_TIMEOUT=60

# Código da escolinha; o instalar.sh cria o Laravel 11 e aplica o código por cima
COPY app /src/app
COPY bootstrap /src/bootstrap
COPY config /src/config
COPY database /src/database
COPY routes /src/routes
COPY tests /src/tests
COPY docs /src/docs
COPY resources /src/resources
COPY public /src/public
COPY .env.exemplo instalar.sh /src/
RUN sed -i 's/\r$//' /src/instalar.sh && bash /src/instalar.sh /var/www/app

COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint && chmod +x /usr/local/bin/entrypoint

WORKDIR /var/www/app
EXPOSE 8000
ENTRYPOINT ["entrypoint"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
