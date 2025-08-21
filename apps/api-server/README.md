# API Server - Altamedica

Servidor Express.js con TypeScript para la API de Altamedica.

## Configuración de Entorno

### Desarrollo

```bash
# Copiar y configurar variables de desarrollo
cp .env.development.local.example .env.development.local

# Editar variables según necesidad
# Las variables con valores MOCK están marcadas claramente
```

### Staging

```bash
# Copiar template de staging
cp .env.staging .env.staging.local

# Editar variables críticas:
# - JWT_SECRET (64+ caracteres)
# - JWT_REFRESH_SECRET (64+ caracteres)
# - ENCRYPTION_SECRET (32+ caracteres)
# - FIREBASE_PRIVATE_KEY (clave real del service account)

# Validar configuración
pnpm run validate:env:staging
```

### Producción

```bash
# Copiar template de producción
cp .env.production .env.production.local

# Configurar TODAS las variables críticas
# - JWT_SECRET (64+ caracteres)
# - JWT_REFRESH_SECRET (64+ caracteres)
# - ENCRYPTION_SECRET (32+ caracteres)
# - FIREBASE_PRIVATE_KEY (clave real del service account)
# - DATABASE_URL (conexión real a PostgreSQL)
# - REDIS_URL (conexión real a Redis)

# Validar configuración
pnpm run validate:env:production
```

## Variables Críticas

### Seguridad

- `JWT_SECRET`: Secreto para firmar JWT (mínimo 64 caracteres)
- `JWT_REFRESH_SECRET`: Secreto para refresh tokens (mínimo 64 caracteres)
- `ENCRYPTION_SECRET`: Clave de encriptación PHI (mínimo 32 caracteres)
- `FIREBASE_PRIVATE_KEY`: Clave privada del service account de Firebase

### Firebase

- `FIREBASE_PROJECT_ID`: ID del proyecto Firebase
- `FIREBASE_CLIENT_EMAIL`: Email del service account
- `GOOGLE_APPLICATION_CREDENTIALS`: Ruta al archivo JSON del service account

### Base de Datos

- `DATABASE_URL`: Conexión a PostgreSQL (solo producción)
- `REDIS_URL`: Conexión a Redis

## Validación Automática

El sistema incluye validación automática de variables de entorno:

```bash
# Validar staging
pnpm run validate:env:staging

# Validar producción
pnpm run validate:env:production

# Hooks automáticos (se ejecutan antes de deploy)
pnpm run predeploy:staging
pnpm run predeploy:production
```

## Características de Seguridad

- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **Audit Logging**: Registro completo de todas las operaciones
- **RBAC**: Control de acceso basado en roles
- **PHI Encryption**: Encriptación de datos médicos sensibles
- **Audit Hash Chain**: Cadena de hashes para integridad de logs

## Comandos

```bash
# Desarrollo
pnpm run dev

# Build
pnpm run build

# Iniciar producción
pnpm run start

# Validar entorno
pnpm run validate:env:staging
pnpm run validate:env:production
```

## Estructura del Proyecto

```
src/
├── config/          # Configuración y validación de entorno
├── middleware/      # Middleware de seguridad y validación
├── routes/          # Rutas de la API
├── services/        # Lógica de negocio
└── server.ts        # Punto de entrada
```

## Notas Importantes

⚠️ **NUNCA** usar valores MOCK en staging o producción
⚠️ **SIEMPRE** validar entorno antes del deploy
⚠️ **ROTAR** claves de encriptación regularmente
⚠️ **MONITOREAR** logs de auditoría en producción
