# Caio Pina · App + API

Sistema completo da Clínica de Futebol Caio Pina: o app (PWA instalável no celular) e a API em Laravel 11 com Sanctum e MySQL.

- **App:** `public/app.html`, servido em `/`. É o protótipo aprovado, agora com login de verdade e dados vindos da API. O que o professor faz no celular dele aparece no celular do aluno e da família.
- **API:** `/api`, documentada em `docs/API.md`.
- **PWA:** `public/manifest.webmanifest`, `public/sw.js` e os ícones. Dá para instalar na tela inicial do celular (Android e iPhone).

## O que tem

- **Acesso:** login por nome de usuário, e-mail ou celular. Senha inicial no padrão Nome+ano, com troca obrigatória (o app recebe `423` até trocar).
- **Perfis:** dono, professor (só as categorias dele), aluno e responsável (vê os filhos). As permissões são checadas no servidor em cada rota.
- **Alunos:** cadastro com foto (recortada e reduzida no servidor), posições ordenadas (a primeira é a principal), login do aluno e do responsável criados juntos, e reaproveitamento do responsável pelo celular quando ele tem mais de um filho.
- **Categorias e promoção:** Sub-7 a Sub-18 calculadas pelo ano de nascimento, sugestão de promoção na virada do ano, promoção em lote com histórico, e lista de quem passa da idade máxima.
- **Agenda:**
  - Treinos e jogos, treinos semanais, plano de treino com atividades ligadas a jogadas e o que levar.
  - Cancelamento com motivo (inclusive da série inteira), duplicar e lembrete para quem não respondeu.
- **Convocação e presença:** no jogo, o professor convoca. No coletivo, entra quem confirma presença. Chamada completa ou "todos presentes" em um toque.
- **Jogo ao vivo no servidor:**
  - Cronômetro calculado pelo servidor, então funciona se o professor trocar de aparelho e a família vê o placar ao vivo.
  - Escalação, substituições, minutos por atleta, gols com assistência e tipo, chutes, escanteios, faltas, cartões (o segundo amarelo expulsa) e defesas.
  - Aluno que chegou sem confirmar entra durante o jogo.
  - "Desfazer" com histórico, intervalo e acréscimos.
  - Encerrar grava lances, minutos e estatísticas.
- **Carta e conquistas:** estatísticas calculadas a partir dos jogos que contam na carta, nível bronze, prata ou ouro pela presença, e conquistas automáticas com marcação de "nova" para a animação.
- **Lousa tática:** jogadas com dados do campo e a gravação contínua (até 2 minutos), por categoria.
- **Dicas e metas:** para um aluno, vários ou a categoria. Têm tipo, vínculo com jogo ou jogada, fixar na carta, status de lida e entendida, e metas com prazo.
- **Avisos:** notificação no banco, que o app mostra no sininho, mais Web Push opcional. Lembretes automáticos 24h e 2h antes.

## Instalar (máquina de desenvolvimento)

Requisitos: PHP 8.2+, Composer, extensões `gd`, `pdo_mysql` (ou `pdo_sqlite`), `mbstring`.

```bash
bash instalar.sh caio-pina-api
cd caio-pina-api
php artisan migrate --seed
php artisan test
php artisan serve
```

O script cria um Laravel 11 limpo, instala o Sanctum e copia este código por cima. Com `APP_ENV=local`, o seed cria os 300 alunos de demonstração (25 por categoria), uma agenda de exemplo e o João Silva (`joao.silva` / `demo123`) já liberado para testar o lado do aluno.

| Usuário | Senha inicial |
| --- | --- |
| `dono` | `CaioPina` + ano (ex.: CaioPina2026) |
| `professor` | `Professor` + ano |
| alunos de demonstração | `Demo` + ano |

## Produção na Hostinger (VPS)

Hospedagem compartilhada não serve: ela não mantém a fila e o agendador rodando, e os avisos atrasam ou não saem.

1. Na VPS: Nginx, PHP 8.3-FPM, MySQL 8, Composer e Supervisor.
2. Clone o projeto, `composer install --no-dev --optimize-autoloader`, copie `.env.exemplo` para o `.env` e ajuste.
3. Rode `php artisan key:generate`, `php artisan migrate --force`, `php artisan db:seed --class=CategoriaSeeder --force`, `php artisan db:seed --class=EquipeSeeder --force` e `php artisan storage:link`.
4. Otimize com `php artisan config:cache`, `php artisan route:cache` e `php artisan event:cache`.
5. **Fila (Supervisor):** `php artisan queue:work --sleep=3 --tries=3 --max-time=3600`.
6. **Agendador (cron):** `* * * * * cd /var/www/caio-pina-api && php artisan schedule:run >> /dev/null 2>&1`.
7. HTTPS com Let's Encrypt (Certbot). O Web Push exige HTTPS.

## Push no celular (opcional)

```bash
composer require laravel-notification-channels/webpush
php artisan vendor:publish --provider="NotificationChannels\WebPush\WebPushServiceProvider" --tag="migrations"
php artisan migrate
php artisan webpush:vapid
```

Depois, adicione o trait `NotificationChannels\WebPush\HasPushSubscriptions` no model `User`. A notificação `Aviso` passa a enviar push automaticamente quando o pacote está instalado. No iPhone, o push só funciona com o app instalado na tela inicial (iOS 16.4+).

## Mensagens em português

As mensagens de regra de negócio já estão em português. Para as mensagens padrão de validação do Laravel:

```bash
composer require lucascudo/laravel-pt-br-localization --dev
php artisan vendor:publish --tag=laravel-pt-br-localization
```

## Estrutura

```
app/Enums             Papel, Posicao (GOL, LD, ZAG, LE, VOL, MC, MEI, PD, PE, CA)
app/Models            User, Categoria, Aluno, Evento, Partida, Lance, Lousa, Dica, Meta, AlunoConquista, Promocao
app/Services          PartidaAoVivo, Agenda, Estatisticas, Conquistas, Promocoes, CadastroAlunos, Notificador, Fotos, Senhas
app/Http/Controllers  Api/* (um por área)
app/Console/Commands  EnviarLembretes (escolinha:lembretes, a cada 10 min)
database/migrations   Esquema completo
database/seeders      Categorias, equipe e demonstração
tests/Feature         Autenticação, permissões e partida ao vivo completa
docs/API.md           Rotas e exemplos
```

## Como o app usa a API

- **Login:** usuário, e-mail ou celular. O token fica no aparelho e, no primeiro acesso, a pessoa cria a própria senha.
- **Carregamento:** ao entrar, o app busca categorias, alunos, agenda, dicas, metas, jogadas e avisos. Cada ação (marcar treino, convocar, chamada, lançar gol…) vai para a API, e a tela recarrega o que mudou.
- **Jogo ao vivo:** cada ação vai para o servidor, e o app sincroniza a cada 4 segundos. Se o professor fechar o app ou trocar de aparelho, a partida continua de onde parou.
- **Perfis:** o dono alterna entre "Gestão" e "Treinos e jogos". O responsável com mais de um filho escolhe o filho no topo.

## Validação feita

- **Testes da API:** `php artisan test`, com 9 testes passando (7 da escolinha e 2 padrão do Laravel).
- **Teste de ponta a ponta:** o app foi usado como professor, aluno e dono contra a API rodando, com os 300 alunos de demonstração. Foram 29 verificações (login, agenda, convocação, jogo ao vivo completo, reabrir o app no meio da partida, resumo, chamada, lousa, dicas, carta, confirmação de presença, cadastro com acessos, redefinir senha e promoções), sem nenhum erro.
