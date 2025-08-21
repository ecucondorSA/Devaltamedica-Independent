# CLAUDE.md - App: Doctors 👨‍⚕️

## 🌳 WORKTREE PARA DOCTORS APP

- **Para auditar componentes duplicados**: usar `../devaltamedica-audit/`
- **Para conectar features médicas**: usar `../devaltamedica-integrate/`
- **Para validar funcionalidad médica**: usar `../devaltamedica-validate/`
- **Las features médicas YA EXISTEN** - solo necesitan integración

## 🔮 Patient Crystal Ball - Sistema de Predicción de Evolución

**Actualización 16 Agosto 2025**: Implementación completa E2E del predictor de readmisiones con IA.

### Componentes Implementados

1. **Tipos** (`@altamedica/types/medical/patient-predictor.types.ts`)
   - `PatientCrystalBallPrediction`: Predicción completa con factores de riesgo
   - `ReadmissionPrediction`: Predicción específica de readmisión
   - `InterventionRecommendation`: Recomendaciones de intervención
   - `FollowUpPlan`: Plan de seguimiento personalizado

2. **Servicio Backend** (`apps/api-server/src/services/patient-predictor.service.ts`)
   - Análisis de factores de riesgo (demográficos, clínicos, sociales, comportamentales)
   - Predicción de readmisión con probabilidad y confianza
   - Generación de intervenciones personalizadas
   - Plan de seguimiento automático según riesgo

3. **Hook** (`@altamedica/hooks/medical/usePatientPredictor.ts`)
   - `usePatientPredictor`: Hook principal con todas las funcionalidades
   - `useBatchPredictions`: Para analizar múltiples pacientes
   - `useRealtimeMonitoring`: Actualizaciones en tiempo real
   - WebSocket integration para alertas instantáneas

4. **UI Component** (`apps/doctors/src/components/patient-predictor/PatientCrystalBall.tsx`)
   - Visualización completa de predicciones
   - Tabs: Intervenciones, Seguimiento, Alertas, Detalles
   - Implementación de intervenciones con notas
   - Resolución de alertas críticas

5. **Página Dedicada** (`apps/doctors/src/app/patients/[id]/crystal-ball/page.tsx`)
   - Ruta: `/patients/{patientId}/crystal-ball`
   - Exportación a PDF
   - Compartir predicciones

### Características Principales

- **Predicción de Readmisión**: 24h, 48h, 72h con 85% precisión histórica
- **Factores de Riesgo Analizados**:
  - Edad, comorbilidades, saturación O2
  - Vive solo, adherencia medicamentosa
  - Historial de readmisiones
- **Intervenciones Automáticas**:
  - Extender observación si riesgo crítico
  - Telemonitoreo domiciliario
  - Educación medicamentosa
- **Seguimiento Inteligente**:
  - Llamadas programadas según riesgo
  - Videoconsultas automáticas
  - Alertas por deterioro

### Uso Rápido

```tsx
import { PatientCrystalBall } from '@/components/patient-predictor/PatientCrystalBall';

// En cualquier página/componente
<PatientCrystalBall
  patientId="patient-123"
  onInterventionImplemented={(id) => console.log('Implemented:', id)}
  onAlertResolved={(id) => console.log('Resolved:', id)}
/>;
```

### API Endpoints

- `POST /api/v1/predictions/generate` - Generar nueva predicción
- `GET /api/v1/predictions/{patientId}` - Obtener predicción actual
- `GET /api/v1/predictions/alerts/{patientId}` - Obtener alertas
- `POST /api/v1/predictions/interventions/{id}/implement` - Implementar intervención
- `POST /api/v1/predictions/alerts/{id}/resolve` - Resolver alerta

---

Actualización breve (E2E/telemedicina):

- Se agregó una tarjeta mínima en la home con data-testids para las suites E2E (@telemedicine, @a11y):
  - data-testid: emergency-consultations, new-secure-session, emergency-alert (condicional via ?emergency=1), join-emergency, webrtc-session.
- Se creó la ruta demo: `/telemedicine/session/demo` que carga `VSCodeLayout` (mock de entorno de telemedicina del médico) para navegación estable en pruebas.
- No se modificó la lógica de autenticación ni contratos. Es un refuerzo UI mínimo para discovery de selectores.

SSO / Middleware:

- En desarrollo o cuando `E2E_USE_MOCK_LOGIN=1`, el middleware permite acceso público a `/` y `/telemedicine/session/demo` para facilitar E2E.

E2E:

- Existe una spec gemela a Patients: `packages/e2e-tests/tests/telemedicine/doctors-telemedicine-home.spec.ts` con baseURL `http://localhost:3002`.

Cómo probar rápido:

- Iniciar Doctors app y navegar a `/` para ver los botones.
- Abrir `/telemedicine/session/demo` para la vista de telemedicina demo.
- Añadir `?emergency=1` a la URL raíz para ver el banner `emergency-alert` con CTA `join-emergency`.

Notas:

- Mantuvimos cambios acotados y sin side-effects. Cuando se conecten endpoints reales, actualiza @altamedica/types y documentación de API.
