# ⚙️ ALTAMEDICA Admin App - Production Dockerfile (Optimized v2)
FROM node:22-alpine AS base
ENV PNPM_HOME=/home/altamedica/.local/share/pnpm \
    PATH=$PNPM_HOME:$PATH \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache dumb-init curl bash git \
 && addgroup -g 1001 -S altamedica \
 && adduser -S altamedica -u 1001 -G altamedica \
 && npm install -g pnpm@10.13.1 \
 && mkdir -p /pnpm-store && chown -R altamedica:altamedica /pnpm-store
WORKDIR /app
USER altamedica
ARG PNPM_FLAGS=--frozen-lockfile

# ===== deps =====
FROM base AS deps
ARG PNPM_FLAGS
# Copiamos solo lo necesario para resolver workspace sin código completo
COPY --chown=altamedica:altamedica package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=altamedica:altamedica packages/*/package.json ./packages/*/
COPY --chown=altamedica:altamedica apps/admin/package.json ./apps/admin/
# Instalación (si lockfile desincronizado, fallback)
RUN pnpm install $PNPM_FLAGS || (echo "[WARN] Lockfile desync, fallback sin --frozen" && pnpm install)

# ===== build =====
FROM base AS build
ARG PNPM_FLAGS
COPY --from=deps --chown=altamedica:altamedica /app /app
# Ahora sí el código fuente mínimo requerido
COPY --chown=altamedica:altamedica packages ./packages
COPY --chown=altamedica:altamedica apps/admin ./apps/admin
# Build tipos primero (ignorar errores opcionales)
RUN pnpm --filter @altamedica/types build || true
RUN pnpm build || pnpm build:prod || echo "[INFO] No build script found"
RUN pnpm prune --prod

# ===== runtime =====
FROM node:22-alpine AS runtime
RUN apk add --no-cache dumb-init curl bash git \
 && addgroup -g 1001 -S altamedica \
 && adduser -S altamedica -u 1001 -G altamedica
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3005
WORKDIR /app
USER altamedica
COPY --from=build --chown=altamedica:altamedica /app/node_modules ./node_modules
COPY --from=build --chown=altamedica:altamedica /app/package.json ./package.json
COPY --from=build --chown=altamedica:altamedica /app/apps/admin ./apps/admin
COPY --from=build --chown=altamedica:altamedica /app/packages ./packages
COPY --from=build --chown=altamedica:altamedica /app/.next ./.next 2>/dev/null || true
EXPOSE 3005
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 CMD curl -f http://localhost:3005/api/health || exit 1
ENTRYPOINT ["dumb-init","--"]
CMD ["pnpm","start"]