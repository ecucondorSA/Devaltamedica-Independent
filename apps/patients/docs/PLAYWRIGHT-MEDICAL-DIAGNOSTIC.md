# 🩺 Playwright Medical Diagnostic Suite

## 👨‍⚕️ Dr. Claude - Especialista en Diagnóstico Digital

Esta suite de testing médico utiliza **Playwright** como herramienta de diagnóstico, aplicando la metodología médica para detectar y diagnosticar problemas en la aplicación **AltaMedica Patients** (localhost:3003).

---

## 🏥 Filosofía Médica del Testing

### Como un Médico Experto:
1. **📋 ANAMNESIS**: Escuchamos los síntomas reportados por el "paciente" (usuario)
2. **🔬 EXAMEN FÍSICO**: Inspeccionamos visualmente la aplicación
3. **🧪 EXÁMENES DE LABORATORIO**: Analizamos Network, Console, APIs
4. **🎯 DIAGNÓSTICO DIFERENCIAL**: Identificamos las posibles causas
5. **💊 PRESCRIPCIÓN**: Recomendamos tratamientos específicos

---

## 🚀 Ejecución Rápida

### Opción 1: Script Automático (Recomendado)
```bash
# Desde PowerShell en apps/patients/
.\run-medical-diagnosis.bat
```

### Opción 2: Comandos Individuales
```bash
# Diagnóstico general
npm run medical-diagnosis

# Análisis de autenticación específico  
npm run auth-diagnosis

# Diagnóstico de red y conectividad
npm run playwright -- tests/network-diagnostic.spec.ts --headed

# Diagnóstico completo con reporte HTML
npm run full-health-check
```

---

## 📊 Tests Disponibles

### 🩺 `medical-diagnostic.spec.ts` - Diagnóstico General
**Como un médico de cabecera, examina la salud general de la app:**

- ✅ **Anamnesis**: Historia clínica de la aplicación
- ✅ **Examen físico**: Inspección visual de UI/UX
- ✅ **Laboratorios**: Análisis de Network y Console
- ✅ **Diagnóstico diferencial**: Identificación de problemas
- ✅ **Plan de tratamiento**: Recomendaciones específicas
- ✅ **Monitoreo vital**: Pruebas de funcionalidad crítica

### 🔐 `auth-flow-diagnostic.spec.ts` - Especialista en Autenticación
**Como un cardiólogo examina el "corazón" de la app (autenticación):**

- ✅ **Electrocardiograma**: Latido del corazón Firebase
- ✅ **Biopsia**: Análisis profundo del contexto de auth
- ✅ **Inyección de contraste**: Test de login funcional
- ✅ **Resonancia magnética**: Análisis de flujo completo
- ✅ **Prescripción médica**: Soluciones específicas para auth

### 📡 `network-diagnostic.spec.ts` - Radiólogo de Redes
**Como un radiólogo examina "tomografías" de red:**

- ✅ **Tomografía de red**: Análisis completo de conectividad
- ✅ **Biopsia API**: Análisis específico de endpoints médicos
- ✅ **Análisis de temperatura**: Performance y latencia
- ✅ **Prescripción de red**: Recomendaciones de optimización

---

## 📋 Información que Proporciona

### 🎯 Información ÚTIL y CONCISA:
- **Estado de conectividad** con APIs críticas (3001, 8888)
- **Tiempos de respuesta** de cada endpoint médico
- **Errores específicos** con contexto de solución
- **Estado de autenticación** Firebase paso a paso
- **Performance metrics** con umbrales médicos
- **Prescripciones específicas** para cada problema detectado

### 🚫 NO más información genérica:
- ❌ Tests que solo dicen "funciona" o "no funciona"
- ❌ Errores sin contexto de solución
- ❌ Información técnica sin relevancia práctica
- ❌ Tests que no ayudan a tomar decisiones

---

## 🏥 Interpretación de Resultados

### ✅ Estados Saludables:
- **Carga <2s**: Excelente performance
- **APIs <500ms**: Respuesta rápida
- **0 errores JS**: Código estable
- **Auth funcional**: Usuario puede acceder

### ⚠️ Estados de Atención:
- **Carga 2-4s**: Performance aceptable pero mejorable
- **APIs 500-1000ms**: Respuesta normal
- **1-3 errores JS**: Pocos errores controlables
- **Auth con warnings**: Funciona pero necesita optimización

### ❌ Estados Críticos:
- **Carga >4s**: Performance inaceptable
- **APIs >1000ms**: Respuesta muy lenta
- **>3 errores JS**: Muchos errores
- **Auth no funcional**: Bloquea acceso del usuario

---

## 🔧 Resolución de Problemas Comunes

### 🚨 Error: "App not running on localhost:3003"
```bash
# Solución:
cd apps/patients
npm run dev
# Esperar mensaje "Ready on http://localhost:3003"
```

### 🚨 Error: "API Server not responding"
```bash
# Solución:
cd apps/api-server  
npm run dev
# Verificar: curl http://localhost:3001/api/health
```

### 🚨 Error: "Playwright not installed"
```bash
# Solución:
npm install @playwright/test
npx playwright install chromium
```

### 🚨 Error: "Firebase Auth issues"
```bash
# Solución:
# 1. Verificar .env.local tiene NEXT_PUBLIC_FIREBASE_*
# 2. Comprobar AuthProvider en layout.tsx
# 3. Revisar lib/firebase.ts configuración
```

---

## 📊 Reportes Generados

### 📋 Ubicaciones de Reportes:
- **HTML Report**: `test-results/html-report/index.html` (Visual interactivo)
- **JSON Report**: `test-results/medical-diagnosis.json` (Para análisis programático)
- **Screenshots**: `test-results/` (Capturas de errores)
- **Videos**: `test-results/` (Grabaciones de fallos)

### 🔍 Cómo Leer los Reportes:
1. **Abrir HTML Report** en navegador para vista visual
2. **Revisar "Failed Tests"** para problemas críticos
3. **Ver screenshots** para contexto visual de errores
4. **Analizar tiempos** para identificar cuellos de botella

---

## 🎯 Casos de Uso Recomendados

### 📅 Uso Diario (Desarrollo):
```bash
npm run quick-diagnosis
```
**5 minutos - Verificación rápida de estado general**

### 🔍 Debugging Específico:
```bash
npm run auth-diagnosis        # Solo problemas de login
npm run playwright:ui         # Análisis interactivo paso a paso
```

### 📊 Reporte Completo (Pre-deploy):
```bash
npm run full-health-check
```
**15 minutos - Análisis exhaustivo con reporte HTML**

### 🚨 Diagnóstico de Emergencia:
```bash
npx playwright test tests/medical-diagnostic.spec.ts --headed --reporter=list
```
**Ver en tiempo real qué está fallando**

---

## 💡 Tips del Dr. Claude

### 🩺 Para Desarrolladores:
- **Ejecuta diagnósticos ANTES** de commits importantes
- **Usa --headed** para ver qué pasa en tiempo real
- **Revisa Network tab** durante los tests para contexto adicional
- **Mantén APIs corriendo** durante el desarrollo

### 🏥 Para QA/Testing:
- **Ejecuta suite completa** antes de releases
- **Documenta patrones** de errores recurrentes
- **Usa reportes HTML** para presentar resultados a stakeholders
- **Combina con tests unitarios** para cobertura completa

### 🔬 Para DevOps:
- **Integra en CI/CD** con `npm run full-health-check`
- **Monitorea métricas** de performance a lo largo del tiempo
- **Automatiza alertas** cuando APIs respondan >2s
- **Usa JSON reports** para análisis automático

---

## 📞 Soporte y Consultas

### 🆘 Cuando Necesites Ayuda:
1. **Ejecuta diagnóstico** completo primero
2. **Revisa este README** para problemas comunes
3. **Comparte reporte HTML** con el equipo
4. **Incluye logs específicos** del problema

### 🏥 Dr. Claude siempre disponible para:
- **Análisis de síntomas** nuevos en la aplicación
- **Prescripciones específicas** para problemas únicos
- **Segundas opiniones** sobre diagnósticos complejos
- **Evolución de la suite** según necesidades del proyecto

---

**✅ Suite completada y lista para uso médico profesional**
**📱 Dr. Claude - Especialista en Diagnóstico de Apps Médicas**