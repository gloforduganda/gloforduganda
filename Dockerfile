# syntax=docker/dockerfile:1.6
# ────────────────────────────────────────────────────────────
# Gloford — Next.js production image
# Multi-stage: deps -> builder -> runner. Final image runs
# `node server.js` from Next's standalone output.
# ────────────────────────────────────────────────────────────

ARG NODE_VERSION=22-alpine

# ─── deps ────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS deps
RUN apk update && apk add --no-cache libc6-compat openssl
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-maxtimeout 120000 && \
    pnpm config set fetch-timeout 120000 && \
    pnpm install --frozen-lockfile

# ─── builder ────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS builder
RUN apk update && apk add --no-cache libc6-compat openssl
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client against whichever DB url is passed.
ARG DATABASE_URL="postgresql://user:pass@localhost/dummy?sslmode=disable&connect_timeout=1"
ARG DIRECT_URL="postgresql://user:pass@localhost/dummy?sslmode=disable&connect_timeout=1"
ENV DATABASE_URL=${DATABASE_URL} \
    DIRECT_URL=${DIRECT_URL} \
    NEXT_TELEMETRY_DISABLED=1 \
    SKIP_ENV_VALIDATION=1 \
    PRISMA_QUERY_ENGINE_LOG_LEVEL=error

RUN for i in 1 2 3 4 5; do \
      if pnpm prisma generate; then \
        break; \
      fi; \
      if [ "$i" = "5" ]; then \
        exit 1; \
      fi; \
      sleep 10; \
    done
RUN pnpm build

# ─── runner ─────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
RUN apk add --no-cache openssl su-exec
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Non-root user.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Next.js standalone output already includes @prisma/client (via file
# tracing). The Prisma CLI is not needed at runtime — migrations are
# applied by the `migrate` compose service, not the app container.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Create uploads directory; entrypoint will re-chown after volume mount
RUN mkdir -p /app/uploads

# Entrypoint: fixes volume ownership then drops to nextjs user
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
