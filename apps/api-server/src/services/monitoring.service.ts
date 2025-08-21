import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import { z } from 'zod';

/**
 * Production Monitoring Service
 * 
 * Provides comprehensive observability with:
 * - Sentry error tracking and performance monitoring
 * - Structured logging with Winston
 * - Custom metrics and traces
 * - HIPAA-compliant data scrubbing
 * - Performance profiling
 */

// Configuration schema
const MonitoringConfigSchema = z.object({
  sentry: z.object({
    dsn: z.string().url().optional(),
    environment: z.enum(['development', 'staging', 'production']),
    release: z.string().optional(),
    tracesSampleRate: z.number().min(0).max(1).default(0.1),
    profilesSampleRate: z.number().min(0).max(1).default(0.1),
    enabled: z.boolean().default(false),
  }),
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    console: z.boolean().default(true),
    file: z.boolean().default(true),
    maxFiles: z.number().default(30),
    maxSize: z.string().default('20m'),
  }),
  metrics: z.object({
    enabled: z.boolean().default(true),
    flushInterval: z.number().default(10000), // 10 seconds
  }),
});

type MonitoringConfig = z.infer<typeof MonitoringConfigSchema>;

export class MonitoringService {
  private config: MonitoringConfig;
  private logger: winston.Logger;
  private metricsBuffer: Map<string, any[]> = new Map();
  private metricsTimer?: NodeJS.Timeout;

  constructor() {
    this.config = this.loadConfig();
    this.logger = this.initializeLogger();
    this.initializeSentry();
    this.startMetricsCollection();
  }

  /**
   * Load monitoring configuration from environment
   */
  private loadConfig(): MonitoringConfig {
    return MonitoringConfigSchema.parse({
      sentry: {
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        release: process.env.APP_VERSION || process.env.npm_package_version,
        tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
        profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
        enabled: process.env.SENTRY_DSN ? true : false,
      },
      logging: {
        level: (process.env.LOG_LEVEL as any) || 'info',
        console: process.env.LOG_CONSOLE !== 'false',
        file: process.env.LOG_FILE !== 'false',
        maxFiles: parseInt(process.env.LOG_MAX_FILES || '30'),
        maxSize: process.env.LOG_MAX_SIZE || '20m',
      },
      metrics: {
        enabled: process.env.METRICS_ENABLED !== 'false',
        flushInterval: parseInt(process.env.METRICS_FLUSH_INTERVAL || '10000'),
      },
    });
  }

  /**
   * Initialize Winston logger
   */
  private initializeLogger(): winston.Logger {
    const transports: winston.transport[] = [];

    // Console transport
    if (this.config.logging.console) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
              return `${timestamp} [${level}]: ${message} ${metaStr}`;
            })
          ),
        })
      );
    }

    // File transports
    if (this.config.logging.file) {
      transports.push(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 20 * 1024 * 1024, // 20MB
          maxFiles: this.config.logging.maxFiles,
          format: winston.format.json(),
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 20 * 1024 * 1024, // 20MB
          maxFiles: this.config.logging.maxFiles,
          format: winston.format.json(),
        })
      );
    }

    return winston.createLogger({
      level: this.config.logging.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports,
      // Don't exit on uncaught errors
      exitOnError: false,
    });
  }

  /**
   * Initialize Sentry error tracking
   */
  private initializeSentry(): void {
    if (!this.config.sentry.enabled || !this.config.sentry.dsn) {
      this.logger.warn('Sentry is not configured (missing DSN)');
      return;
    }

    Sentry.init({
      dsn: this.config.sentry.dsn,
      environment: this.config.sentry.environment,
      release: this.config.sentry.release,
      tracesSampleRate: this.config.sentry.tracesSampleRate,
      profilesSampleRate: this.config.sentry.profilesSampleRate,
      
      integrations: [
        // HTTP integration
        new Sentry.Integrations.Http({ tracing: true }),
        // Express integration
        new Sentry.Integrations.Express({ app: true, router: true }),
        // Profiling
        new ProfilingIntegration(),
        // Custom integrations
        new Sentry.Integrations.OnUncaughtException({
          onFatalError: (error) => {
            this.logger.error('Fatal error caught by Sentry', undefined, error);
          },
        }),
        new Sentry.Integrations.OnUnhandledRejection({
          mode: 'warn',
        }),
      ],

      // Data scrubbing for HIPAA compliance
      beforeSend: (event, hint) => {
        // Scrub PHI from error events
        return this.scrubPHI(event);
      },

      beforeSendTransaction: (transaction) => {
        // Scrub PHI from transaction events
        return this.scrubPHI(transaction);
      },

      // Custom tags
      initialScope: {
        tags: {
          component: 'api-server',
          region: process.env.AWS_REGION || 'us-east-1',
        },
      },

      // Ignore certain errors
      ignoreErrors: [
        'NetworkError',
        'Non-Error promise rejection captured',
        /^Failed to fetch$/,
      ],

      // Custom transport options
      transportOptions: {
        maxQueueSize: 100,
        maxReqsPerSecond: 5,
      },
    });

    this.logger.info(`Sentry initialized for ${this.config.sentry.environment} environment`);
  }

  /**
   * Scrub PHI (Protected Health Information) from data
   */
  private scrubPHI<T extends Record<string, any>>(data: T): T {
    const phiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
      /\b\d{10,}\b/g, // Medical record numbers
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, // Email
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone
      /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/g, // Credit cards
    ];

    const scrubbed = JSON.parse(JSON.stringify(data));

    const scrubValue = (value: any): any => {
      if (typeof value === 'string') {
        let result = value;
        for (const pattern of phiPatterns) {
          result = result.replace(pattern, '[REDACTED]');
        }
        return result;
      }
      if (Array.isArray(value)) {
        return value.map(scrubValue);
      }
      if (value && typeof value === 'object') {
        const obj: any = {};
        for (const key in value) {
          // Scrub sensitive keys
          if (['password', 'token', 'secret', 'apiKey', 'ssn', 'dob', 'dateOfBirth'].includes(key.toLowerCase())) {
            obj[key] = '[REDACTED]';
          } else {
            obj[key] = scrubValue(value[key]);
          }
        }
        return obj;
      }
      return value;
    };

    return scrubValue(scrubbed);
  }

  /**
   * Express error handler middleware
   */
  public errorHandler() {
    return (error: Error, req: Request, res: Response, next: NextFunction) => {
      // Log error
      this.logger.error('Request error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: (req as any).requestId,
      });

      // Send to Sentry
      if (this.config.sentry.enabled) {
        Sentry.captureException(error, {
          contexts: {
            request: {
              url: req.url,
              method: req.method,
              headers: this.scrubPHI(req.headers),
              query: this.scrubPHI(req.query),
            },
          },
          user: {
            id: (req as any).user?.id,
            username: (req as any).user?.username,
          },
          tags: {
            endpoint: req.path,
            httpMethod: req.method,
          },
        });
      }

      // Send error response
      const statusCode = (error as any).statusCode || 500;
      const message = process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message;

      res.status(statusCode).json({
        error: message,
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      });
    };
  }

  /**
   * Request logging middleware
   */
  public requestLogger() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const requestId = (req as any).requestId || this.generateRequestId();
      (req as any).requestId = requestId;

      // Log request
      this.logger.info('Incoming request', {
        requestId,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      // Track response
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        this.logger.info('Request completed', {
          requestId,
          statusCode: res.statusCode,
          duration,
        });

        // Track metrics
        this.trackMetric('http_request', {
          method: req.method,
          endpoint: req.route?.path || req.path,
          statusCode: res.statusCode,
          duration,
        });

        // Track slow requests
        if (duration > 1000) {
          this.logger.warn('Slow request detected', {
            requestId,
            url: req.url,
            duration,
          });
        }
      });

      next();
    };
  }

  /**
   * Track custom metric
   */
  public trackMetric(name: string, value: any): void {
    if (!this.config.metrics.enabled) return;

    // Buffer metrics
    if (!this.metricsBuffer.has(name)) {
      this.metricsBuffer.set(name, []);
    }
    
    this.metricsBuffer.get(name)!.push({
      value,
      timestamp: Date.now(),
    });

    // Send to Sentry as custom metric
    if (this.config.sentry.enabled) {
      Sentry.metrics.increment(name, 1, {
        tags: typeof value === 'object' ? value : { value },
      });
    }
  }

  /**
   * Track performance timing
   */
  public async trackTiming<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      this.trackMetric(`timing.${operation}`, { duration, success: true });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.trackMetric(`timing.${operation}`, { duration, success: false });
      
      throw error;
    }
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    if (!this.config.metrics.enabled) return;

    this.metricsTimer = setInterval(() => {
      this.flushMetrics();
    }, this.config.metrics.flushInterval);

    this.logger.info('Metrics collection started');
  }

  /**
   * Flush buffered metrics
   */
  private flushMetrics(): void {
    if (this.metricsBuffer.size === 0) return;

    // Process buffered metrics
    for (const [name, values] of this.metricsBuffer.entries()) {
      if (values.length === 0) continue;

      // Calculate statistics
      const durations = values
        .filter(v => v.value.duration !== undefined)
        .map(v => v.value.duration);

      if (durations.length > 0) {
        const p50 = this.percentile(durations, 0.5);
        const p95 = this.percentile(durations, 0.95);
        const p99 = this.percentile(durations, 0.99);

        this.logger.info(`Metrics: ${name}`, {
          count: values.length,
          p50,
          p95,
          p99,
        });

        // Send to Sentry
        if (this.config.sentry.enabled) {
          Sentry.metrics.distribution(`${name}.p50`, p50);
          Sentry.metrics.distribution(`${name}.p95`, p95);
          Sentry.metrics.distribution(`${name}.p99`, p99);
        }
      }
    }

    // Clear buffer
    this.metricsBuffer.clear();
  }

  /**
   * Calculate percentile
   */
  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    
    return sorted[Math.max(0, index)];
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get monitoring statistics
   */
  public getStatistics(): any {
    return {
      sentry: {
        enabled: this.config.sentry.enabled,
        environment: this.config.sentry.environment,
        release: this.config.sentry.release,
      },
      logging: {
        level: this.config.logging.level,
      },
      metrics: {
        enabled: this.config.metrics.enabled,
        bufferSize: this.metricsBuffer.size,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = undefined;
    }
    
    this.flushMetrics();
    
    if (this.config.sentry.enabled) {
      Sentry.close(2000);
    }
    
    this.logger.info('Monitoring service disposed');
  }
}

// Singleton instance
let monitoringService: MonitoringService | null = null;

export function getMonitoringService(): MonitoringService {
  if (!monitoringService) {
    monitoringService = new MonitoringService();
  }
  return monitoringService;
}

// Export default instance
export default getMonitoringService();