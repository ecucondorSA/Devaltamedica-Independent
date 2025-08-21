import { NextRequest, NextResponse } from 'next/server';
import { createPublicRoute } from '@/lib/middleware/UnifiedAuth';
import { createSuccessResponse } from '@/lib/response-helpers';
import { adminDb } from '@/lib/firebase-admin';

import { logger } from '@altamedica/shared/services/logger.service';
// GET /api/v1/health - Health check endpoint
export const GET = createPublicRoute(
  async (request: NextRequest, authContext) => {
    try {
      logger.info('[Health] Performing health check');
      
      // Check database connectivity
      let databaseStatus = 'healthy';
      try {
        // Simple Firestore connectivity check
        await adminDb.collection('_health_check').limit(1).get();
      } catch (error) {
        logger.error('[Health] Database connectivity check failed:', undefined, error);
        databaseStatus = 'unhealthy';
      }
      
      // Basic system information
      const healthInfo = {
        status: databaseStatus === 'healthy' ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
          database: databaseStatus,
          api: 'healthy'
        },
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024)
        }
      };
      
      const statusCode = healthInfo.status === 'healthy' ? 200 : 503;
      
      return NextResponse.json(
        createSuccessResponse(healthInfo, 'Health check completed'),
        { status: statusCode }
      );
      
    } catch (error) {
      logger.error('[Health] Health check failed:', undefined, error);
      
      return NextResponse.json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      }, { status: 503 });
    }
  },
  {
    skipRateLimit: true, // Health checks shouldn't be rate limited
    auditAction: 'health_check'
  }
);