# syntax=docker/dockerfile:1

# ---- deps: instala dependências (Yarn Berry, node-modules linker) ----
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY .yarnrc.yml ./
COPY .yarn ./.yarn
COPY package.json yarn.lock ./
RUN yarn install --immutable

# ---- build: compila o app estático (Vite) ----
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY .yarnrc.yml ./
COPY .yarn ./.yarn
COPY . .

# Vite injeta VITE_API_URL em tempo de build — o bundle final é estático,
# servido pelo nginx no estágio seguinte, sem servidor Node em runtime.
# Nunca hardcoded no código-fonte (ver src/config/env.ts).
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN yarn build

# ---- production: nginx servindo os arquivos estáticos ----
FROM nginx:1.27-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
