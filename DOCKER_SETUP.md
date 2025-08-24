# 🐳 Docker Setup for Devaltamedica

## 📋 Configuración Completada

### ✅ Archivos Creados

1. **`docker-compose.yml`** - Configuración principal con todos los servicios:
   - PostgreSQL 15
   - Redis 7
   - Aplicación principal
   - PgAdmin
   - Prometheus & Grafana
   - Nginx

2. **`docker-compose.dev.yml`** - Overrides para desarrollo:
   - Hot reload habilitado
   - Mailhog para testing de emails
   - Volumes para código fuente

3. **`Dockerfile.dev`** - Imagen optimizada para desarrollo
4. **`Makefile`** - Comandos simplificados para gestión
5. **`scripts/docker-init.sh`** - Script de inicialización automática

## 🚀 Inicio Rápido

### Opción 1: Inicialización Automática

```bash
cd ~/Devaltamedica-Independent
./scripts/docker-init.sh
```

### Opción 2: Comandos Manuales

#### Desarrollo

```bash
make dev     # Inicia todo el entorno de desarrollo
```

#### Producción

```bash
make prod    # Inicia entorno de producción
```

## 📌 Comandos Disponibles (Makefile)

### Comandos Principales

- `make dev` - Iniciar entorno de desarrollo
- `make prod` - Iniciar entorno de producción
- `make up` - Levantar contenedores
- `make down` - Detener contenedores
- `make restart` - Reiniciar contenedores
- `make status` - Ver estado de contenedores
- `make logs` - Ver logs en tiempo real
- `make shell` - Entrar al contenedor de la app
- `make shell-db` - Entrar a PostgreSQL

### Gestión de Base de Datos

- `make backup` - Crear backup de BD
- `make restore` - Restaurar último backup
- `make reset` - Resetear BD (⚠️ borra datos)
- `make migrate` - Ejecutar migraciones

### Desarrollo

- `make test` - Ejecutar tests
- `make lint` - Ejecutar linters
- `make install` - Instalar dependencias
- `make build` - Rebuild de contenedores

### Monitoreo

- `make monitor` - Abrir dashboards de monitoreo
- `make health` - Verificar salud de servicios

### Atajos

- `make d` - Alias para `make dev`
- `make u` - Alias para `make up`
- `make s` - Alias para `make status`
- `make l` - Alias para `make logs`

## 🌐 URLs de Acceso

Una vez iniciado el entorno:

| Servicio        | URL                   | Credenciales                    |
| --------------- | --------------------- | ------------------------------- |
| **Web App**     | http://localhost:3000 | -                               |
| **API**         | http://localhost:3001 | -                               |
| **Admin Panel** | http://localhost:3002 | -                               |
| **PgAdmin**     | http://localhost:5050 | admin@altamedica.com / admin123 |
| **Grafana**     | http://localhost:3003 | admin / admin123                |
| **Prometheus**  | http://localhost:9090 | -                               |
| **Mailhog**     | http://localhost:8025 | -                               |
| **PostgreSQL**  | localhost:5432        | altamedica / altamedica123      |
| **Redis**       | localhost:6379        | -                               |

## 🔧 Configuración de Variables de Entorno

El archivo `.env.docker` contiene las variables necesarias. Para producción:

1. Copia `.env.docker` a `.env`
2. Actualiza las credenciales:
   - Firebase keys
   - Stripe/MercadoPago tokens
   - JWT secrets
   - Database passwords

## 📊 Arquitectura de Contenedores

```
altamedica-network (172.28.0.0/16)
├── postgres (5432)
├── redis (6379)
├── app (3000, 3001, 3002, 8888)
├── nginx (80, 443)
├── pgadmin (5050)
├── prometheus (9090)
├── grafana (3003)
└── mailhog (1025, 8025) [solo dev]
```

## 🔍 Debugging

### Ver logs de un servicio específico

```bash
docker-compose logs -f [servicio]
# Ejemplo: docker-compose logs -f app
```

### Ejecutar comandos en contenedor

```bash
docker-compose exec app pnpm run [comando]
```

### Inspeccionar volúmenes

```bash
docker volume ls
docker volume inspect devaltamedica-independent_postgres_data
```

## ⚠️ Solución de Problemas

### Puerto en uso

```bash
# Ver qué proceso usa el puerto
lsof -i :3000
# Matar proceso por puerto
killport 3000  # (usando alias del terminal personalizado)
```

### Limpiar todo y empezar de nuevo

```bash
make clean  # ⚠️ Borra TODO
make dev    # Volver a iniciar
```

### Problemas de permisos

```bash
# Dar permisos al usuario actual
sudo chown -R $USER:$USER .
```

## 📝 Notas Importantes

1. **Desarrollo**: Los cambios en el código se reflejan automáticamente (hot reload)
2. **Base de datos**: Los datos persisten en volúmenes Docker
3. **Backups**: Se guardan en `./backups/`
4. **Logs**: Disponibles con `make logs` o en `./logs/`
5. **Performance**: Configurado con caché de pnpm para builds rápidos

## 🎯 Próximos Pasos

1. Verificar Docker instalado: `docker --version`
2. Iniciar entorno: `make dev`
3. Verificar servicios: `make status`
4. Acceder a la app: http://localhost:3000

---

_Configuración completada el 24 de Agosto, 2025_
