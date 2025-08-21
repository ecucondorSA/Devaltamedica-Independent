/**
 * QoS Session Details API Endpoint
 * GET /api/v1/telemedicine/qos/sessions/:id
 * 
 * Returns detailed QoS metrics for a specific session
 */

import { NextRequest, NextResponse } from 'next/server';
import { UnifiedAuth } from '@/auth/UnifiedAuthSystem';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import { QoSReportService } from '@/services/qos-report.service';

import { logger } from '@altamedica/shared/services/logger.service';
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const authResult = await UnifiedAuth(request, ['DOCTOR', 'ADMIN', 'PATIENT']);
    if (!authResult.success) {
      return authResult.response;
    }

    const sessionId = params.id;

    // Get session details to verify access
    const session = await QoSReportService.getSessionById(sessionId);
    
    if (!session) {
      return createErrorResponse('Session not found', 404);
    }

    // Check access permissions
    const hasAccess = 
      authResult.user.role === 'ADMIN' ||
      (authResult.user.role === 'DOCTOR' && session.doctorId === authResult.user.uid) ||
      (authResult.user.role === 'PATIENT' && session.patientId === authResult.user.uid);

    if (!hasAccess) {
      return createErrorResponse('Access denied to this session', 403);
    }

    // Get detailed QoS metrics
    const qosMetrics = await QoSReportService.getSessionQoSMetrics(sessionId);

    // Get timeline data for charts
    const timeline = await QoSReportService.getSessionTimeline(sessionId);

    // Calculate quality score
    const qualityScore = await QoSReportService.calculateQualityScore(qosMetrics);

    return createSuccessResponse({
      session: {
        id: session.id,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        doctorId: session.doctorId,
        patientId: session.patientId,
        doctorName: session.doctorName,
        patientName: authResult.user.role === 'PATIENT' ? 'You' : session.patientName
      },
      metrics: qosMetrics,
      timeline,
      qualityScore,
      recommendations: getQoSRecommendations(qualityScore, qosMetrics)
    });
  } catch (error) {
    logger.error('Error fetching session QoS:', undefined, error);
    return createErrorResponse('Failed to fetch session QoS data', 500);
  }
}

function getQoSRecommendations(score: number, metrics: any) {
  const recommendations = [];

  if (score < 70) {
    if (metrics.avgPacketLoss > 2) {
      recommendations.push({
        type: 'network',
        severity: 'high',
        message: 'High packet loss detected. Check network connection.',
        action: 'Consider using wired connection instead of WiFi'
      });
    }
    
    if (metrics.avgLatency > 150) {
      recommendations.push({
        type: 'latency',
        severity: 'medium',
        message: 'High latency affecting call quality.',
        action: 'Close other applications using bandwidth'
      });
    }

    if (metrics.avgJitter > 30) {
      recommendations.push({
        type: 'jitter',
        severity: 'medium', 
        message: 'Unstable connection detected.',
        action: 'Move closer to WiFi router or switch networks'
      });
    }
  }

  return recommendations;
}