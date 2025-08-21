# 🏥 PROMPT DE AUDITORÍA ARQUITECTÓNICA - ALTA MEDICA

## 🎯 OBJETIVO
Auditar, corregir y agregar nuevos códigos en el monorepo de AltaMedica sin duplicar archivos, siguiendo principios de arquitectura limpia.

## 📋 CONTEXTO DEL PROYECTO
- Monorepo: 8 aplicaciones + 25 paquetes compartidos
- Arquitectura: Next.js + Node.js + Firebase + WebRTC
- Estado Actual: 40% de paquetes con problemas de configuración
- Gaps Identificados: 10 gaps críticos (P0-P2) en compliance, seguridad y funcionalidad

## 🔍 TAREAS DE AUDITORÍA

### 1. ANÁLISIS DE DUPLICACIÓN
- [ ] Revisar `package.json` de cada paquete en `/packages/`
- [ ] Identificar dependencias duplicadas entre paquetes
- [ ] Mapear imports/exports para detectar código duplicado
- [ ] Generar reporte de duplicaciones con hash de archivos

### 2. AUDITORÍA DE CONFIGURACIÓN
- [ ] Verificar `main`, `module`, `types` en package.json
- [ ] Validar `peerDependencies` para React/React-DOM
- [ ] Revisar estructura de directorios `dist/` vs `src/`
- [ ] Eliminar artefactos obsoletos (`tsconfig.tsbuildinfo`)

### 3. IMPLEMENTACIÓN DE GAPS CRÍTICOS
- [ ] GAP-001: Pista de Auditoría Inmutable para PHI
- [ ] GAP-002: Autenticación MFA obligatoria
- [ ] GAP-003: Gestión de BAA para empresas
- [ ] GAP-004: Sistema de Prescripción Electrónica

## 🛠️ REGLAS DE IMPLEMENTACIÓN

### ✅ PERMITIDO
- Refactorizar código existente para eliminar duplicación
- Crear nuevos paquetes compartidos cuando sea necesario
- Actualizar configuraciones de paquetes existentes
- Implementar funcionalidades de gaps identificados

### ❌ NO PERMITIDO
- Duplicar archivos o funcionalidades existentes
- Crear paquetes con responsabilidades solapadas
- Modificar aplicaciones sin actualizar documentación
- Implementar features fuera del backlog priorizado

## ✅ CRITERIOS DE ACEPTACIÓN

### Para Cada Gap Implementado
- [ ] Código funcional y testeado
- [ ] Documentación actualizada en `CLAUDE.md` y `README.md`
- [ ] Sin duplicación de funcionalidades existentes
- [ ] Cumple estándares de calidad del proyecto
- [ ] Integrado con sistema de logging y monitoreo

### Para Refactorización
- [ ] Reducción de duplicación de código ≥ 20%
- [ ] Mejora en tiempo de build ≥ 15%
- [ ] Mantenimiento de funcionalidad 100%
- [ ] Tests pasando al 100%

## 🔄 FLUJO DE EJECUCIÓN

1. Análisis (15 min): Revisar estado actual y gaps
2. Planificación (10 min): Definir orden de implementación
3. Implementación (45 min): Codificar y refactorizar
4. Validación (15 min): Tests y verificación de calidad
5. Documentación (5 min): Actualizar `CLAUDE.md` y `README.md`

## 📦 FORMATO DE ENTREGA

### Reporte de Auditoría
```json
{
  "duplicaciones_eliminadas": [],
  "gaps_implementados": [],
  "metricas_mejora": {
    "reduccion_duplicacion": "X%",
    "tiempo_build": "X%",
    "cobertura_tests": "X%"
  },
  "archivos_modificados": [],
  "nuevos_paquetes": []
}
```

### Archivos a Actualizar
- [ ] `CLAUDE.md` - Documentación técnica
- [ ] `README.md` - Documentación del proyecto
- [ ] `auditoria-gaps-mvp.json` - Estado de gaps
- [ ] `packages/PACKAGES_AUDIT_REPORT.md` - Reporte de paquetes

## 🧭 PRIORIDADES DE IMPLEMENTACIÓN

### 🔴 CRÍTICO (P0) - Implementar PRIMERO
1. GAP-REAL-001: Pista de Autenticación/Autorización estable (reparar errores 500)
2. GAP-REAL-002: Build system operativo
3. GAP-REAL-003/004/005: Configuración de paquetes/TypeScript/dependencias estable

### 🟡 ALTO (P1) - Implementar SEGUNDO
4. GAP-001: Pista de Auditoría Inmutable
5. GAP-002: Autenticación MFA
6. GAP-003: Gestión de BAA

### 🟢 MEDIO (P2) - Implementar TERCERO
7. GAP-004: Prescripción Electrónica
8. GAP-005: Plan de Respaldo y DRP
9. GAP-006: Módulo de Facturación
10. GAP-007/008/009/010: Resto de mejoras (portabilidad, monitoreo IA, QoS, i18n)

## 🚨 NOTAS IMPORTANTES

- HIPAA Compliance: Todos los cambios deben mantener compliance
- Testing: Implementar tests para cada nueva funcionalidad
- Documentación: Actualizar `CLAUDE.md` y `README.md` en cada cambio
- Performance: No degradar rendimiento existente
- Seguridad: Validar todos los cambios de seguridad

---

¿Listo para comenzar la auditoría arquitectónica? Empezar por el análisis de duplicación y luego implementar los gaps críticos P0.


