# 🔑 Guía Rápida para Obtener Credenciales AltaMedica

## ✅ Credenciales Ya Configuradas

1. **Firebase Admin** ✓ - Ya tienes el JSON
2. **JWT Secrets** ✓ - Generados localmente
3. **Encryption Keys** ✓ - Generados localmente
4. **AWS (modo local)** ✓ - Configurado para desarrollo
5. **reCAPTCHA** ✓ - Ya configurado

## 🚀 Credenciales que NECESITAS Obtener Ahora

### 1️⃣ Base de Datos PostgreSQL (5 minutos)

**Opción A - Local (Recomendado para empezar):**

```bash
# Instalar PostgreSQL si no lo tienes
sudo apt-get install postgresql postgresql-contrib

# Crear base de datos
sudo -u postgres psql
CREATE DATABASE altamedica;
CREATE USER altamedica WITH PASSWORD 'altamedica123';
GRANT ALL PRIVILEGES ON DATABASE altamedica TO altamedica;
\q

# Agregar a tu .env:
DATABASE_URL="postgresql://altamedica:altamedica123@localhost:5432/altamedica"
```

**Opción B - Supabase (Gratis):**

1. Ve a https://supabase.com
2. Crea proyecto nuevo
3. Settings → Database → Connection string
4. Copia el DATABASE_URL

### 2️⃣ Redis Cache (2 minutos)

**Opción A - Local:**

```bash
# Instalar Redis
sudo apt-get install redis-server

# Verificar que está corriendo
redis-cli ping

# Agregar a tu .env:
REDIS_URL="redis://localhost:6379"
```

**Opción B - Upstash (Gratis):**

1. Ve a https://upstash.com
2. Create Database
3. Copia REDIS_URL de la consola

### 3️⃣ Firebase Client Config (3 minutos)

```bash
# Ve a Firebase Console
https://console.firebase.google.com/project/altamedic-20f69/overview

# Click en ⚙️ → Configuración del proyecto → General
# Busca "Tu app" → Selecciona la app web
# Copia este bloque y agrégalo a tu .env:

NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyAkzR3fZjtwsGu4wJ6jNnbjcSLGu3rWoGs"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="altamedic-20f69.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="altamedic-20f69"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="altamedic-20f69.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="131880235210"
NEXT_PUBLIC_FIREBASE_APP_ID="1:131880235210:web:35d867452b6488c245c433"
```

### 4️⃣ OpenAI API Key (1 minuto) - OPCIONAL

Si quieres usar las funciones de IA:

1. Ve a https://platform.openai.com/api-keys
2. Create new secret key
3. Agregar a .env: `OPENAI_API_KEY="sk-..."`

### 5️⃣ MercadoPago Test Keys (2 minutos) - OPCIONAL

Para pagos de prueba:

1. Ve a https://www.mercadopago.com.ar/developers/panel
2. Tus integraciones → Crear aplicación
3. Credenciales de prueba
4. Copiar:

```
MERCADOPAGO_ACCESS_TOKEN="TEST-..."
MERCADOPAGO_PUBLIC_KEY="TEST-..."
```

## 📋 Script Rápido de Configuración

Ejecuta este comando para configurar todo automáticamente:

```bash
# 1. Configurar todas las credenciales locales
node scripts/setup-local-secrets.js

# 2. Verificar qué falta
node scripts/check-credentials.js

# 3. Instalar servicios locales si no los tienes
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib redis-server

# 4. Crear base de datos
sudo -u postgres psql -c "CREATE DATABASE altamedica;"
sudo -u postgres psql -c "CREATE USER altamedica WITH PASSWORD 'altamedica123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE altamedica TO altamedica;"

# 5. Agregar a .env
echo 'DATABASE_URL="postgresql://altamedica:altamedica123@localhost:5432/altamedica"' >> .env
echo 'REDIS_URL="redis://localhost:6379"' >> .env
```

## 🎯 Resumen: Lo Mínimo para Empezar

Solo necesitas:

1. **PostgreSQL** local o Supabase
2. **Redis** local o Upstash
3. **Firebase Config** del proyecto existente

Con eso ya puedes ejecutar:

```bash
cd apps/api-server
pnpm dev
```

## 🆘 Si Tienes Problemas

1. **Sin AWS**: Ya está configurado para modo local con `USE_LOCAL_SECRETS=true`
2. **Sin PostgreSQL**: Puedes usar SQLite temporalmente cambiando el DATABASE_URL
3. **Sin Redis**: La app funciona sin cache, solo será más lenta

## 📞 Soporte Rápido

Si algo no funciona:

1. Ejecuta: `node scripts/check-credentials.js`
2. Revisa qué credenciales faltan
3. Sigue las instrucciones específicas para cada una

¡Con esto deberías tener todo listo en menos de 15 minutos! 🚀
