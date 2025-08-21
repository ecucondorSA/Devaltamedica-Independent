import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';
import { z } from 'zod';

import { logger } from '@altamedica/shared/services/logger.service';
/**
 * Prometheus Metrics Service
 * 
 * Provides comprehensive metrics collection for:
 * - HTTP requests (duration, status codes, endpoints)
 * - WebRTC sessions (quality, duration, participants)
 * - Database operations (queries, latency)
 * - Business metrics (appointments, prescriptions)
 * - System health (memory, CPU, connections)
 * 
 * Includes p50, p95, p99 percentiles for all timing metrics
 */

// Configuration schema
const MetricsConfigSchema = z.object({
  enabled: z.boolean().default(true),
  prefix: z.string().default('altamedica'),
  defaultLabels: z.record(z.string()).default({}),
  buckets: z.object({
    http: z.array(z.number()).default([0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]),
    db: z.array(z.number()).default([0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5]),
    webrtc: z.array(z.number()).default([0.01, 0.05, 0.1, 0.5, 1, 5, 10, 30, 60]),
  }),
});

type MetricsConfig = z.infer<typeof MetricsConfigSchema>;

export class PrometheusMetricsService {
  private config: MetricsConfig;
  private register: client.Registry;
  
  // HTTP Metrics
  private httpRequestDuration: client.Histogram<string>;
  private httpRequestTotal: client.Counter<string>;
  private httpRequestsInFlight: client.Gauge<string>;
  
  // WebRTC Metrics
  private webrtcSessionDuration: client.Histogram<string>;
  private webrtcSessionsActive: client.Gauge<string>;
  private webrtcQualityScore: client.Histogram<string>;
  private webrtcPacketLoss: client.Histogram<string>;
  private webrtcJitter: client.Histogram<string>;
  private webrtcLatency: client.Histogram<string>;
  
  // Database Metrics
  private dbQueryDuration: client.Histogram<string>;
  private dbConnectionPool: client.Gauge<string>;
  private dbQueryTotal: client.Counter<string>;
  
  // Business Metrics
  private appointmentsTotal: client.Counter<string>;
  private prescriptionsTotal: client.Counter<string>;
  private telemedicineMinutes: client.Counter<string>;
  private patientExports: client.Counter<string>;
  
  // Medical Compliance Metrics
  private hipaaViolations: client.Counter<string>;
  private auditLogWrites: client.Counter<string>;
  private phiAccessTotal: client.Counter<string>;
  
  // System Metrics
  private systemMemory: client.Gauge<string>;
  private systemCpu: client.Gauge<string>;

  constructor() {
    this.config = this.loadConfig();
    this.register = new client.Registry();
    this.initializeMetrics();
    this.collectDefaultMetrics();
  }

  /**
   * Load metrics configuration
   */
  private loadConfig(): MetricsConfig {
    return MetricsConfigSchema.parse({
      enabled: process.env.METRICS_ENABLED !== 'false',
      prefix: process.env.METRICS_PREFIX || 'altamedica',
      defaultLabels: {
        environment: process.env.NODE_ENV || 'development',
        service: 'api-server',
        region: process.env.AWS_REGION || 'us-east-1',
        version: process.env.APP_VERSION || '1.0.0',
      },
      buckets: {
        http: process.env.METRICS_HTTP_BUCKETS 
          ? JSON.parse(process.env.METRICS_HTTP_BUCKETS)
          : undefined,
        db: process.env.METRICS_DB_BUCKETS
          ? JSON.parse(process.env.METRICS_DB_BUCKETS)
          : undefined,
        webrtc: process.env.METRICS_WEBRTC_BUCKETS
          ? JSON.parse(process.env.METRICS_WEBRTC_BUCKETS)
          : undefined,
      },
    });
  }

  /**
   * Initialize all metrics
   */
  private initializeMetrics(): void {
    // Set default labels
    this.register.setDefaultLabels(this.config.defaultLabels);

    // HTTP Metrics
    this.httpRequestDuration = new client.Histogram({
      name: `${this.config.prefix}_http_request_duration_seconds`,
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code', 'status_class'],
      buckets: this.config.buckets.http,
      registers: [this.register],
    });

    this.httpRequestTotal = new client.Counter({
      name: `${this.config.prefix}_http_requests_total`,
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'status_class'],
      registers: [this.register],
    });

    this.httpRequestsInFlight = new client.Gauge({
      name: `${this.config.prefix}_http_requests_in_flight`,
      help: 'Number of HTTP requests currently being processed',
      labelNames: ['method', 'route'],
      registers: [this.register],
    });

    // WebRTC Metrics
    this.webrtcSessionDuration = new client.Histogram({
      name: `${this.config.prefix}_webrtc_session_duration_seconds`,
      help: 'Duration of WebRTC sessions in seconds',
      labelNames: ['room_type', 'participant_count', 'ended_reason'],
      buckets: this.config.buckets.webrtc,
      registers: [this.register],
    });

    this.webrtcSessionsActive = new client.Gauge({
      name: `${this.config.prefix}_webrtc_sessions_active`,
      help: 'Number of active WebRTC sessions',
      labelNames: ['room_type'],
      registers: [this.register],
    });

    this.webrtcQualityScore = new client.Histogram({
      name: `${this.config.prefix}_webrtc_quality_score`,
      help: 'WebRTC session quality score (0-100)',
      labelNames: ['room_type'],
      buckets: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      registers: [this.register],
    });

    this.webrtcPacketLoss = new client.Histogram({
      name: `${this.config.prefix}_webrtc_packet_loss_percent`,
      help: 'WebRTC packet loss percentage',
      labelNames: ['media_type', 'direction'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 20],
      registers: [this.register],
    });

    this.webrtcJitter = new client.Histogram({
      name: `${this.config.prefix}_webrtc_jitter_ms`,
      help: 'WebRTC jitter in milliseconds',
      labelNames: ['media_type'],
      buckets: [1, 5, 10, 20, 50, 100, 200],
      registers: [this.register],
    });

    this.webrtcLatency = new client.Histogram({
      name: `${this.config.prefix}_webrtc_latency_ms`,
      help: 'WebRTC round-trip latency in milliseconds',
      labelNames: ['peer_location'],
      buckets: [10, 25, 50, 100, 150, 200, 300, 500, 1000],
      registers: [this.register],
    });

    // Database Metrics
    this.dbQueryDuration = new client.Histogram({
      name: `${this.config.prefix}_db_query_duration_seconds`,
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'collection', 'status'],
      buckets: this.config.buckets.db,
      registers: [this.register],
    });

    this.dbConnectionPool = new client.Gauge({
      name: `${this.config.prefix}_db_connection_pool_size`,
      help: 'Database connection pool statistics',
      labelNames: ['state'],
      registers: [this.register],
    });

    this.dbQueryTotal = new client.Counter({
      name: `${this.config.prefix}_db_queries_total`,
      help: 'Total number of database queries',
      labelNames: ['operation', 'collection', 'status'],
      registers: [this.register],
    });

    // Business Metrics
    this.appointmentsTotal = new client.Counter({
      name: `${this.config.prefix}_appointments_total`,
      help: 'Total number of appointments',
      labelNames: ['type', 'status', 'specialty'],
      registers: [this.register],
    });

    this.prescriptionsTotal = new client.Counter({
      name: `${this.config.prefix}_prescriptions_total`,
      help: 'Total number of prescriptions issued',
      labelNames: ['type', 'controlled_substance'],
      registers: [this.register],
    });

    this.telemedicineMinutes = new client.Counter({
      name: `${this.config.prefix}_telemedicine_minutes_total`,
      help: 'Total minutes of telemedicine sessions',
      labelNames: ['specialty', 'insurance_type'],
      registers: [this.register],
    });

    this.patientExports = new client.Counter({
      name: `${this.config.prefix}_patient_exports_total`,
      help: 'Total number of patient data exports',
      labelNames: ['format', 'requested_by', 'status'],
      registers: [this.register],
    });

    // Medical Compliance Metrics
    this.hipaaViolations = new client.Counter({
      name: `${this.config.prefix}_hipaa_violations_total`,
      help: 'Total number of potential HIPAA violations detected',
      labelNames: ['type', 'severity'],
      registers: [this.register],
    });

    this.auditLogWrites = new client.Counter({
      name: `${this.config.prefix}_audit_log_writes_total`,
      help: 'Total number of audit log entries written',
      labelNames: ['action', 'resource', 'result'],
      registers: [this.register],
    });

    this.phiAccessTotal = new client.Counter({
      name: `${this.config.prefix}_phi_access_total`,
      help: 'Total number of PHI access events',
      labelNames: ['resource_type', 'access_type', 'role'],
      registers: [this.register],
    });

    // System Metrics
    this.systemMemory = new client.Gauge({
      name: `${this.config.prefix}_system_memory_bytes`,
      help: 'System memory usage in bytes',
      labelNames: ['type'],
      registers: [this.register],
    });

    this.systemCpu = new client.Gauge({
      name: `${this.config.prefix}_system_cpu_usage_percent`,
      help: 'System CPU usage percentage',
      labelNames: ['core'],
      registers: [this.register],
    });

    logger.info('[Metrics] Prometheus metrics initialized');
  }

  /**
   * Collect default Node.js metrics
   */
  private collectDefaultMetrics(): void {
    client.collectDefaultMetrics({
      register: this.register,
      prefix: `${this.config.prefix}_`,
    });
  }

  /**
   * HTTP request middleware
   */
  public httpMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enabled) {
        return next();
      }

      const start = Date.now();
      const route = req.route?.path || req.path || 'unknown';
      const method = req.method;

      // Track in-flight requests
      this.httpRequestsInFlight.inc({ method, route });

      // Track response
      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const statusCode = res.statusCode.toString();
        const statusClass = `${Math.floor(res.statusCode / 100)}xx`;

        // Record metrics
        this.httpRequestDuration.observe(
          { method, route, status_code: statusCode, status_class: statusClass },
          duration
        );

        this.httpRequestTotal.inc({
          method,
          route,
          status_code: statusCode,
          status_class: statusClass,
        });

        this.httpRequestsInFlight.dec({ method, route });

        // Log slow requests (p95 threshold)
        if (duration > 1) {
          logger.warn(`[Metrics] Slow request: ${method} ${route} took ${duration}s`);
        }
      });

      next();
    };
  }

  /**
   * Track WebRTC session metrics
   */
  public trackWebRTCSession(metrics: {
    roomType: string;
    duration: number;
    participantCount: number;
    endedReason: string;
    qualityScore: number;
    packetLoss: number;
    jitter: number;
    latency: number;
  }): void {
    if (!this.config.enabled) return;

    this.webrtcSessionDuration.observe(
      {
        room_type: metrics.roomType,
        participant_count: metrics.participantCount.toString(),
        ended_reason: metrics.endedReason,
      },
      metrics.duration
    );

    this.webrtcQualityScore.observe(
      { room_type: metrics.roomType },
      metrics.qualityScore
    );

    this.webrtcPacketLoss.observe(
      { media_type: 'video', direction: 'inbound' },
      metrics.packetLoss
    );

    this.webrtcJitter.observe(
      { media_type: 'audio' },
      metrics.jitter
    );

    this.webrtcLatency.observe(
      { peer_location: 'same_region' },
      metrics.latency
    );
  }

  /**
   * Track database query metrics
   */
  public async trackDatabaseQuery<T>(
    operation: string,
    collection: string,
    fn: () => Promise<T>
  ): Promise<T> {
    if (!this.config.enabled) {
      return fn();
    }

    const start = Date.now();
    let status = 'success';

    try {
      const result = await fn();
      return result;
    } catch (error) {
      status = 'error';
      throw error;
    } finally {
      const duration = (Date.now() - start) / 1000;

      this.dbQueryDuration.observe(
        { operation, collection, status },
        duration
      );

      this.dbQueryTotal.inc({
        operation,
        collection,
        status,
      });
    }
  }

  /**
   * Track business metrics
   */
  public trackBusinessMetric(
    metric: 'appointment' | 'prescription' | 'telemedicine' | 'export',
    labels: Record<string, string>
  ): void {
    if (!this.config.enabled) return;

    switch (metric) {
      case 'appointment':
        this.appointmentsTotal.inc(labels);
        break;
      case 'prescription':
        this.prescriptionsTotal.inc(labels);
        break;
      case 'telemedicine':
        this.telemedicineMinutes.inc(labels);
        break;
      case 'export':
        this.patientExports.inc(labels);
        break;
    }
  }

  /**
   * Track compliance metrics
   */
  public trackComplianceMetric(
    type: 'violation' | 'audit' | 'phi_access',
    labels: Record<string, string>
  ): void {
    if (!this.config.enabled) return;

    switch (type) {
      case 'violation':
        this.hipaaViolations.inc(labels);
        break;
      case 'audit':
        this.auditLogWrites.inc(labels);
        break;
      case 'phi_access':
        this.phiAccessTotal.inc(labels);
        break;
    }
  }

  /**
   * Update system metrics
   */
  public updateSystemMetrics(): void {
    if (!this.config.enabled) return;

    const memUsage = process.memoryUsage();
    
    this.systemMemory.set({ type: 'rss' }, memUsage.rss);
    this.systemMemory.set({ type: 'heap_total' }, memUsage.heapTotal);
    this.systemMemory.set({ type: 'heap_used' }, memUsage.heapUsed);
    this.systemMemory.set({ type: 'external' }, memUsage.external);

    // CPU usage (simplified)
    const cpuUsage = process.cpuUsage();
    const totalCpu = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
    this.systemCpu.set({ core: 'total' }, totalCpu);
  }

  /**
   * Get metrics endpoint handler
   */
  public async getMetrics(): Promise<string> {
    // Update system metrics before returning
    this.updateSystemMetrics();
    
    return this.register.metrics();
  }

  /**
   * Get content type for metrics
   */
  public getContentType(): string {
    return this.register.contentType;
  }

  /**
   * Express route handler for /metrics endpoint
   */
  public metricsEndpoint() {
    return async (_req: Request, res: Response) => {
      try {
        res.set('Content-Type', this.getContentType());
        const metrics = await this.getMetrics();
        res.end(metrics);
      } catch (error) {
        logger.error('[Metrics] Error generating metrics:', undefined, error);
        res.status(500).json({ error: 'Failed to generate metrics' });
      }
    };
  }

  /**
   * Calculate percentiles from histogram
   */
  public async getPercentiles(metricName: string): Promise<{
    p50: number;
    p95: number;
    p99: number;
  } | null> {
    const metric = this.register.getSingleMetric(metricName);
    
    if (!metric || !(metric instanceof client.Histogram)) {
      return null;
    }

    const values = await (metric as any).get();
    
    if (!values || !values.values || values.values.length === 0) {
      return null;
    }

    // Extract quantile values
    const quantiles = values.values[0].quantiles || [];
    
    return {
      p50: quantiles.find((q: any) => q.quantile === 0.5)?.value || 0,
      p95: quantiles.find((q: any) => q.quantile === 0.95)?.value || 0,
      p99: quantiles.find((q: any) => q.quantile === 0.99)?.value || 0,
    };
  }

  /**
   * Get summary statistics
   */
  public async getSummaryStatistics(): Promise<any> {
    const httpPercentiles = await this.getPercentiles(
      `${this.config.prefix}_http_request_duration_seconds`
    );

    const dbPercentiles = await this.getPercentiles(
      `${this.config.prefix}_db_query_duration_seconds`
    );

    const webrtcPercentiles = await this.getPercentiles(
      `${this.config.prefix}_webrtc_latency_ms`
    );

    return {
      http: {
        percentiles: httpPercentiles,
        requestsInFlight: await this.httpRequestsInFlight.get(),
      },
      database: {
        percentiles: dbPercentiles,
        connectionPool: await this.dbConnectionPool.get(),
      },
      webrtc: {
        latencyPercentiles: webrtcPercentiles,
        activeSessions: await this.webrtcSessionsActive.get(),
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset all metrics
   */
  public reset(): void {
    this.register.resetMetrics();
    logger.info('[Metrics] All metrics reset');
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    this.register.clear();
    logger.info('[Metrics] Prometheus metrics service disposed');
  }
}

// Singleton instance
let prometheusMetricsService: PrometheusMetricsService | null = null;

export function getPrometheusMetricsService(): PrometheusMetricsService {
  if (!prometheusMetricsService) {
    prometheusMetricsService = new PrometheusMetricsService();
  }
  return prometheusMetricsService;
}

// Export default instance
export default getPrometheusMetricsService();