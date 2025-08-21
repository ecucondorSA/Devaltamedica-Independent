/**
 * 🏥 Health Check Routes with Dependency Verification
 * P1 Stability: Enhanced health checks for monitoring
 */

import { Router, Request, Response } from 'express';
import { checkDatabaseHealth } from '../lib/prisma';
import { checkRedisHealth } from '../lib/redis';
import { isFirebaseAdminInitialized } from '../lib/firebase-admin';

const router = Router();

/**
 * Basic health check - always returns 200 if service is up
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ 
    ok: true, 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'api-server',
    version: process.env.APP_VERSION || '1.0.0'
  });
});

/**
 * Liveness probe - checks if service is alive
 * Used by Kubernetes to determine if pod should be restarted
 */
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({ 
    ok: true, 
    status: 'live',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * Readiness probe - checks if service is ready to accept traffic
 * Verifies all critical dependencies are available
 */
router.get('/ready', async (_req: Request, res: Response) => {
  const checks = {
    database: false,
    redis: false,
    firebase: false
  };
  
  // Check dependencies in parallel
  const [dbHealth, redisHealth] = await Promise.allSettled([
    checkDatabaseHealth(),
    checkRedisHealth()
  ]);
  
  checks.database = dbHealth.status === 'fulfilled' && dbHealth.value === true;
  checks.redis = redisHealth.status === 'fulfilled' && redisHealth.value === true;
  checks.firebase = isFirebaseAdminInitialized();
  
  // Service is ready if at least database and Firebase are available
  // Redis is optional (cache)
  const isReady = checks.database && checks.firebase;
  
  const status = isReady ? 200 : 503;
  
  res.status(status).json({ 
    ok: isReady,
    status: isReady ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    checks,
    uptime: process.uptime()
  });
});

/**
 * Detailed health check with all system information
 */
router.get('/detailed', async (_req: Request, res: Response) => {
  const startTime = Date.now();
  
  // Check all dependencies
  const [dbHealth, redisHealth] = await Promise.allSettled([
    checkDatabaseHealth(),
    checkRedisHealth()
  ]);
  
  const health = {
    status: 'operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    
    services: {
      database: {
        healthy: dbHealth.status === 'fulfilled' && dbHealth.value === true,
        type: 'postgresql',
        error: dbHealth.status === 'rejected' ? dbHealth.reason?.message : undefined
      },
      redis: {
        healthy: redisHealth.status === 'fulfilled' && redisHealth.value === true,
        type: 'redis',
        error: redisHealth.status === 'rejected' ? redisHealth.reason?.message : undefined
      },
      firebase: {
        healthy: isFirebaseAdminInitialized(),
        type: 'firebase-admin'
      }
    },
    
    system: {
      memory: {
        used: process.memoryUsage(),
        percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
      },
      cpu: process.cpuUsage(),
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version
    },
    
    responseTime: Date.now() - startTime
  };
  
  // Determine overall health status
  const criticalServices = [health.services.database, health.services.firebase];
  const hasUnhealthyService = criticalServices.some(s => !s.healthy);
  
  if (hasUnhealthyService) {
    health.status = 'degraded';
  }
  
  const statusCode = health.status === 'operational' ? 200 : 503;
  
  res.status(statusCode).json(health);
});

export default router;
