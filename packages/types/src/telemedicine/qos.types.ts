import { z } from 'zod';

// GAP-009-T2: Tipos para ingesta de métricas QoS WebRTC
export const QoSIngestSampleSchema = z.object({
  sessionId: z.string().min(1),
  timestamp: z.string().datetime(),
  latency: z.number().nonnegative().optional(),
  jitter: z.number().nonnegative().optional(),
  packetLoss: z.number().min(0).max(100).optional(),
  uploadKbps: z.number().nonnegative().optional(),
  downloadKbps: z.number().nonnegative().optional(),
  videoBitrateKbps: z.number().nonnegative().optional(),
  audioBitrateKbps: z.number().nonnegative().optional(),
  qualityScore: z.number().min(0).max(100).optional(),
  qualityLevel: z.enum(['excellent','good','fair','poor','disconnected']).optional()
});

export const QoSIngestRequestSchema = z.object({
  samples: z.array(QoSIngestSampleSchema).min(1).max(50)
});

export type QoSIngestSample = z.infer<typeof QoSIngestSampleSchema>;
export type QoSIngestRequest = z.infer<typeof QoSIngestRequestSchema>;
