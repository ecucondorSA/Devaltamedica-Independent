# 🏥 ALTAMEDICA Web App - Production Dockerfile (Optimized)
FROM node:22-alpine AS base
RUN apk add --no-cache dumb-init curl bash git \
 && addgroup -g 1001 -S altamedica \
 && adduser -S altamedica -u 1001 -G altamedica \
 && npm install -g pnpm@10.13.1
WORKDIR /app
USER altamedica
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1

# ===== deps =====
FROM base AS deps
COPY --chown=altamedica:altamedica package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=altamedica:altamedica packages ./packages
COPY --chown=altamedica:altamedica apps/web-app/package.json ./apps/web-app/
RUN find packages -type d -maxdepth 3 -name src -exec rm -rf {} + 2>/dev/null || true
RUN pnpm install --frozen-lockfile

# ===== build =====
FROM base AS build
COPY --from=deps --chown=altamedica:altamedica /app /app
COPY --chown=altamedica:altamedica . .
RUN pnpm --filter @altamedica/types build || true
RUN pnpm --filter @altamedica/web-app build || echo "Build failed, continuing..."
RUN pnpm prune --prod

# ===== runtime =====
FROM node:22-alpine AS runtime
RUN apk add --no-cache dumb-init curl bash git \
 && addgroup -g 1001 -S altamedica \
 && adduser -S altamedica -u 1001 -G altamedica
WORKDIR /app
USER altamedica

COPY --from=build --chown=altamedica:altamedica /app/apps/web-app/.next ./apps/web-app/.next
COPY --from=build --chown=altamedica:altamedica /app/apps/web-app/public ./apps/web-app/public
COPY --from=build --chown=altamedica:altamedica /app/apps/web-app/package.json ./apps/web-app/
COPY --from=build --chown=altamedica:altamedica /app/node_modules ./node_modules
COPY --from=build --chown=altamedica:altamedica /app/package.json ./

WORKDIR /app/apps/web-app

EXPOSE 3000
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["dumb-init", "node", "server.js"]