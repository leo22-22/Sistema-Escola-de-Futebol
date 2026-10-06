# API · Caio Pina

Base: `/api`. Autenticação: `Authorization: Bearer {token}` (Sanctum). Respostas em JSON.

Erros comuns:

| Código | Quando |
| --- | --- |
| `401` | Sem token ou token inválido |
| `403` | O perfil não pode acessar aquela categoria ou aluno |
| `404` | Registro não existe (ou não há partida em andamento) |
| `409` | Já existe partida em andamento para o evento |
| `422` | Dados inválidos ou regra de negócio. A mensagem vem pronta para mostrar |
| `423` | O usuário precisa trocar a senha inicial (`codigo: "trocar_senha"`) |

## Acesso

| Método | Rota | Corpo | Observação |
| --- | --- | --- | --- |
| POST | `/login` | `login`, `senha`, `dispositivo?` | `login` aceita usuário, e-mail ou celular |
| GET | `/me` | | Perfil, papel e alunos vinculados |
| POST | `/senha` | `senha_atual?`, `nova_senha`, `nova_senha_confirmation` | `senha_atual` não é pedida no primeiro acesso |
| POST | `/logout` | | |

```json
POST /api/login
{ "login": "joao.silva", "senha": "demo123" }

200
{ "token": "1|abc...", "usuario": { "id": 15, "nome": "João Silva", "papel": "aluno", "precisa_trocar_senha": false,
  "alunos": [{ "id": 101, "nome": "João Silva", "categoria": "Sub-11", "foto_url": null }] } }
```

## Início

`GET /inicio` devolve uma tela diferente por perfil. Para responsável com mais de um filho, use `?aluno_id=`.

- **Dono:** totais, quem ainda não fez o primeiro acesso, aviso de promoção, mais tudo do professor.
- **Professor:** partidas em andamento, próximos eventos e pendências (chamadas, jogos sem convocação, metas atrasadas, dicas não lidas).
- **Aluno/responsável:** estatísticas, nível da carta, próximo compromisso, dica, metas, conquistas novas e avisos não lidos.

## Alunos (dono cadastra; professor e família consultam)

| Método | Rota | Quem |
| --- | --- | --- |
| GET | `/alunos?categoria_id=&busca=` | todos (só o que pode ver) |
| GET | `/alunos/{id}` | todos |
| GET | `/alunos/{id}/carta` | todos |
| POST | `/alunos/{id}/conquistas/vistas` | todos (depois da animação) |
| POST | `/alunos` (multipart) | dono |
| POST | `/alunos/{id}` (multipart) | dono (editar, inclusive foto) |
| DELETE | `/alunos/{id}` | dono |
| POST | `/alunos/{id}/resetar-senha` | dono |
| POST | `/alunos/{id}/categoria` | dono (`categoria_id`) |
| GET | `/usuarios/sugerir?nome=` | dono (sugere `joao.silva`, `joao.silva2`...) |

Cadastro:

```
POST /api/alunos   (multipart/form-data)
nome=Pedro Lima
nascimento=2015-08-02
categoria_id=5
posicoes[]=CA            <- a primeira é a principal
posicoes[]=PE
numero_camisa=9          (opcional)
username=pedro.lima
responsavel_nome=Carlos Lima
responsavel_celular=(18) 99100-0002
termo_aceito=1
foto=<arquivo>           (opcional)

201
{ "aluno": {...},
  "acessos": { "aluno": { "login": "pedro.lima", "senha_inicial": "Pedro2026" },
               "responsavel": { "login": "18991000002", "senha_inicial": "Pedro2026", "ja_tinha_conta": false } } }
```

## Categorias e promoção

| Método | Rota | Quem |
| --- | --- | --- |
| GET | `/categorias` | todos (com contagem, ano de nascimento e professores) |
| PUT | `/categorias/{id}/professores` | dono (`professores: [ids]`) |
| GET | `/promocoes` | dono: `sugestoes`, `saem_da_escolinha`, `mostrar_aviso` |
| POST | `/promocoes` | dono (`alunos: [ids]`) |

## Agenda

| Método | Rota | Quem |
| --- | --- | --- |
| GET | `/eventos?categoria_id=&de=&ate=&grupo=` | todos (padrão: 30 dias atrás até 60 à frente) |
| GET | `/eventos/{id}` | todos |
| POST | `/eventos` | dono, professor |
| PUT | `/eventos/{id}` | dono, professor |
| DELETE | `/eventos/{id}` | dono, professor (não encerrados) |
| GET | `/eventos/{id}/presenca` | dono, professor (todos da categoria com convocação, confirmação e chamada) |
| POST | `/eventos/{id}/cancelar` | `motivo`, `serie?` |
| POST | `/eventos/{id}/reativar` | |
| POST | `/eventos/{id}/duplicar` | cria cópia na semana seguinte |
| PUT | `/eventos/{id}/convocacao` | só jogos (`alunos: [ids]`) |
| PUT | `/eventos/{id}/chamada` | `chamada: { "aluno_id": "presente|falta|justificada" }` |
| POST | `/eventos/{id}/chamada-rapida` | todos presentes, menos quem disse que não ia |
| POST | `/eventos/{id}/lembrete` | avisa quem não respondeu |
| POST | `/eventos/{id}/confirmacao` | aluno, responsável (`aluno_id`, `status: vai|nao_vai`) |
| GET | `/eventos/{id}/resumo` | todos (só encerrados) |

Criar treino semanal com plano:

```json
POST /api/eventos
{ "categoria_id": 5, "grupo": "treino", "modalidade": "Tático", "titulo": "Saída de bola",
  "data": "2026-10-06", "hora_inicio": "17:00", "hora_fim": "18:30", "local": "Campo 2",
  "levar": ["Chuteira", "Caneleira"],
  "plano": { "objetivo": "Sair jogando sob pressão",
             "atividades": [{ "nome": "Rondo 5x2", "minutos": 20, "lousa_id": 3 }] },
  "repetir": true, "dias_semana": [2, 4], "repetir_ate": "2026-12-15" }
```

`dias_semana` vai de 0 (domingo) a 6 (sábado). O limite é de 60 datas por série.

Modalidades: treino = Tático, Técnico, Físico, Ataque, Defesa, Bola parada, Coletivo. Jogo = Amistoso, Competição, Teste, Festival.

## Jogo ao vivo

O estado fica no servidor. O app faz `GET` a cada 2 a 5 segundos (ou após cada ação) e desenha a tela com a resposta. O cronômetro vem pronto em `segundos`.

| Método | Rota | Quem |
| --- | --- | --- |
| POST | `/partidas/rapida` | `categoria_id`, `modalidade: Coletivo|Amistoso|Teste`, `adversario?`, `local?` → `evento_id` |
| POST | `/eventos/{id}/partida` | iniciar |
| GET | `/eventos/{id}/partida` | todos da categoria (placar ao vivo para a família) |
| POST | `/eventos/{id}/partida/acoes` | ações abaixo |
| POST | `/eventos/{id}/partida/encerrar` | `conta_na_carta`, `observacao?` |
| DELETE | `/eventos/{id}/partida` | descartar sem salvar |

Iniciar:

```json
// Jogo
{ "n": 7, "duracao": 20, "tempos": 2, "adversario": "EC Vila Nova", "titulares": [1,2,3,4,5,6,7], "reservas": [8,9] }
// Coletivo: os primeiros n de cada time começam, o resto vai para o banco
{ "n": 7, "duracao": 15, "tempos": 1, "time_a": [1,3,5,7,9,11,13,15], "time_b": [2,4,6,8,10,12,14] }
```

Ações (`POST /eventos/{id}/partida/acoes`):

| `acao` | Campos |
| --- | --- |
| `cronometro` | `comando: iniciar|pausar|ajustar`, `segundos` (ajustar, ±600) |
| `fim_tempo` / `segundo_tempo` | |
| `gol` | `time`, `aluno_id?`, `assistencia_id?`, `detalhe: normal|falta|penalti|cabeca|fora_area` |
| `chute` | `time`, `aluno_id?`, `no_gol` |
| `escanteio` / `falta` | `time` |
| `cartao` | `time`, `aluno_id?`, `cor: amarelo|vermelho` (2º amarelo expulsa) |
| `defesa` / `penalti_defendido` | `time`, `aluno_id` |
| `substituicao` | `time`, `sai_id`, `entra_id` |
| `entrar` | `time`, `aluno_id` (do banco, se o time estiver incompleto) |
| `adicionar` | `time`, `aluno_id` (chegou sem confirmar; marca presença) |
| `remover_lance` | `lance_id` (gol, chute, defesa, pênalti, amarelo) |
| `desfazer` | volta a última ação |

`time` é `a` (Caio Pina ou Time A) ou `b` (adversário ou Time B). Em jogo contra outro time, o lado `b` não tem jogadores, então gol e cartão do adversário vão sem `aluno_id`.

Resposta (todas as ações):

```json
{ "placar": {"a": 1, "b": 0}, "segundos": 312, "minuto": "26'", "periodo": 2, "fase": "jogo", "rodando": true,
  "campo": {"a": [1,2,3], "b": null}, "banco": {"a": [8], "b": []}, "expulsos": [],
  "minutos_jogados": {"1": 26}, "estatisticas": {"a": {"chutes": 4, "no_gol": 2, ...}, "b": {...}},
  "lances": [{ "id": "01J...", "tipo": "gol", "time": "a", "aluno_id": 8, "minuto": "26'" }],
  "jogadores": {"1": {"nome": "...", "numero": 10, "posicoes": ["MEI"]}}, "pode_desfazer": true }
```

## Lousa tática

| Método | Rota | Quem |
| --- | --- | --- |
| GET | `/lousas?categoria_id=&tipo=` | todos |
| GET | `/lousas/{id}` | todos |
| POST/PUT/DELETE | `/lousas`, `/lousas/{id}` | dono, professor |

Corpo: `categoria_id`, `nome`, `tipo`, `descricao?`, `jogadores_por_time`, `dados` (`casa`, `fora`, `bola`, `itens`, formações, adversário, visão) e `gravacao?` (`dur`, `frames`, `itens`). É o mesmo formato que o protótipo já usa.

## Dicas e metas

| Método | Rota | Quem |
| --- | --- | --- |
| GET | `/dicas?aluno_id=&tipo=` | todos (para o aluno, marca como lidas) |
| POST | `/dicas` | dono, professor: `modo: um|varios|categoria`, `alunos[]` ou `categoria_id`, `tipo`, `texto`, `evento_id?`, `lousa_id?`, `fixar?` |
| POST | `/dicas/{id}/fixar` | dono, professor (alterna) |
| POST | `/dicas/{id}/entendida` | aluno, responsável |
| DELETE | `/dicas/{id}` | dono, professor |
| GET | `/metas` | todos |
| POST | `/metas` | `aluno_id`, `texto`, `prazo` |
| PUT | `/metas/{id}` | `status: andamento|concluida` |
| DELETE | `/metas/{id}` | |

## Avisos

| Método | Rota |
| --- | --- |
| GET | `/notificacoes` → `nao_lidas` e `itens` (`titulo`, `texto`, `tipo`, `dados`) |
| POST | `/notificacoes/lidas` |

Tipos: `agenda`, `convocacao`, `lembrete`, `resultado`, `conquista`, `promocao`, `dica`, `meta`, `jogada`. Use `dados.evento_id` e `dados.lousa_id` para abrir a tela certa ao tocar no aviso.
