# 🗺️ Mapa de Navegación - AltaMedica Platform

**Una historia para encontrar lo que buscas en segundos**

---

## 📖 La Historia de AltaMedica: ¿Dónde Encontrar Cada Cosa?

Imagina que AltaMedica es una **ciudad médica digital**. Como cualquier ciudad, tiene barrios especializados, oficinas administrativas, y guías que te ayudan a moverte. Esta es tu **guía de navegación definitiva**.

---

## 🏛️ **EL CENTRO DE LA CIUDAD** - Documentación Principal

### 🎯 **¿Quieres entender todo el proyecto de un vistazo?**

```
📍 README.md (848 líneas - refactorizado)
```

**Tu punto de partida**. Como la plaza central - aquí encuentras:

- 🌟 **Visión general** del ecosistema médico
- 🚀 **Cómo empezar** en 5 minutos
- 📊 **Estado actual** del proyecto (PRODUCTION-READY)
- 🎯 **Arquitectura** en un diagrama simple

### 🤖 **¿Eres Claude/IA y necesitas instrucciones técnicas?**

```
📍 CLAUDE.md (592 líneas - refactorizado)
```

**Tu manual de operaciones**. Como el manual del alcalde:

- ⚠️ **Comandos prohibidos** (nunca ejecutar pnpm build/lint)
- 🔄 **Flujo de trabajo obligatorio** (pre-check → desarrollo → post-lint)
- 🌳 **Modelo de worktrees** por calidad
- 📦 **Estándares de paquetes** críticos

### 📅 **¿Qué pasó recientemente en el proyecto?**

```
📍 CHANGELOG.md (historia completa)
```

**Tu máquina del tiempo**. Todas las versiones desde agosto 2025:

- 🔄 **Fase 4**: Unificación masiva (telemedicina, anamnesis)
- 🧪 **Testing IA**: Motor de escenarios médicos
- 🏥 **HIPAA**: Compliance y auditoría hash chain

---

## 🏥 **LOS BARRIOS MÉDICOS** - Apps de Usuario

### 👤 **PACIENTES** - El Barrio Residencial

```
📍 apps/patients/CLAUDE.md (103 líneas - limpio)
```

**¿Qué encuentras aquí?**

- 🎯 **Portal del paciente**: Dashboard, citas, historial médico
- 📱 **Rutas principales**: `/dashboard`, `/appointments`, `/telemedicine/session/[id]`
- ✅ **Estado**: NIVEL EMPRESARIAL (9.5/10)
- 🔗 **Puerto**: 3003

**Historia**: "_Como paciente, aquí gestionas tu salud digital_"

### 👨‍⚕️ **DOCTORES** - El Hospital Digital

```
📍 apps/doctors/CLAUDE.md (108 líneas - especializado)
```

**¿Qué encuentras aquí?**

- 🔮 **Crystal Ball**: Sistema de predicción de evolución con IA
- 👥 **Gestión de pacientes**: Dashboard profesional
- 📹 **Telemedicina avanzada**: WebRTC con selectores E2E
- 🎯 **E2E Testing**: Selectores para suites automáticas

**Historia**: "_Como doctor, aquí practicas medicina del futuro_"

### 🏢 **EMPRESAS** - El Distrito de Negocios

```
📍 apps/companies/CLAUDE.md (125 líneas - conciso)
```

**¿Qué encuentras aquí?**

- 🏥 **Control hospitalario**: Monitoreo de saturación en tiempo real
- 💼 **Marketplace B2B**: Contratación inteligente de personal médico
- 📊 **Analytics**: Dashboards operacionales avanzados
- 🎯 **ROI esperado**: $350,000 USD/año por empresa

**Historia**: "_Como empresa médica, aquí optimizas operaciones_"

### 👥 **ADMIN** - La Oficina del Alcalde

```
📍 apps/admin/CLAUDE.md
```

**¿Qué encuentras aquí?**

- 🛡️ **Monitoreo de sistema**: Logs, métricas, alertas
- 👥 **Gestión de usuarios**: RBAC y permisos
- 📋 **Auditoría HIPAA**: Compliance y reportes

**Historia**: "_Como administrador, aquí supervisas todo el ecosistema_"

---

## 🔧 **LA ZONA INDUSTRIAL** - Backend y API

### 🏭 **API SERVER** - La Central Eléctrica

```
📍 apps/api-server/CLAUDE.md
```

**El cerebro de todo**. Aquí encuentras:

- 🔌 **150+ endpoints** médicos completamente funcionales
- 🛡️ **Sistema de auditoría** con hash chain blockchain-style
- 💳 **Billing empresarial**: Stripe + MercadoPago + AFIP compliance
- 🔄 **WebRTC QoS**: Monitoreo de calidad en videollamadas

**Historia**: "_Toda la lógica de negocio médico vive aquí_"

### 📡 **SIGNALING SERVER** - La Torre de Comunicaciones

```
📍 apps/signaling-server/
```

**¿Qué encuentras aquí?**

- 📹 **WebRTC signaling**: Coordinación de videollamadas médicas
- 🔄 **Socket.io real-time**: Comunicación instantánea
- 🛡️ **Seguridad HIPAA**: Cifrado end-to-end

---

## 📦 **EL DISTRITO COMERCIAL** - Packages Compartidos

### 🎨 **@altamedica/ui** - La Tienda de Diseño

```
📍 packages/ui/
```

**Tu sistema de diseño médico**:

- 🎨 **Componentes médicos**: AppointmentCard, HealthMetricCard, StatusBadge
- ♿ **Accesibilidad**: Cumplimiento WCAG completo
- 🎯 **Consistencia**: UI unificada en todas las apps

### 🔐 **@altamedica/auth** - El Banco de Seguridad

```
📍 packages/auth/
```

**Tu fortaleza de autenticación**:

- 🔑 **Firebase Auth**: Integración completa
- 🛡️ **SSO empresarial**: Single Sign-On
- 📱 **MFA**: Autenticación multi-factor

### 📊 **@altamedica/types** - La Oficina de Normas

```
📍 packages/types/
```

**El contrato de toda la plataforma**:

- 🏥 **Tipos médicos**: Patient, Appointment, MedicalRecord
- ✅ **Validación Zod**: Schemas seguros
- 🔄 **Consistencia**: Mismo tipo en frontend y backend

---

## 🧪 **EL LABORATORIO** - Testing y Documentación Técnica

### 🔬 **Testing Completo**

```
📍 docs/TESTING-COMPLETE.md (documentación técnica)
```

**Tu laboratorio de calidad**:

- 🤖 **IA Testing Engine**: Generación automática de escenarios médicos
- 🎭 **E2E con Playwright**: Tests multi-área coordinados
- 🏥 **HIPAA Testing**: Validación de compliance automática
- 📊 **Métricas**: 85% cobertura general, 95% módulos médicos

---

## 🚀 **GUÍAS DE NAVEGACIÓN RÁPIDA**

### 🔍 **"Quiero encontrar..."**

| **Busco**                               | **Voy a**                                  | **Porque**                                   |
| --------------------------------------- | ------------------------------------------ | -------------------------------------------- |
| 📖 **Entender el proyecto**             | `README.md`                                | Visión general refactorizada                 |
| 🤖 **Instrucciones para IA**            | `CLAUDE.md`                                | Manual de operaciones                        |
| 📅 **Qué cambió recientemente**         | `CHANGELOG.md`                             | Historial completo                           |
| 👤 **App de pacientes**                 | `apps/patients/CLAUDE.md`                  | Portal médico personal                       |
| 👨‍⚕️ **App de doctores**                  | `apps/doctors/CLAUDE.md`                   | Herramientas profesionales                   |
| 🏢 **App empresarial**                  | `apps/companies/CLAUDE.md`                 | Gestión hospitalaria                         |
| 🔌 **APIs médicas**                     | `apps/api-server/CLAUDE.md`                | Backend centralizado                         |
| 🎨 **Componentes UI**                   | `packages/ui/`                             | Sistema de diseño                            |
| 🔐 **Autenticación**                    | `packages/auth/`                           | Seguridad médica                             |
| 📊 **Tipos de datos**                   | `packages/types/`                          | Contratos TypeScript                         |
| 🧪 **Testing avanzado**                 | `docs/TESTING-COMPLETE.md`                 | Stack de testing IA                          |
| 🧭 **Worktree Quality Guide**           | `docs/GUIA-DEFINITIVA-WORKTREE-QUALITY.md` | Playbook AUDIT/INTEGRATE/VALIDATE replicable |
| 🧷 **Validación Técnica (score)**       | `docs/VALIDACION_TECNICA_ALTAMEDICA.md`    | Score real, evidencia y recomendaciones      |
| 🎯 **Objetivos Score ~100 (trazables)** | `docs/OBJETIVOS_TRACABLES_SCORE_100.md`    | Plan medible para llegar a ≥95/100           |

### 🎯 **"Quiero hacer..."**

| **Tarea**                  | **Empiezo en**             | **Siguiente paso**            |
| -------------------------- | -------------------------- | ----------------------------- |
| 🏗️ **Desarrollar feature** | `CLAUDE.md` → Pre-check    | Usar worktree correcto        |
| 🐛 **Arreglar bug**        | `apps/[app]/CLAUDE.md`     | Verificar sistemas unificados |
| 🧪 **Hacer tests**         | `docs/TESTING-COMPLETE.md` | Configurar IA Engine          |
| 📱 **Crear componente**    | `packages/ui/`             | Verificar duplicados          |
| 🔄 **Integrar sistema**    | Worktree `integrate/`      | NO crear, conectar existente  |
| 📊 **Ver métricas**        | `CHANGELOG.md`             | Estado actual                 |

### 🚨 **"Tengo un problema..."**

| **Problema**                  | **Solución**               | **Ubicación**                 |
| ----------------------------- | -------------------------- | ----------------------------- |
| 🔄 **Duplicación de código**  | Usar worktree `audit/`     | `../devaltamedica-audit/`     |
| 🔗 **Features desconectadas** | Usar worktree `integrate/` | `../devaltamedica-integrate/` |
| ❌ **Tests fallando**         | Revisar TESTING-COMPLETE   | `docs/TESTING-COMPLETE.md`    |
| 🐛 **Imports rotos**          | Verificar packages         | `packages/[nombre]/`          |
| 🔧 **Config incorrecta**      | Ver estándares             | `CLAUDE.md` → Packages        |

---

## 🎉 **Tu Hoja de Ruta Personal**

### 🚀 **Si eres nuevo:**

1. **Lee** `README.md` (10 min)
2. **Explora** `apps/patients/CLAUDE.md` (ejemplo real)
3. **Revisa** `CHANGELOG.md` (contexto histórico)
4. **Practica** con `docs/TESTING-COMPLETE.md`

### 🔧 **Si eres desarrollador:**

1. **Memoriza** `CLAUDE.md` (instrucciones críticas)
2. **Usa** worktrees por calidad
3. **Reutiliza** packages existentes
4. **Nunca** dupliques código

### 🤖 **Si eres IA/Claude:**

1. **SIEMPRE** ejecutar pre-check
2. **NUNCA** ejecutar comandos prohibidos
3. **BUSCAR** antes de crear
4. **LINT** después de cambios

---

**🎯 Recuerda**: AltaMedica es como una ciudad - cada barrio tiene su propósito, pero todo está conectado. ¡Usa este mapa para navegar como un local!

---

_Última actualización: 20 de agosto de 2025_
_Versión del mapa: 1.0 - Navegación tipo historia_
