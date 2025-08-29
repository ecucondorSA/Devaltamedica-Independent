# 🚀 Configuración RÁPIDA con Supabase (PostgreSQL GRATIS)

## ✅ Por qué Supabase es la mejor opción:

- **100% GRATIS** - 500MB storage, sin límite de tiempo
- **PostgreSQL real** - No es serverless, es Postgres completo
- **Incluye Auth** - Autenticación lista para usar
- **Incluye Storage** - Para archivos e imágenes
- **UI increíble** - Panel de administración tipo phpMyAdmin
- **5 minutos setup** - Sin configuración compleja

## 📝 Paso 1: Crear cuenta Supabase (2 minutos)

1. Ve a: **https://supabase.com**
2. Click **"Start your project"** (con GitHub es más rápido)
3. Crea proyecto:
   - Nombre: `altamedica`
   - Password: **GUÁRDALO** (lo necesitas)
   - Region: Elige la más cercana

## 📝 Paso 2: Obtener credenciales (1 minuto)

En tu proyecto Supabase:

1. Ve a **Settings** → **Database**
2. Busca **"Connection string"** → **URI**
3. **COPIA** el string completo
4. **REEMPLAZA** `[YOUR-PASSWORD]` con tu password real

Ejemplo:

```
postgresql://postgres:TU-PASSWORD-AQUI@db.xxxxxxxxxxxx.supabase.co:5432/postgres
```

## 📝 Paso 3: Actualizar tu .env

Agrega esto a tu `.env`:

```env
# SUPABASE (PostgreSQL)
DATABASE_URL="postgresql://postgres:TU-PASSWORD@db.xxxxxxxxxxxx.supabase.co:5432/postgres"

# Opcional: Supabase Auth y Storage
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 📝 Paso 4: Redis con Upstash (Opcional - 2 minutos)

Si quieres Redis cache GRATIS:

1. Ve a: **https://upstash.com**
2. Click **"Create Database"**
3. Nombre: `altamedica-cache`
4. Type: **Regional** (no Global)
5. Region: La más cercana
6. **COPIA** el `REDIS_URL` y agrégalo a `.env`:

```env
REDIS_URL="redis://default:xxxxx@xxxxx.upstash.io:xxxxx"
```

## 📝 Paso 5: Configurar Prisma (1 minuto)

```bash
# En la raíz del proyecto
cd apps/api-server

# Instalar Prisma
pnpm add -D prisma @prisma/client

# Inicializar Prisma
npx prisma init

# Push schema a Supabase
npx prisma db push

# Generar cliente
npx prisma generate
```

## 🎉 ¡LISTO! Ya puedes ejecutar:

```bash
cd apps/api-server
pnpm dev
```

## 🔥 Comparación Final:

| Feature          | AWS          | Vercel        | Supabase               |
| ---------------- | ------------ | ------------- | ---------------------- |
| Setup            | 30+ min      | No disponible | **5 min** ✅           |
| PostgreSQL       | RDS $$$      | No hay        | **GRATIS** ✅          |
| Límites          | Pago después | -             | **500MB gratis** ✅    |
| Auth incluido    | No           | No            | **SÍ** ✅              |
| Storage incluido | S3 $$$       | Blob beta     | **1GB gratis** ✅      |
| UI Admin         | No           | No            | **Studio incluido** ✅ |
| Complejidad      | Alta         | -             | **Baja** ✅            |

## 💡 Bonus - Ver tu DB visualmente:

Una vez configurado, puedes ver y editar tu DB en:

```
https://app.supabase.com/project/[tu-proyecto]/editor
```

Es como phpMyAdmin pero moderno y bonito.

## 🆘 Troubleshooting:

**Error: "password authentication failed"**

- Verifica que reemplazaste `[YOUR-PASSWORD]` con tu password real
- El password es el que pusiste al crear el proyecto

**Error: "Connection timeout"**

- Espera 1-2 minutos después de crear el proyecto
- Verifica que la región sea la correcta

**Error: "SSL required"**

- Agrega `?sslmode=require` al final del DATABASE_URL

## 🎯 Resumen:

1. **Supabase** = PostgreSQL gratis + Auth + Storage
2. **Upstash** = Redis gratis (opcional)
3. **Total setup** = 5 minutos
4. **Costo** = $0 para siempre

¡No necesitas AWS, ni Vercel Postgres, ni nada complicado! 🚀
