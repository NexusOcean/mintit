# ─── shared builder ───────────────────────────────────────────────────────────
FROM node:24-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@11.5.3 --activate

ENV CI=true
ENV NEXT_TELEMETRY_DISABLED=1

COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/types/package.json ./packages/types/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

COPY packages ./packages
COPY apps ./apps

RUN pnpm --filter @mintit/types build
RUN pnpm --filter @mintit/api build
RUN pnpm --filter @mintit/web build

# ─── api runtime ──────────────────────────────────────────────────────────────
FROM node:24-slim AS api
WORKDIR /app

RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@11.5.3 --activate

COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/types/package.json ./packages/types/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/types/dist ./packages/types/dist

RUN mkdir -p /app/data/wallet && chown -R node:node /app/data

USER node
ENV NODE_ENV=production
CMD ["node", "apps/api/dist/src/main.js"]

# ─── web runtime ──────────────────────────────────────────────────────────────
FROM node:24-alpine AS web
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
