// @altamedica/telemedicine-core
export const telemedicineCoreVersion = '1.0.0';

// Unified Telemedicine Service (MIGRACIÓN 2025-08-16)
export {
  CreateSessionRequestSchema,
  JoinSessionRequestSchema,
  TelemedicineSessionSchema,
  UnifiedTelemedicineService,
  getTelemedicineService,
  type CreateSessionRequest,
  type ITelemedicineService,
  type JoinSessionRequest,
  type TelemedicineSession,
} from './services/UnifiedTelemedicineService';

// Video Call Client
export { AltaMedicaVideoCallClient, createConsultationCall, useVideoCall } from './videoCallClient';

// Unified Telemedicine Hook (NUEVO)
export { useTelemedicineUnified } from './useTelemedicineUnified';

// GAP-009: WebRTC QoS Service
export { WebRTCQoSService, qosService } from './qos/webrtc-qos.service';

// Hooks QoS
export { useQoSIndicators, useWebRTCQoS } from './hooks/useWebRTCQoS';

// Export types
export type {
  ActiveCall,
  CallStatus,
  CreateCallRequest,
  VideoCallResponse,
} from './videoCallClient';

export type { UnifiedTelemedicineConfig, UnifiedTelemedicineState } from './useTelemedicineUnified';

export type { QoSAlert, QoSMetrics, QoSThresholds } from './qos/webrtc-qos.service';
