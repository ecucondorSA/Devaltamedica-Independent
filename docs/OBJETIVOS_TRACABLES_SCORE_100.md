# Objetivos Trazables para Alcanzar Score ~100

Esta lista define objetivos concretos, medibles y verificables para elevar el score a ≥95 (ideal 100) con impacto directo en Seguridad, Testing, Arquitectura, Integración y Performance.

## Seguridad (S, 30%)

1. Endurecer CSP en Nginx (producción): eliminar `'unsafe-inline'` y `'unsafe-eval'`; usar nonces/hashes.
   - Verificación: grep en `config/nginx/nginx.conf` no contiene esas directivas.
2. Eliminar `validateJWT` placeholder o implementar verificación real con expiración y revocación.
   - Verificación: tests unitarios de firma/exp/nbf/aud + 401 en expirado.
3. CORS productivo con dominios exactos (sin regex) y `allowedHeaders` sin duplicidad.
   - Verificación: revisión de `apps/api-server/src/server.ts` y smoke test CORS.
4. CSRF doble envío probado en rutas mutables críticas.
   - Verificación: tests integración devuelven 403 sin header y 200 con header válido.

## Testing (T, 25%)

5. coverageThreshold global ≥80% (líneas/branches/functions/statements) en Jest.
   - Verificación: configuración en `config/environments/jest.config.cjs`; CI falla si <80%.
6. E2E de seguridad: rate-limit (429) y CSRF (403) en endpoints sensibles.
   - Verificación: suites Playwright y reportes.
7. Pruebas unitarias para middleware de auth y CORS (paths/headers esperados).
   - Verificación: directorios `apps/api-server/src/__tests__/` con casos.

## Arquitectura (A, 20%)

8. Check de middlewares aplicados (no definidos sin uso) y eliminación de duplicados.
   - Verificación: grep `app.use(` contra definiciones; reporte sin huérfanos.
9. Unificación de configuración Next con `packages/config-next` en todas las apps.
   - Verificación: `next.config.mjs` importan el factory común.

## Integración (I, 15%)

10. SSO completo: login → `session-login` → `session-verify` → redirect por rol, con cookies httpOnly + CSRF.
    - Verificación: E2E que valida roles y redirects.
11. Contratos API documentados (headers, cookies, status) en `docs/API_CONTRACTS.md`.
    - Verificación: presencia y enlaces desde cada app.

## Performance (P, 10%)

12. Headers de caché `Cache-Control` + `immutable` para estáticos; `compress: true` activo.
    - Verificación: respuestas con headers esperados y configuración Next/Nginx.
13. Budget de bundle por app y alerta CI si supera umbral.
    - Verificación: script de análisis y check en pipeline.

---

## Roadmap de Implementación Rápida (Primera Ola)

- [x] Añadir enlaces y referencias a guías y validación técnica
- [ ] Endurecer CSP (producción)
- [ ] coverageThreshold ≥80% en Jest
- [ ] Corregir duplicidad `allowedHeaders` en CORS
- [ ] E2E de CSRF básico (403 sin header)

## Evidencia y Seguimiento

- Toda mejora debe adjuntar evidencia (ruta+líneas) y pruebas correspondientes.
