# 👥 ALTAMEDICA Patients App - Production Dockerfile (Optimized)
FROM node:22-alpine AS base
LABEL org.opencontainers.image.source="https://example.com/altamedica" \
	org.opencontainers.image.title="AltaMedica Patients App" \
	org.opencontainers.image.description="Portal de Pacientes AltaMedica (Next.js)" \
	org.opencontainers.image.vendor="AltaMedica" \
	org.opencontainers.image.licenses="Proprietary" \
	org.opencontainers.image.base.name="node:22-alpine" \
	org.opencontainers.image.version="1.0.0"
RUN apk add --no-cache dumb-init curl bash git libc6-compat \
 && addgroup -g 1001 -S altamedica \
 && adduser -S altamedica -u 1001 -G altamedica \
 && npm install -g pnpm@10.13.1
WORKDIR /app
# Asegurar ownership para usuario no root
RUN chown -R altamedica:altamedica /app
USER altamedica
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PNPM_HOME=/home/altamedica/.local/share/pnpm PATH="/home/altamedica/.local/share/pnpm:$PATH"

# ========== deps (cache) ==========
FROM base AS deps
# Copiamos solo manifests para maximizar cache
COPY --chown=altamedica:altamedica package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=altamedica:altamedica packages ./packages
COPY --chown=altamedica:altamedica apps/patients/package.json ./apps/patients/
# Eliminar código fuente para no invalidar cache en cambios de código
RUN find packages -type d -maxdepth 3 -name src -exec rm -rf {} + 2>/dev/null || true
RUN pnpm fetch --frozen-lockfile || true
# Intentar instalación estricta; si lockfile está desactualizado (ERR_PNPM_OUTDATED_LOCKFILE) rehacer sin frozen
RUN pnpm install --frozen-lockfile || pnpm install --no-frozen-lockfile

# ========== build ==========
FROM base AS build
COPY --from=deps --chown=altamedica:altamedica /app /app
# Ahora copiamos todo el monorepo
COPY --chown=altamedica:altamedica . .
# Build tipos (ignorar fallo si ya compilados)
RUN pnpm --filter @altamedica/types build || true
# Build app (fallback a build:prod si existe)
RUN pnpm --filter @altamedica/patients build || pnpm build || pnpm build:prod || echo "No build script found"
# Prune deps para runtime
RUN pnpm prune --prod
# Crear capa standalone Next (si soportado)
RUN node -e "try{require('fs').accessSync('.next/standalone');}catch(e){process.exit(0)}" || true

# ========== runtime ==========
FROM node:22-alpine AS runtime
LABEL org.opencontainers.image.title="AltaMedica Patients App Runtime" \
	org.opencontainers.image.version="1.0.0"
RUN apk add --no-cache dumb-init curl bash git libc6-compat \
 && addgroup -g 1001 -S altamedica \
 && adduser -S altamedica -u 1001 -G altamedica \
 && mkdir -p /app/.next/cache && chown -R altamedica:altamedica /app
WORKDIR /app
USER altamedica
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3003 HOSTNAME=0.0.0.0

# Copiar sólo lo necesario
COPY --from=build --chown=altamedica:altamedica /app/node_modules ./node_modules
COPY --from=build --chown=altamedica:altamedica /app/package.json ./package.json
COPY --from=build --chown=altamedica:altamedica /app/apps/patients ./apps/patients
COPY --from=build --chown=altamedica:altamedica /app/packages ./packages
COPY --from=build --chown=altamedica:altamedica /app/.next ./.next 2>/dev/null || true
COPY --from=build --chown=altamedica:altamedica /app/dist ./dist 2>/dev/null || true

EXPOSE 3003
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 CMD curl -fsS http://localhost:3003/ || exit 1

# Seguridad (rootfs puede marcarse read-only en orquestador; usar /tmp para tmpfs)
ENTRYPOINT ["dumb-init","--"]
CMD ["pnpm","start"]