# syntax=docker/dockerfile:1

# ---- deps: instala todas as dependências (Yarn Berry, node-modules linker) ----
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY .yarnrc.yml ./
COPY .yarn ./.yarn
COPY package.json yarn.lock ./
# --mode=skip-build: nosso próprio "postinstall": "prisma generate" ainda não
# pode rodar aqui — prisma/schema.prisma só chega no estágio seguinte (COPY . .).
# Passo explícito de `yarn prisma generate` roda logo abaixo, depois do schema
# existir (mesma lógica do postinstall do package.json, ver tecnologias.md).
RUN yarn install --immutable --mode=skip-build

# ---- build: gera o Prisma Client e compila TypeScript ----
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY .yarnrc.yml ./
COPY .yarn ./.yarn
COPY . .
RUN yarn prisma generate
RUN yarn build

# ---- production: imagem final, só o necessário para rodar ----
# CMD usa o binário do prisma direto (node_modules/.bin), sem depender de yarn/
# corepack em runtime — dispensa yarn.lock/.yarnrc.yml nesta última camada.
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

EXPOSE 3000

CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/main.js"]
