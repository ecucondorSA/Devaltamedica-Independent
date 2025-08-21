# 🏥 AltaMedica - Reglas de Cursor

Este directorio contiene las reglas de Cursor para la plataforma AltaMedica, diseñadas para ayudar a los desarrolladores y asistentes de IA a navegar y entender el código de manera eficiente.

## 📋 Reglas Disponibles

### 🏗️ **altamedica-project-structure.mdc** - Estructura del Proyecto

- **Aplicación**: Siempre activa
- **Propósito**: Guía general de la arquitectura del monorepo
- **Contenido**: Estructura de directorios, tecnologías, documentación clave

### 🔧 **altamedica-development-standards.mdc** - Estándares de Desarrollo

- **Aplicación**: Archivos TypeScript/JavaScript
- **Propósito**: Mejores prácticas y convenciones de código
- **Contenido**: Principios de desarrollo, compliance HIPAA, testing

### 🚀 **altamedica-api-server.mdc** - Servidor API

- **Aplicación**: Archivos del servidor API
- **Propósito**: Guía específica para el backend
- **Contenido**: Arquitectura, endpoints, seguridad, monitoreo

### 📱 **altamedica-frontend-apps.mdc** - Aplicaciones Frontend

- **Aplicación**: Archivos de aplicaciones frontend
- **Propósito**: Guía para desarrollo de UI/UX
- **Contenido**: Componentes, autenticación, PWA, performance

### 📦 **altamedica-packages.mdc** - Packages Compartidos

- **Aplicación**: Archivos de packages compartidos
- **Propósito**: Guía para desarrollo de librerías
- **Contenido**: Arquitectura, dependencias, testing, documentación

### 🧪 **altamedica-testing.mdc** - Sistema de Testing

- **Aplicación**: Archivos de tests
- **Propósito**: Estrategia completa de testing
- **Contenido**: Tipos de tests, configuración, patrones, CI/CD

### 🚀 **altamedica-deployment.mdc** - Despliegue y Producción

- **Aplicación**: Archivos de configuración de despliegue
- **Propósito**: Guía para producción y DevOps
- **Contenido**: Docker, Nginx, variables de entorno, monitoreo

### 🤖 **altamedica-ai-agents.mdc** - Sistema de Agentes IA

- **Aplicación**: Archivos relacionados con IA
- **Propósito**: Guía para el sistema de inteligencia artificial
- **Contenido**: Agentes, integración, compliance, roadmap

## 🎯 Cómo Usar las Reglas

### 🔍 Aplicación Automática

- **Siempre activas**: `altamedica-project-structure.mdc`
- **Por tipo de archivo**: Las demás reglas se aplican según el contexto

### 📚 Consulta Manual

- **Descripción**: Usar `description` para buscar reglas específicas
- **Globs**: Usar `globs` para aplicar a archivos específicos

### 🔄 Actualización

- **Frecuencia**: Actualizar con cada cambio significativo en la plataforma
- **Responsabilidad**: Mantener sincronizadas con la documentación del proyecto

## 🚨 Reglas Críticas

### ❌ **NUNCA EJECUTAR**

- Comandos de build, lint, test
- Instalación de dependencias
- Comandos de compilación

### ✅ **SÍ PERMITIDO**

- Lectura y análisis de archivos
- Edición y creación de código
- Generación de documentación
- Análisis y reportes

## 📖 Documentación Relacionada

- **`README.md`** - Documentación principal del proyecto
- **`CLAUDE.md`** - Manual de operaciones para IA
- **`docs/`** - Documentación técnica detallada
- **`CHANGELOG.md`** - Historial de cambios

## 🔧 Mantenimiento

### 📝 Actualización de Reglas

1. **Revisar** cambios en la arquitectura
2. **Actualizar** reglas afectadas
3. **Verificar** consistencia entre reglas
4. **Documentar** cambios en CHANGELOG

### 🧪 Validación

- **Verificar** que las reglas se aplican correctamente
- **Testear** con diferentes tipos de archivos
- **Recopilar** feedback de desarrolladores

---

**Última actualización**: 20 de agosto de 2025  
**Versión**: 4.6  
**Mantenido por**: Equipo AltaMedica
