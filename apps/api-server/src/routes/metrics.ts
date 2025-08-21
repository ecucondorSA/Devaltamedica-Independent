import express from 'express';
import { getMetrics, getMetricsJson } from '../lib/metrics';

import { logger } from '@altamedica/shared/services/logger.service';
const router = express.Router();

// Prometheus metrics endpoint for scraping
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', 'text/plain').send(metrics);
  } catch (err) {
    logger.error('Error fetching metrics:', err);
    res.status(500).send('Error fetching metrics');
  }
});

// Metrics in JSON format for Grafana
router.get('/metrics-json', async (req, res) => {
  try {
    const metricsJson = await getMetricsJson();
    res.json(metricsJson);
  } catch (err) {
    logger.error('Error fetching JSON metrics:', err);
    res.status(500).send('Error fetching JSON metrics');
  }
});

export default router;

