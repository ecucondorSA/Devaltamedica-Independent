/**
 * QoS Reports API Endpoint
 * GET /api/v1/telemedicine/qos/reports
 * 
 * Returns Quality of Service reports for telemedicine sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { UnifiedAuth } from '@/auth/UnifiedAuthSystem';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import { QoSReportService } from '@/services/qos-report.service';
import { z } from 'zod';

import { logger } from '@altamedica/shared/services/logger.service';
const QuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sessionId: z.string().optional(),
  doctorId: z.string().optional(),
  patientId: z.string().optional(),
  limit: z.string().transform(Number).default('20'),
  offset: z.string().transform(Number).default('0'),
  sortBy: z.enum(['date', 'quality', 'duration']).default('date'),
  order: z.enum(['asc', 'desc']).default('desc')
});

export async function GET(request: NextRequest) {
  try {
    // Authentication check - doctors and admins only
    const authResult = await UnifiedAuth(request, ['DOCTOR', 'ADMIN']);
    if (!authResult.success) {
      return authResult.response;
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validatedParams = QuerySchema.parse(queryParams);

    // Apply role-based filtering
    if (authResult.user.role === 'DOCTOR') {
      // Doctors can only see their own sessions
      validatedParams.doctorId = authResult.user.uid;
    }

    // Fetch QoS reports
    const reports = await QoSReportService.getReports({
      ...validatedParams,
      startDate: validatedParams.startDate ? new Date(validatedParams.startDate) : undefined,
      endDate: validatedParams.endDate ? new Date(validatedParams.endDate) : undefined,
    });

    // Calculate aggregated metrics
    const aggregatedMetrics = await QoSReportService.getAggregatedMetrics({
      doctorId: validatedParams.doctorId,
      startDate: validatedParams.startDate ? new Date(validatedParams.startDate) : undefined,
      endDate: validatedParams.endDate ? new Date(validatedParams.endDate) : undefined,
    });

    return createSuccessResponse({
      reports,
      aggregatedMetrics,
      pagination: {
        limit: validatedParams.limit,
        offset: validatedParams.offset,
        total: reports.total
      }
    });
  } catch (error) {
    logger.error('Error fetching QoS reports:', undefined, error);
    return createErrorResponse('Failed to fetch QoS reports', 500);
  }
}