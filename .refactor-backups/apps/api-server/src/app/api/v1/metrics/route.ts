import { NextRequest, NextResponse } from 'next/server';
import { createPublicRoute } from '@/lib/middleware/UnifiedAuth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import { getMetrics, getMetricsJson } from '@/lib/metrics';

import { logger } from '@altamedica/shared/services/logger.service';
// GET /api/v1/metrics - Prometheus metrics endpoint for scraping
export const GET = createPublicRoute(
  async (request: NextRequest, authContext) => {
    try {
      const url = new URL(request.url);
      const format = url.searchParams.get('format') || 'prometheus';
      
      logger.info(`[Metrics] Getting metrics in ${format} format`);
      
      if (format === 'json') {
        // JSON format for Grafana and other consumers
        const metricsJson = await getMetricsJson();
        
        return NextResponse.json(
          createSuccessResponse(metricsJson, 'Metrics retrieved successfully')
        );
      } else {
        // Default Prometheus format
        const metrics = await getMetrics();
        
        // Return raw Prometheus metrics format
        return new NextResponse(metrics, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      }
      
    } catch (error) {
      logger.error('[Metrics] Error fetching metrics:', undefined, error);
      
      const url = new URL(request.url);
      const format = url.searchParams.get('format') || 'prometheus';
      
      if (format === 'json') {
        return NextResponse.json(
          createErrorResponse('METRICS_ERROR', 'Error fetching metrics'),
          { status: 500 }
        );
      } else {
        return new NextResponse('Error fetching metrics', {
          status: 500,
          headers: {
            'Content-Type': 'text/plain'
          }
        });
      }
    }
  },
  {
    skipRateLimit: true, // Prometheus scraping shouldn't be rate limited
    auditAction: 'get_metrics'
  }
);