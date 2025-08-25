# CLAUDE.md - Telemedicine Core

## 🤖 FRAGMENTOS PARA AUTOCOMPLETADO WebRTC

### ✅ Script Start (WebRTC Package)
```javascript
import { MediaSoup } from 'mediasoup-client';
import { Socket } from 'socket.io-client';
```

### ✅ WebRTC Connection Setup
```javascript
export const createWebRTCConnection = () => {
  const config = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 10
  };
  return new RTCPeerConnection(config);
};
```

### ✅ Media Capture Pattern
```javascript
export const captureMedia = async (constraints = {}) => {
  const defaultConstraints = {
    video: { 
      width: { ideal: 1280 }, 
      height: { ideal: 720 },
      facingMode: 'user'
    },
    audio: { 
      echoCancellation: true, 
      noiseSuppression: true,
      autoGainControl: true
    }
  };
  
  return await navigator.mediaDevices.getUserMedia({
    ...defaultConstraints,
    ...constraints
  });
};
```

### ✅ Quality Monitor
```javascript
export const monitorConnectionQuality = (peerConnection) => {
  return setInterval(async () => {
    const stats = await peerConnection.getStats();
    const report = Array.from(stats.values())
      .filter(stat => stat.type === 'inbound-rtp' && stat.mediaType === 'video')[0];
    
    if (report) {
      const quality = {
        packetsLost: report.packetsLost || 0,
        jitter: report.jitter || 0,
        bytesReceived: report.bytesReceived || 0,
        timestamp: Date.now()
      };
      console.log('WebRTC Quality:', quality);
    }
  }, 2000);
};
```

### ✅ Test WebRTC Connection
```javascript
const testWebRTCConnection = async () => {
  try {
    const pc = createWebRTCConnection();
    const stream = await captureMedia();
    
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    
    return {
      status: 'SUCCESS',
      videoTracks: stream.getVideoTracks().length,
      audioTracks: stream.getAudioTracks().length,
      connectionState: pc.connectionState
    };
  } catch (error) {
    return { status: 'FAILED', error: error.message };
  }
};
```

---

Resumen operativo para agentes IA sobre el paquete `@altamedica/telemedicine-core`.

## 🌳 WORKTREE PARA TELEMEDICINE CORE

- **Para auditar duplicaciones WebRTC**: usar `../devaltamedica-audit/`
- **Para integrar telemedicina**: usar `../devaltamedica-integrate/`
- **Para validar WebRTC**: usar `../devaltamedica-validate/`
- **El core de telemedicina YA EXISTE** - solo necesita integración

## 🎯 Propósito

Centralizar lógica reutilizable de telemedicina (WebRTC, sesión unificada, QoS) para las apps (patients, doctors, admin, companies) evitando duplicación.

## 📌 Componentes Clave

| Componente                | Archivo                                      | Descripción                                         |
| ------------------------- | -------------------------------------------- | --------------------------------------------------- |
| Video Call Client         | `videoCallClient.ts`                         | Creación/sesión de videollamadas base               |
| Hook Unificado            | `useTelemedicineUnified.ts`                  | Estado combinado sesión + marketplace + QoS parcial |
| Servicio QoS (GAP-009-T1) | `qos/webrtc-qos.service.ts`                  | Recolección y score calidad WebRTC                  |
| Hook QoS                  | `hooks/useWebRTCQoS.ts`                      | Suscripción React en tiempo real                    |
| Indicadores UI            | `hooks/useWebRTCQoS.ts` (`useQoSIndicators`) | Map a niveles (ok / warning / critical)             |

## ✅ Estado GAP-009

- T1 (recolección local): COMPLETADO
- T2 (ingesta backend): PENDIENTE → crear endpoint `/api/v1/telemedicine/qos` (batch) + tipos en `@altamedica/types`
- T3 (dashboard): PENDIENTE → charts tiempo real + alerting visual

## 🧪 Recomendaciones de Test

1. Mock de `getStats()` con diferentes degradaciones (alto jitter / packetLoss / RTT).
2. Verificar cálculo de `qualityScore` y transición de `qualityLevel`.
3. Validar que `stopMonitoring` detiene intervalos (no memory leak).

## 🔜 Próxima Acción (Sugerida)

Implementar stub de ingesta (T2):

1. Tipo `QoSIngestSample` (timestamp, sessionId, latency, jitter, packetLoss, uploadKbps, downloadKbps, qualityScore, qualityLevel).
2. Endpoint POST `/api/v1/telemedicine/qos` → 202 Accepted (persistencia futura).
3. Batch size sugerido ≤50 samples.
4. Responder con `{ accepted: n, pendingPersistence: true }`.

## 🧩 Uso Rápido QoS

```ts
const { metrics, qualityLevel, qualityScore } = useWebRTCQoS({
  sessionId,
  peerConnection,
  autoStart: true,
});
```

## ⚠️ Notas Operativas

- No exponer tokens en logs de QoS.
- Evitar enviar métricas más de 1 vez/2s al backend (throttle).

## 📄 Actualizado

GAP-009-T1 completado a la fecha.
