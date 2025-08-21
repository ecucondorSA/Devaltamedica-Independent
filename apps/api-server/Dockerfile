# Dockerfile robusto para api-server (Node 20 slim + pnpm + Prisma)
FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate
WORKDIR /app

# Copiar manifests y workspaces mínimos para cache
COPY ../../package.json ../../pnpm-workspace.yaml ../../pnpm-lock.yaml ./
COPY ../../configs ./configs
COPY ../../packages ./packages
COPY package.json ./apps/api-server/

# Instalar TODAS las dependencias (incluyendo devDependencies para build)
RUN pnpm install --frozen-lockfile

# Copiar código
COPY ../../packages ./packages
COPY . ./apps/api-server

# Generar Prisma Client (si existe schema en packages/database)
RUN pnpm --filter @altamedica/database run prisma:generate || pnpm --filter api-server run prisma:generate || true

# Compilar paquetes internos y api-server
# Primero instalar tsup globalmente si es necesario para el build
RUN pnpm add -g tsup || true
RUN pnpm -r --filter "@altamedica/*" run build --if-present || true
RUN pnpm --filter api-server... run build

# Reducir deps a producción
RUN pnpm prune --prod

FROM node:20-slim AS runtime
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate
ENV NODE_ENV=production
WORKDIR /app

# Usuario no root por seguridad
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nodejs
USER nodejs

# Copiar artefactos mínimos
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/api-server/package.json ./apps/api-server/package.json
COPY --from=base /app/apps/api-server/dist ./apps/api-server/dist

WORKDIR /app/apps/api-server
EXPOSE 3001
ENV PORT=3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT||3001) + '/api/v1/health/quick').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.js"]