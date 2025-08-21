/**
 * QoS Metrics Recording API Endpoint
 * POST /api/v1/telemedicine/qos/metrics
 * 
 * Records real-time QoS metrics from active sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { UnifiedAuth } from '@/auth/UnifiedAuthSystem';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import { QoSReportService } from '@/services/qos-report.service';
import { z } from 'zod';

import { logger } from '@altamedica/shared/services/logger.service';
const MetricsSchema = z.object({
  sessionId: z.string(),
  timestamp: z.string().datetime(),
  metrics: z.object({
    latency: z.number().min(0),
    jitter: z.number().min(0),
    packetLoss: z.number().min(0).max(100),
    bandwidth: z.object({
      upload: z.number().min(0),
      download: z.number().min(0)
    }),
    video: z.object({
      resolution: z.string(),
      frameRate: z.number(),
      bitrate: z.number(),
      codec: z.string()
    }).optional(),
    audio: z.object({
      bitrate: z.number(),
      codec: z.string(),
      level: z.number().min(0).max(100)
    }).optional(),
    connection: z.object({
      type: z.enum(['stable', 'unstable', 'reconnecting', 'disconnected']),
      protocol: z.string(),
      candidateType: z.string()
    })
  })
});

export async function POST(request: NextRequest) {
  try {
    // Authentication required
    const authResult = await UnifiedAuth(request, ['DOCTOR', 'PATIENT']);
    if (!authResult.success) {
      return authResult.response;
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = MetricsSchema.parse(body);

    // Verify user is part of the session
    const session = await QoSReportService.getSessionById(validatedData.sessionId);
    
    if (!session) {
      return createErrorResponse('Session not found', 404);
    }

    const isParticipant = 
      (authResult.user.role === 'DOCTOR' && session.doctorId === authResult.user.uid) ||
      (authResult.user.role === 'PATIENT' && session.patientId === authResult.user.uid);

    if (!isParticipant) {
      return createErrorResponse('Not authorized to record metrics for this session', 403);
    }

    // Record the metrics
    await QoSReportService.recordMetrics({
      ...validatedData,
      userId: authResult.user.uid,
      userRole: authResult.user.role
    });

    // Check if quality is degrading and send alerts if needed
    const qualityAnalysis = await QoSReportService.analyzeQuality(validatedData.metrics);
    
    if (qualityAnalysis.needsAlert) {
      await QoSReportService.sendQualityAlert({
        sessionId: validatedData.sessionId,
        issue: qualityAnalysis.issue,
        severity: qualityAnalysis.severity,
        metrics: validatedData.metrics
      });
    }

    return createSuccessResponse({
      recorded: true,
      analysis: qualityAnalysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid metrics data', 400, error.errors);
    }
    
    logger.error('Error recording QoS metrics:', undefined, error);
    return createErrorResponse('Failed to record metrics', 500);
  }
}

// GET endpoint to retrieve real-time metrics
export async function GET(request: NextRequest) {
  try {
    const authResult = await UnifiedAuth(request, ['DOCTOR', 'PATIENT', 'ADMIN']);
    if (!authResult.success) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return createErrorResponse('Session ID required', 400);
    }

    // Get real-time metrics for the session
    const realtimeMetrics = await QoSReportService.getRealtimeMetrics(sessionId);
    
    return createSuccessResponse({
      sessionId,
      metrics: realtimeMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching real-time metrics:', undefined, error);
    return createErrorResponse('Failed to fetch metrics', 500);
  }
}