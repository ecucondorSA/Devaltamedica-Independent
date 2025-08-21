/**
 * 📊 Prometheus Metrics Routes
 * P1 Monitoring: Expose metrics for Prometheus scraping
 */

import { Router, Request, Response } from 'express';
import { getMetrics, getMetricsJson } from '../lib/metrics';

import { logger } from '@altamedica/shared/services/logger.service';
const router = Router();

/**
 * GET /api/v1/metrics
 * Returns metrics in Prometheus format
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await getMetrics();
    
    // Set Prometheus content type
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
  } catch (error: any) {
    logger.error('[Metrics] Error getting metrics:', undefined, error);
    res.status(500).json({
      error: 'Failed to get metrics',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/metrics/json
 * Returns metrics in JSON format (for debugging)
 */
router.get('/metrics/json', async (req: Request, res: Response) => {
  try {
    const metrics = await getMetricsJson();
    res.json(metrics);
  } catch (error: any) {
    logger.error('[Metrics] Error getting JSON metrics:', undefined, error);
    res.status(500).json({
      error: 'Failed to get metrics',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/metrics/health
 * Health check for metrics service
 */
router.get('/metrics/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'metrics',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

export default router;