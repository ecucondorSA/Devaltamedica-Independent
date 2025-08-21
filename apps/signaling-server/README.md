# 📡 AltaMedica Signaling Server

**Puerto:** 8888 | **Tipo:** Servidor WebRTC | **Framework:** Node.js + Socket.IO

## ⚠️ REGLA FUNDAMENTAL: USAR PACKAGES CENTRALIZADOS

### 🚫 **LO QUE NO DEBES HACER:**
```typescript
// ❌ NUNCA crear servicios de WebRTC duplicados
export class WebRTCService {
  // Ya existe en @altamedica/telemedicine-core - PROHIBIDO
}

// ❌ NUNCA implementar autenticación duplicada
export function authenticateSocket() {
  // Ya existe en @altamedica/auth - PROHIBIDO  
}

// ❌ NUNCA crear utilidades de conexión que ya existen
export function validatePeerConnection() {
  // Ya existe en @altamedica/utils - PROHIBIDO
}
```

### ✅ **LO QUE SÍ DEBES HACER:**
```typescript
// ✅ SIEMPRE importar desde packages centralizados
import { WebRTCSignaling, PeerConnectionManager } from '@altamedica/telemedicine-core';
import { authenticateSocket, validateMedicalSession } from '@altamedica/auth';
import { logSecureEvent, encryptSignaling } from '@altamedica/medical-security';
import { SignalingMessage, PeerConnection } from '@altamedica/telemedicine-types';
```

## 📦 **PASO 1: REVISAR PACKAGES DE TELEMEDICINA DISPONIBLES**

**ANTES de escribir cualquier código de señalización, verifica estos packages:**

### 📡 Core de Telemedicina (`@altamedica/telemedicine-core`)
```bash
# Ver servicios de WebRTC disponibles
cd ../../packages/telemedicine-core/src
ls -la

# Servicios principales:
# - WebRTCSignaling, PeerConnectionManager
# - MediaStreamHandler, QualityController
# - SecurityManager, EncryptionHandler
```

### 🔐 Seguridad Médica (`@altamedica/medical-security`)
```bash
# Ver seguridad de telemedicina disponible
cd ../../packages/medical-security/src/webrtc
ls -la

# Seguridad WebRTC:
# - SignalingEncryption, MediaEncryption
# - SessionValidator, AuditLogger
# - HIPAACompliantWebRTC
```

### 🪝 Hooks de WebRTC (`@altamedica/hooks`)
```bash
# Ver hooks de WebRTC disponibles
cd ../../packages/hooks/src/webrtc
ls -la

# Hooks de WebRTC:
# - useWebRTC, usePeerConnection, useMediaStream
# - useSignaling, useCallQuality, useRecording
```

### 🌐 Tipos de WebRTC (`@altamedica/telemedicine-types`)
```bash
# Ver tipos de WebRTC disponibles
cd ../../packages/telemedicine-types/src
ls -la

# Tipos de WebRTC:
# - SignalingMessage, PeerConnection, MediaStream
# - CallSession, QualityMetrics, SecurityState
```

## 🚀 **Configuración del Servidor**

### Instalación
```bash
pnpm install
```

### Desarrollo
```bash
pnpm dev  # Puerto 8888
```

### Producción
```bash
pnpm start  # Con SSL y clustering
```

## 🏗️ **Arquitectura del Signaling Server**

```
src/
├── config/              # Configuración específica del servidor
│   ├── server.config.ts # Solo config específica del signaling
│   └── ssl.config.ts    # SSL específico para WebRTC
├── middleware/          # Middleware ESPECÍFICO del signaling
│   ├── auth.middleware.ts # Solo auth específico del servidor
│   └── rate-limit.ts    # Rate limiting específico
├── services/            # Servicios ESPECÍFICOS del servidor
│   ├── room.service.ts  # Solo lógica específica de rooms
│   └── connection.ts    # Solo gestión específica de conexiones
└── index.ts             # Entry point del servidor
```

## ✅ **Checklist Antes de Desarrollar**

### 📋 **OBLIGATORIO - Verificar Telemedicine Packages Primero:**
- [ ] ¿El servicio de WebRTC ya existe en `@altamedica/telemedicine-core`?
- [ ] ¿La funcionalidad de seguridad ya existe en `@altamedica/medical-security`?
- [ ] ¿Los tipos ya existen en `@altamedica/telemedicine-types`?
- [ ] ¿Las utilidades ya existen en `@altamedica/utils`?

### 📋 **Solo si NO existe en packages:**
- [ ] ¿Es específico de la infraestructura del servidor?
- [ ] ¿Es lógica de networking/transporte únicamente?
- [ ] ¿Está documentado por qué es específico del servidor?

## 🎯 **Funcionalidades Específicas del Signaling Server**

### Gestión de Conexiones WebRTC
- **Señalización de ofertas y respuestas**
- **Intercambio de candidatos ICE**
- **Gestión de rooms médicas**
- **Quality of Service monitoring**

### Room Management Específico
```typescript
// ✅ CORRECTO - Gestión de rooms específica del servidor
export class MedicalRoomManager {
  constructor(
    private signalingCore: WebRTCSignaling, // De @altamedica/telemedicine-core
    private security: MedicalSecurity // De @altamedica/medical-security
  ) {}
  
  async createMedicalRoom(doctorId: string, patientId: string) {
    // Lógica específica del servidor para crear rooms médicas
    const roomConfig = {
      encryption: true,
      recording: true,
      hipaaCompliant: true,
      qualityMonitoring: true
    };
    
    return this.signalingCore.createRoom(roomConfig);
  }
}
```

### Connection Management Específico
```typescript
// ✅ CORRECTO - Gestión de conexiones específica del servidor
export class ServerConnectionManager {
  constructor(
    private peerManager: PeerConnectionManager // De @altamedica/telemedicine-core
  ) {}
  
  handleServerSpecificConnection(socket: Socket) {
    // Solo lógica específica del servidor
    socket.on('join-medical-room', this.handleJoinRoom.bind(this));
    socket.on('medical-signal', this.handleMedicalSignal.bind(this));
    socket.on('quality-report', this.handleQualityReport.bind(this));
  }
}
```

## 🔗 **Dependencies Específicas del Servidor**

```json
{
  "@altamedica/telemedicine-core": "workspace:*",
  "@altamedica/medical-security": "workspace:*", 
  "@altamedica/telemedicine-types": "workspace:*",
  "@altamedica/auth": "workspace:*",
  "@altamedica/utils": "workspace:*",
  "socket.io": "^4.7.2",
  "express": "^4.18.2"
}
```

## 📊 **Funcionalidades Específicas del Servidor**

### Autenticación de Socket
```typescript
// ✅ CORRECTO - Auth específico para sockets médicos
import { authenticateSocket } from '@altamedica/auth';

export function setupSocketAuth(io: Server) {
  io.use(async (socket, next) => {
    try {
      // Usar auth centralizado
      const user = await authenticateSocket(socket.handshake.auth.token);
      
      // Validaciones específicas del servidor
      if (!user.canAccessTelemedicine) {
        throw new Error('Unauthorized for telemedicine');
      }
      
      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });
}
```

### Rate Limiting Específico
```typescript
// ✅ CORRECTO - Rate limiting específico para WebRTC
export function setupWebRTCRateLimit() {
  return {
    signalingMessages: { limit: 100, window: 60000 }, // 100/min
    peerConnections: { limit: 5, window: 300000 },    // 5/5min
    mediaStreams: { limit: 2, window: 1800000 }       // 2/30min
  };
}
```

## 🛡️ **Seguridad Específica del Servidor**

### Encriptación de Señalización
```typescript
// ✅ CORRECTO - Usar encriptación centralizada
import { encryptSignaling, auditSignaling } from '@altamedica/medical-security';

export class SecureSignalingHandler {
  async handleSignalingMessage(socket: Socket, message: SignalingMessage) {
    // Auditar todas las señales médicas
    await auditSignaling({
      userId: socket.data.user.id,
      messageType: message.type,
      timestamp: new Date(),
      encrypted: true
    });
    
    // Usar encriptación centralizada
    const encryptedMessage = await encryptSignaling(message);
    
    // Solo lógica específica del servidor
    this.routeToDestination(encryptedMessage);
  }
}
```

### Validación de Sesiones Médicas
```typescript
// ✅ CORRECTO - Validación específica del servidor
export class MedicalSessionValidator {
  constructor(
    private security: MedicalSecurity // De @altamedica/medical-security
  ) {}
  
  async validateMedicalSession(sessionId: string, participants: string[]) {
    // Usar validaciones centralizadas
    const isValid = await this.security.validateSession(sessionId);
    
    // Validaciones específicas del servidor
    if (participants.length > 2) {
      throw new Error('Medical sessions limited to doctor-patient only');
    }
    
    return isValid;
  }
}
```

## 📡 **WebRTC Infrastructure Específica**

### STUN/TURN Configuration
```typescript
// ✅ CORRECTO - Configuración específica del servidor
export const webRTCConfig = {
  iceServers: [
    {
      urls: process.env.STUN_SERVER_URL,
      username: process.env.STUN_USERNAME,
      credential: process.env.STUN_CREDENTIAL
    },
    {
      urls: process.env.TURN_SERVER_URL,
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_CREDENTIAL
    }
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require'
};
```

### Quality Monitoring
```typescript
// ✅ CORRECTO - Monitoreo específico del servidor
export class ServerQualityMonitor {
  constructor(
    private qualityCore: QualityController // De @altamedica/telemedicine-core
  ) {}
  
  startServerMonitoring(roomId: string) {
    // Usar core centralizado para métricas
    return this.qualityCore.monitor(roomId, {
      serverMetrics: true,
      bandwidthAnalysis: true,
      connectionStability: true,
      medicalQualityStandards: true
    });
  }
}
```

## 🚨 **Code Review Checklist del Servidor**

### ❌ **Rechazar PR si:**
- Implementa lógica de WebRTC que ya existe en packages
- No usa autenticación centralizada
- No incluye audit logs médicos apropiados
- No cumple estándares HIPAA para telemedicina
- No justifica por qué es específico del servidor

### ✅ **Aprobar PR si:**
- Usa packages de telemedicina centralizados
- Solo contiene lógica específica del servidor/networking
- Incluye seguridad y audit apropiados
- Optimiza para performance del servidor
- Está bien documentado técnicamente

## 📈 **Performance y Escalabilidad del Servidor**

### Clustering para Alta Disponibilidad
```typescript
// ✅ CORRECTO - Clustering específico del servidor
import cluster from 'cluster';
import { createAdapter } from '@socket.io/redis-adapter';

export function setupClustering() {
  if (cluster.isPrimary) {
    // Master process - específico del servidor
    for (let i = 0; i < require('os').cpus().length; i++) {
      cluster.fork();
    }
  } else {
    // Worker processes con Redis adapter
    const io = new Server(server);
    io.adapter(createAdapter(redisClient, redisClient.duplicate()));
  }
}
```

### Health Checks Específicos
```typescript
// ✅ CORRECTO - Health checks específicos del servidor
export function setupHealthChecks(server: Server) {
  server.get('/health', (req, res) => {
    const health = {
      server: 'healthy',
      activeConnections: io.engine.clientsCount,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      webrtc: {
        activeRooms: roomManager.getActiveRoomsCount(),
        peerConnections: connectionManager.getActiveConnectionsCount()
      }
    };
    
    res.json(health);
  });
}
```

## 🧪 **Testing Específico del Servidor**

### Tests de Integración WebRTC
```bash
# Tests específicos del servidor
pnpm test:server

# Tests de load para WebRTC
pnpm test:load

# Tests de seguridad del signaling
pnpm test:security:signaling
```

### Tests de Socket.IO
```typescript
// ✅ Tests específicos del signaling server
describe('Medical Signaling Server', () => {
  it('should handle medical room creation securely', () => {
    // Test de creación de rooms médicas
  });
  
  it('should validate and encrypt all signaling messages', () => {
    // Test de seguridad de mensajes
  });
  
  it('should maintain HIPAA compliance in all WebRTC operations', () => {
    // Test de compliance médico
  });
});
```

## 🔧 **Configuración Específica del Servidor**

### SSL/TLS para WebRTC
```typescript
// ✅ CORRECTO - SSL específico para WebRTC médico
export const sslConfig = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH),
  // WebRTC requiere certificados válidos en producción
  secureProtocol: 'TLSv1_2_method',
  ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:!RC4:!aNULL:!eNULL'
};
```

### Environment Variables
```bash
# Variables específicas del signaling server
SIGNALING_PORT=8888
SSL_KEY_PATH=/path/to/ssl/key.pem
SSL_CERT_PATH=/path/to/ssl/cert.pem
STUN_SERVER_URL=stun:stun.altamedica.com:3478
TURN_SERVER_URL=turn:turn.altamedica.com:3478
REDIS_URL=redis://localhost:6379
```

---

## 🎯 **RECUERDA:**
> **"INFRAESTRUCTURA PRIMERO, FEATURES DESPUÉS"**
> 
> Este servidor debe ser principalmente infraestructura de networking. La lógica de WebRTC está en los packages centralizados.

## 📞 **Soporte del Servidor**

- **WebRTC Documentation:** `../../packages/telemedicine-*/README.md`
- **Server Infrastructure:** Documentación de DevOps
- **Security Guidelines:** Compliance para telemedicina
- **24/7 Monitoring:** Sistema de monitoreo continuo