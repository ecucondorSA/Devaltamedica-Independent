# 🚀 Configuración con Vercel (Sin AWS!)

## Por qué Vercel es mejor que AWS:

- ✅ **Gratis** para proyectos personales
- ✅ **Sin configuración compleja** de IAM, políticas, etc.
- ✅ **UI simple** - todo en un dashboard
- ✅ **Integración automática** con Next.js
- ✅ **PostgreSQL y Redis incluidos** gratis

## 📝 Pasos Súper Rápidos (5 minutos):

### 1. Crear cuenta Vercel (si no tienes):

```bash
# Opción A: Con GitHub (recomendado)
https://vercel.com/signup

# Opción B: Con email
https://vercel.com/signup?next=/dashboard
```

### 2. Instalar Vercel CLI:

```bash
npm i -g vercel
vercel login
```

### 3. Crear PostgreSQL en Vercel:

1. Ve a: https://vercel.com/dashboard/stores
2. Click **"Create Database"**
3. Selecciona **"Postgres"**
4. Nombre: `altamedica-db`
5. Click **"Create"**
6. Ve a la pestaña **".env.local"**
7. **Copia TODO** y pégalo en tu `.env`

### 4. Crear KV (Redis) en Vercel:

1. En la misma página: https://vercel.com/dashboard/stores
2. Click **"Create Database"**
3. Selecciona **"KV"**
4. Nombre: `altamedica-kv`
5. Click **"Create"**
6. Ve a la pestaña **".env.local"**
7. **Copia TODO** y agrégalo a tu `.env`

### 5. Tu .env debería verse así:

```env
# Ya configurado antes
GEMINI_API_KEY=...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
ENCRYPTION_KEY=...
NEXT_PUBLIC_RECAPTCHA_SITE_KEY_WEB=...

# NUEVO - Vercel Postgres
POSTGRES_URL="postgres://default:..."
POSTGRES_PRISMA_URL="postgres://default:...?pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgres://default:..."
POSTGRES_USER="default"
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="verceldb"

# NUEVO - Vercel KV
KV_URL="redis://default:..."
KV_REST_API_URL="https://..."
KV_REST_API_TOKEN="..."
KV_REST_API_READ_ONLY_TOKEN="..."
```

### 6. Instalar dependencias de Vercel:

```bash
cd apps/api-server
pnpm add @vercel/postgres @vercel/kv
```

### 7. Actualizar Prisma para usar Vercel:

```bash
# En tu schema.prisma, actualiza el datasource:
# datasource db {
#   provider = "postgresql"
#   url = env("POSTGRES_PRISMA_URL")
# }

# Luego ejecuta:
npx prisma generate
npx prisma db push
```

## 🎉 ¡LISTO! Ya puedes ejecutar:

```bash
cd apps/api-server
pnpm dev
```

## 🔥 Ventajas sobre AWS:

| Feature             | AWS                        | Vercel                 |
| ------------------- | -------------------------- | ---------------------- |
| Setup time          | 30+ minutos                | 5 minutos              |
| Configuración IAM   | Sí (complejo)              | No                     |
| Costo inicial       | $0 pero cobran después     | Gratis siempre (hobby) |
| UI/UX               | Horrible                   | Excelente              |
| Integración Next.js | Manual                     | Automática             |
| PostgreSQL          | RDS ($$$)                  | Gratis                 |
| Redis               | ElastiCache ($$$)          | KV Gratis              |
| Secrets             | Secrets Manager (complejo) | KV simple              |
| Documentación       | 1000+ páginas              | Simple y clara         |

## 🆘 Troubleshooting:

**Error: "Cannot find module '@vercel/kv'"**

```bash
cd apps/api-server
pnpm add @vercel/kv @vercel/postgres
```

**Error: "Invalid environment variables"**

- Asegúrate de copiar TODAS las variables de Vercel
- No modifiques los valores, cópialos tal cual

**Error: "Connection refused to database"**

- Verifica que copiaste `POSTGRES_PRISMA_URL` (no `POSTGRES_URL`)
- Espera 1-2 minutos después de crear la DB

## 💡 Tips Pro:

1. **Usar Vercel CLI para todo:**

```bash
vercel env pull .env.local  # Descarga todas las variables
vercel dev                  # Desarrollo local con Vercel
```

2. **Ver logs en tiempo real:**

```bash
vercel logs --follow
```

3. **Deploy automático:**

```bash
vercel --prod
```

¡Con Vercel todo es más fácil y GRATIS! 🚀
