import { logger } from '@altamedica/shared';
import client from 'prom-client';
// import logger from '@/lib/response-helpers/logger';

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'altamedica-api-server',
  version: process.env.APP_VERSION || '1.0.0',
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Custom metrics for medical application
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register],
});

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const medicalOperationsTotal = new client.Counter({
  name: 'medical_operations_total',
  help: 'Total number of medical operations',
  labelNames: ['operation_type', 'status'],
  registers: [register],
});

export const phiAccessTotal = new client.Counter({
  name: 'phi_access_total',
  help: 'Total number of PHI (Protected Health Information) accesses',
  labelNames: ['user_type', 'operation'],
  registers: [register],
});

export const appointmentsTotal = new client.Counter({
  name: 'appointments_total',
  help: 'Total number of appointments',
  labelNames: ['status', 'type'],
  registers: [register],
});

export const telemedicineSessionsTotal = new client.Counter({
  name: 'telemedicine_sessions_total',
  help: 'Total number of telemedicine sessions',
  labelNames: ['status'],
  registers: [register],
});

export const telemedicineSessionDuration = new client.Histogram({
  name: 'telemedicine_session_duration_minutes',
  help: 'Duration of telemedicine sessions in minutes',
  buckets: [5, 10, 15, 30, 45, 60, 90, 120],
  registers: [register],
});

export const databaseQueryDuration = new client.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type'],
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
  registers: [register],
});

export const activeUsers = new client.Gauge({
  name: 'active_users_current',
  help: 'Current number of active users',
  labelNames: ['user_type'],
  registers: [register],
});

export const memoryUsage = new client.Gauge({
  name: 'nodejs_memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['type'],
  registers: [register],
});

// Medical compliance metrics
export const complianceViolations = new client.Counter({
  name: 'compliance_violations_total',
  help: 'Total number of compliance violations',
  labelNames: ['violation_type', 'severity'],
  registers: [register],
});

export const auditLogEntries = new client.Counter({
  name: 'audit_log_entries_total',
  help: 'Total number of audit log entries',
  labelNames: ['category', 'level'],
  registers: [register],
});

// Helper functions for common operations
export const recordHttpRequest = (method: string, route: string, statusCode: number, duration: number) => {
  httpRequestsTotal.labels(method, route, statusCode.toString()).inc();
  httpRequestDuration.labels(method, route, statusCode.toString()).observe(duration);
};

export const recordMedicalOperation = (operationType: string, status: 'success' | 'error') => {
  medicalOperationsTotal.labels(operationType, status).inc();
};

export const recordPhiAccess = (userType: string, operation: string) => {
  phiAccessTotal.labels(userType, operation).inc();
  auditLogEntries.labels('phi_access', 'info').inc();
};

export const recordAppointment = (status: 'created' | 'completed' | 'cancelled', type: 'in_person' | 'telemedicine') => {
  appointmentsTotal.labels(status, type).inc();
};

export const recordTelemedicineSession = (status: 'started' | 'ended' | 'failed', duration?: number) => {
  telemedicineSessionsTotal.labels(status).inc();
  if (duration && status === 'ended') {
    telemedicineSessionDuration.observe(duration);
  }
};

export const recordDatabaseQuery = (queryType: string, duration: number) => {
  databaseQueryDuration.labels(queryType).observe(duration);
};

export const updateActiveUsers = (userType: string, count: number) => {
  activeUsers.labels(userType).set(count);
};

export const recordComplianceViolation = (violationType: string, severity: 'low' | 'medium' | 'high' | 'critical') => {
  complianceViolations.labels(violationType, severity).inc();
  logger.warn(
    `Compliance violation recorded: ${violationType} (${severity})`,
    undefined,
    {
      type: 'compliance_violation',
      violationType,
      severity,
    }
  );
};

// Update memory usage metrics
const updateMemoryUsage = () => {
  const memUsage = process.memoryUsage();
  memoryUsage.labels('rss').set(memUsage.rss);
  memoryUsage.labels('heapTotal').set(memUsage.heapTotal);
  memoryUsage.labels('heapUsed').set(memUsage.heapUsed);
  memoryUsage.labels('external').set(memUsage.external);
};

// Update memory usage every 30 seconds
setInterval(updateMemoryUsage, 30000);

/**
 * Get metrics in Prometheus format
 */
export const getMetrics = async (): Promise<string> => {
  return register.metrics();
};

/**
 * Get metrics in JSON format for Grafana
 */
export const getMetricsJson = async (): Promise<any> => {
  const metrics = await register.getMetricsAsJSON();
  return metrics;
};

/**
 * Clear all metrics (useful for testing)
 */
export const clearMetrics = () => {
  register.clear();
};

export { register };
export default register;
