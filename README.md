# Brain Agriculture — API (Teste Técnico)

Backend do teste técnico Brain Agriculture: cadastro de produtores rurais, suas propriedades, safras, culturas e o vínculo entre elas (culturas plantadas), mais um dashboard agregado. NestJS + TypeScript + PostgreSQL (via Prisma), arquitetura hexagonal (ports & adapters), construído inteiramente via TDD.

> O racional completo de cada decisão (por que hexagonal, por que Prisma, por que TDD, trade-offs registrados) vive no repositório de planejamento (`verx-resources`, privado ao processo de avaliação) — este README resume o suficiente para quem for rodar/avaliar só este repositório, sem precisar navegar dois lugares.

## Como rodar

Pré-requisitos: Docker + Docker Compose.

```bash
cp .env.example .env   # ajuste se necessário; os defaults já funcionam com o docker-compose
docker compose up --build
```

Isso sobe três serviços (`docker-compose.yml`):

- `postgres` (`verx-postgres`, `postgres:16-alpine`) — fonte de verdade dos dados, com healthcheck e volume nomeado.
- `redis` (`verx-redis`, `redis:7-alpine`) — store do cache do dashboard (stale-while-revalidate, ver abaixo), com healthcheck.
- `api` (`verx-api`) — build multi-stage (`Dockerfile`), roda `prisma migrate deploy` seguido do seed de demonstração (idempotente, ver abaixo) e só então `node dist/main.js`. Só sobe depois de `postgres` **e** `redis` ficarem `healthy`.

Depois de subir (aguarde o healthcheck de `api` ficar `healthy`, ~15-20s):

- **Swagger/OpenAPI**: http://localhost:3000/docs
- **API**: http://localhost:3000/api/v1 (ex.: `GET /api/v1/producers`, `GET /api/v1/dashboard`)
- **Health check**: http://localhost:3000/api/v1/health (reporta Postgres **e** Redis)

O ambiente já sobe com **dado de demonstração** (produtores, propriedades em múltiplos estados, safras, culturas e vínculos) — o Swagger e o `GET /dashboard` não nascem vazios. Ver [Seed de dados de demonstração](#seed-de-dados-de-demonstração) abaixo.

### Variáveis de ambiente

Ver `.env.example` (copiado para `.env`, nunca commitado):

| Variável | Descrição | Default (dev) |
|---|---|---|
| `DATABASE_URL` | Connection string do PostgreSQL | `postgresql://verx:verx@localhost:5432/verx?schema=public` (ajustada para `postgres:5432` dentro do `docker-compose.yml`) |
| `NODE_ENV` | `development` \| `test` \| `production` | `development` |
| `PORT` | Porta HTTP da API | `3000` |
| `REDIS_URL` | Connection string do Redis (cache do dashboard) | `redis://localhost:6379` (ajustada para `redis:6379` dentro do `docker-compose.yml`) |
| `DASHBOARD_CACHE_TTL_SECONDS` | Janela de staleness do cache do dashboard e cadência do refresh agendado | `300` (5 min) |

### Rodando localmente sem Docker (desenvolvimento)

Precisa também de um Redis local (`redis-server` ou `docker run -p 6379:6379 redis:7-alpine`) — a aplicação não sobe sem `REDIS_URL` apontando pra um Redis alcançável (ver [Variáveis de ambiente](#variáveis-de-ambiente)).

```bash
corepack enable && corepack prepare yarn@4.14 --activate
yarn install
yarn prisma generate         # Yarn Berry bloqueia o postinstall de dependências por padrão
yarn prisma migrate dev      # aplica as migrations num Postgres local
yarn prisma db seed          # opcional: popula o dado de demonstração
yarn start:dev
```

Testes:

```bash
yarn test        # unitários (services, validadores, entidades) — sem I/O
yarn test:e2e     # integração (Testcontainers, Postgres + Redis reais) + e2e HTTP (Supertest)
```

## Decisões técnicas e por quê

- **Arquitetura hexagonal (ports & adapters) em todos os módulos** (`Producer`, `Farm`, `PlantedCrop`, `Season`, `Crop`, `Dashboard`): `domain/` (entidade ou value object + porta) e `application/` (service/caso de uso) nunca importam Prisma diretamente — só `infrastructure/` conhece o banco. Permite trocar de ORM/banco escrevendo só um novo adapter, sem tocar em regra de negócio. Rigor uniforme mesmo nos módulos mais simples (`Season`/`Crop`, catálogos; `Dashboard`, agregação de leitura) — consistência estrutural, não exceção que um avaliador precise entender.
- **TDD estrito (red-green-refactor)** em toda a base: nenhuma linha de implementação foi escrita antes do teste que a descreve. Unitários contra portas fake (rápidos, sem I/O); integração contra Postgres real via **Testcontainers** (não sqlite/in-memory — a correção depende de precisão `Decimal`, constraints únicas e `onDelete` reais).
- **Prisma como ORM**, schema centralizado em `prisma/schema.prisma`. Colunas de área são `Decimal(10,2)` (nunca `float`, para não acumular erro de arredondamento em hectares).
- **Validação de CPF/CNPJ via biblioteca** (`cpf-cnpj-validator`), não algoritmo Módulo 11 escrito à mão — cobre também **CNPJ alfanumérico** (Receita Federal, Nota Técnica 49/2024), testado com um exemplo real (`00.000.000/E08G-12`).
- **Regra de negócio no Service, não só no DTO**: o DTO valida a *forma* do input (ex.: `class-validator` na soma de área do `create`); o Service é o dono autoritativo da regra (revalida a soma de área no `PATCH` mesclando com o estado persistido; checa unicidade de documento/year/name contra o banco) — nenhum outro ponto de entrada consegue burlar a regra.
- **Paginação obrigatória** em todo endpoint de listagem (`{ data, meta: { total, page, limit } }`), teto de 100 itens por página — nenhum endpoint devolve a tabela inteira.
- **Agregação sempre no banco**: `GET /dashboard` resolve `COUNT`/`SUM`/`GROUP BY` via query (Prisma `aggregate`/`groupBy` + um `$queryRaw` tipado para o `JOIN` de cultura), nunca carregando linhas inteiras para o Node somar em memória. Índices em toda FK usada em filtro/join e em `state` (coluna de `GROUP BY` do dashboard).
- **Cache do dashboard (stale-while-revalidate, Redis)**: `GET /dashboard` nunca recalcula por requisição — sempre lê um snapshot pré-computado, mantido fresco por um `DashboardCacheRefreshScheduler` (`@nestjs/schedule`) que roda uma vez no bootstrap e depois a cada `DASHBOARD_CACHE_TTL_SECONDS` (default 300s), fora do tráfego. Única exceção: cold start (cache ainda vazio, primeiro refresh ainda não rodou), quando cai num fallback síncrono. Store é sempre via `@nestjs/cache-manager` + `@keyv/redis` (nunca um cliente Redis cru como `ioredis`). A conexão usa `connectionTimeout` + `throwOnErrors` explícitos — sem isso, o store subjacente nunca desiste de conectar a um Redis inalcançável (retry com backoff indefinido) e qualquer operação trava para sempre; com o timeout, uma falha de Redis vira um erro rápido, capturado e logado, sem travar o boot da aplicação nem a resposta HTTP.
- **Observabilidade**: logs estruturados (JSON) via `nestjs-pino`, com `X-Request-Id` de correlação por requisição (gerado ou propagado, sempre ecoado na resposta, inclusive em respostas servidas do cache). CPF/CNPJ nunca aparece em log (redact explícito + disciplina de só logar IDs em eventos de negócio); o scheduler/adapter do cache logam só metadados do evento (duração, sucesso/falha), nunca o snapshot inteiro. Erros seguem um formato padronizado (`{ statusCode, message, timestamp, path }`) via `AllExceptionsFilter` global; falha de conectividade com o banco vira `503` em vez de `500` genérico. `GET /health` via `@nestjs/terminus` checa o Postgres **e** o Redis.
- **Contrato de erros consistente**: `409 Conflict` para violação de unicidade (documento/year/name duplicado, combinação farm+season+crop repetida) e para exclusão de `Season`/`Crop` referenciada por um `PlantedCrop` (histórico, não removido em cascata); `404 Not Found` para entidade/relacionamento inexistente; `400 Bad Request` para violação de forma ou da regra de área; `503 Service Unavailable` para banco inalcançável.
- **Seed de dados de demonstração idempotente**: ver seção própria abaixo.
- **Docker multi-stage** (`node:20-alpine`) + `docker-compose` com nomes fixos de container (`verx-api`, `verx-postgres`, `verx-redis`), healthchecks nos três serviços.

## Seed de dados de demonstração

`prisma/seed.ts` — roda automaticamente no start do container (depois de `prisma migrate deploy`, antes de `node dist/main.js`), e também é acionável localmente via `yarn prisma db seed`.

- **Idempotente**: checa `prisma.producer.count()` antes de inserir qualquer coisa — se já existe dado, não faz nada. Seguro em todo restart do container, nunca duplica.
- **Cobre os cinco módulos**: 3 `Producer`s (um CPF, um CNPJ numérico, um **CNPJ alfanumérico real** — `00.000.000/E08G-12`, Nota Técnica RFB 49/2024), 6 `Farm`s espalhadas por 5 `BrazilianState` diferentes, 3 `Season`s, 4 `Crop`s, 9 `PlantedCrop`s com mix de área agricultável/vegetação — suficiente para os três gráficos do `GET /dashboard` nascerem não-triviais.
- **Compilado para JS puro** no build de produção (`yarn build:seed`, `tsconfig.seed.json` dedicado) — a imagem final não carrega `ts-node`/toolchain de dev, só `node dist/prisma/seed.js`.
- Fora do escopo de TDD (não é regra de negócio, endpoint nem validador — mesmo tratamento das fixtures de teste `*.fixture.ts`), mas validado de ponta a ponta via Docker: ambiente subido do zero, endpoints conferidos com dado presente, restart confirmado sem duplicação.

## Limitações conhecidas

Declaradas explicitamente, não escondidas — fora do escopo deste teste técnico:

- **Sem autenticação/autorização**: qualquer cliente com acesso à API pode chamar qualquer endpoint. Um sistema real precisaria de auth (JWT/OAuth) e controle de acesso por produtor/organização.
- **Sem multi-tenancy**: todos os dados vivem no mesmo schema, sem isolamento por cliente/organização.
- **Sem filas/eventos**: toda operação é síncrona request-response; não há processamento assíncrono nem integração por eventos.
- **Sem frontend**: a trilha deste teste técnico é backend apenas.
- **Validação funcional via Swagger é manual**: não há um passo automatizado que navegue o Swagger UI — é um checklist informal de quem for avaliar.

## Modelo de dados (ERD)

```mermaid
erDiagram
    Producer ||--o{ Farm : "possui"
    Farm ||--o{ PlantedCrop : "cultiva (cascade)"
    Season ||--o{ PlantedCrop : "referenciada por (restrict)"
    Crop ||--o{ PlantedCrop : "referenciada por (restrict)"

    Producer {
        string id PK
        string name
        string document UK "CPF ou CNPJ, alfanumérico incluso"
        datetime createdAt
        datetime updatedAt
    }

    Farm {
        string id PK
        string name
        string city
        string state "BrazilianState (27 UFs), indexado"
        decimal totalAreaHectares "Decimal(10,2)"
        decimal arableAreaHectares "Decimal(10,2)"
        decimal vegetationAreaHectares "Decimal(10,2)"
        string producerId FK "onDelete: Cascade, indexado"
        datetime createdAt
        datetime updatedAt
    }

    Season {
        string id PK
        int year UK
    }

    Crop {
        string id PK
        string name UK
    }

    PlantedCrop {
        string id PK
        string farmId FK "onDelete: Cascade, indexado"
        string seasonId FK "onDelete: Restrict, indexado"
        string cropId FK "onDelete: Restrict, indexado"
        datetime createdAt
        datetime updatedAt
    }
```

Notas de cardinalidade/`onDelete` (não expressas literalmente no Mermaid acima, registradas aqui):

- `Producer 1 — N Farm`, `onDelete: Cascade` — apagar um produtor apaga suas propriedades.
- `Farm 1 — N PlantedCrop`, `onDelete: Cascade` — apagar uma propriedade apaga seus plantios.
- `Season 1 — N PlantedCrop` e `Crop 1 — N PlantedCrop`, ambos `onDelete: Restrict` — apagar uma safra/cultura de catálogo referenciada por algum plantio é **bloqueado** (409), não propagado: são registros históricos, não deveriam sumir como efeito colateral de uma limpeza de catálogo.
- Índice único composto em `PlantedCrop(farmId, seasonId, cropId)` — mesma combinação farm+safra+cultura não pode ser registrada duas vezes.

## Endpoints

Prefixo `/api/v1`. Contrato completo, com exemplos e schemas, em `/docs` (Swagger).

| Recurso | Rotas |
|---|---|
| Produtores | `POST/GET /producers`, `GET/PATCH/DELETE /producers/:id` |
| Propriedades | `POST/GET /farms` (filtros `producerId`/`state`/`city`), `GET/PATCH/DELETE /farms/:id` |
| Safras | `POST/GET /seasons`, `GET/PATCH/DELETE /seasons/:id` |
| Culturas | `POST/GET /crops`, `GET/PATCH/DELETE /crops/:id` |
| Culturas plantadas | `POST/GET /farms/:farmId/planted-crops` (POST aceita lote), `DELETE /farms/:farmId/planted-crops/:id` (sem PATCH — associação atômica) |
| Dashboard | `GET /dashboard` (total de farms, total de hectares, 3 gráficos de pizza: por estado, por cultura, por uso do solo) |
| Health | `GET /health` |

Todo endpoint de listagem é paginado (`?page=&limit=`, teto de 100), resposta no envelope `{ data, meta: { total, page, limit } }`.
