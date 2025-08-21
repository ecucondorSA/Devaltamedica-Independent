# @altamedica/telemedicine-core

Servicio y hooks centrales para funcionalidades de Telemedicina (WebRTC) reutilizables en las apps (patients, doctors, admin, etc). Incluye monitoreo de Calidad de Servicio (QoS) WebRTC (GAP-009-T1).

## 🚀 Características Clave
- Abstracción unificada de sesión (`useTelemedicineUnified`)
- Cliente de videollamada y helpers (`AltaMedicaVideoCallClient`)
- Monitoreo QoS WebRTC en tiempo real (latency, jitter, packet loss, bitrates, frameRate, codecs, qualityScore)
- Sistema de alertas de degradación y cálculo de `qualityLevel`
- Hooks React para métricas y visualización (`useWebRTCQoS`, `useQoSIndicators`)

## 📦 Instalación
Este paquete forma parte del monorepo y se consume internamente:
```ts
import { useTelemedicineUnified } from '@altamedica/telemedicine-core';
```

## 🧩 Uso Rápido (Unified Hook + QoS)
```tsx
import { useRef, useEffect } from 'react';
import { useTelemedicineUnified } from '@altamedica/telemedicine-core';

export function SessionView({ appointmentId, userId, userType }: {appointmentId:string; userId:string; userType:'patient'|'doctor'|'company'}) {
  const { state, registerPeerConnection } = useTelemedicineUnified({ appointmentId, userId, userType });
  const pcRef = useRef<RTCPeerConnection>();

  useEffect(() => {
    pcRef.current = new RTCPeerConnection();
    registerPeerConnection(pcRef.current, appointmentId);
  }, [appointmentId, registerPeerConnection]);

  return (
    <div>
      <h3>Quality: {state.qos?.qualityLevel} ({state.qos?.qualityScore})</h3>
      <p>Latency: {state.qos?.latency} ms | Jitter: {state.qos?.jitter} ms | Loss: {state.qos?.packetLoss}%</p>
    </div>
  );
}
```

## 🔍 Hook de QoS Directo
Si necesitas más control o histórico detallado:
```tsx
import { useWebRTCQoS } from '@altamedica/telemedicine-core';

const { metrics, history, averages, alerts, startMonitoring, stopMonitoring, qualityLevel, qualityScore } = useWebRTCQoS({
  sessionId: 'session123',
  peerConnection,
  autoStart: true,
  monitoringInterval: 2000
});
```

## 📊 Métricas Capturadas
| Categoría | Campos |
|-----------|--------|
| Core | latency (ms), jitter (ms), packetLoss (%) |
| Bandwidth | uploadBandwidthKbps, downloadBandwidthKbps |
| Video | frameRate, width, height, videoBitrateKbps, codec, keyFrames? |
| Audio | audioBitrateKbps, audioLevel, echoReturnLoss, codec |
| Score | qualityScore (0-100), qualityLevel (excellent/good/fair/poor) |

## 🛎️ Alertas
Se generan eventos cuando los thresholds bajan a categorías inferiores (ej. pasar de good→fair). Pueden escucharse vía `qosService.on('alerts', handler)` o colectarse con el hook.

## 🧪 Testing Sugerido
- Mock de `RTCPeerConnection.getStats()` para validar cálculo de bitrates y score.
- Snapshot de indicadores (`useQoSIndicators`) en varios escenarios.

## 🔜 Próximas Etapas (GAP-009)
| Task | Estado | Descripción |
|------|--------|-------------|
| GAP-009-T1 | completed | Recolección local de métricas QoS |
| GAP-009-T2 | pending | Ingesta backend (endpoint batch) |
| GAP-009-T3 | pending | Dashboard tiempo real + visualizaciones |

## 🏗️ Extensiones Futuras
- Outbound bitrate (bytesSent) y frame drops
- Persistencia local/temporal para reconexiones
- Adaptive thresholds según tipo de red
- Report final auto-enviado al backend al cerrar sesión

## 🧵 API de Servicio (qosService)
```ts
startMonitoring(sessionId: string, pc: RTCPeerConnection, intervalMs?: number)
stopMonitoring(sessionId: string)
getMetricsHistory(sessionId: string)
getAverageMetrics(sessionId: string)
generateQualityReport(sessionId: string)
```

## ⚠️ Notas
- Asegúrate de registrar el `peerConnection` antes de iniciar la sesión real para capturar métricas desde el principio.
- Evita iniciar múltiples monitores sobre la misma sesión.

## 📄 Licencia
MIT
