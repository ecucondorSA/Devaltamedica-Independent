import { trace } from 'firebase/performance';
import { performance } from './config';
import { logger } from './utils/logger';
export class PerformanceMonitor {
    static instance;
    traces = new Map();
    static getInstance() {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }
    /**
     * Start monitoring a specific operation
     */
    startTrace(traceName) {
        if (!performance) {
            logger.warn('Firebase Performance not available');
            return;
        }
        try {
            const traceInstance = trace(performance, traceName);
            traceInstance.start();
            this.traces.set(traceName, traceInstance);
            logger.info(`🔍 Performance trace started: ${traceName}`, 'firebase:performance');
        }
        catch (error) {
            logger.error(`Failed to start trace ${traceName}:`, 'firebase:performance', error);
        }
    }
    /**
     * Stop monitoring an operation and record metrics
     */
    stopTrace(traceName, customMetrics) {
        const traceInstance = this.traces.get(traceName);
        if (!traceInstance) {
            logger.warn(`No trace found for: ${traceName}`);
            return;
        }
        try {
            // Add custom metrics if provided
            if (customMetrics) {
                Object.entries(customMetrics).forEach(([key, value]) => {
                    traceInstance.putMetric(key, value);
                });
            }
            traceInstance.stop();
            this.traces.delete(traceName);
            logger.info(`✅ Performance trace completed: ${traceName}`, 'firebase:performance');
        }
        catch (error) {
            logger.error(`Failed to stop trace ${traceName}:`, 'firebase:performance', error);
        }
    }
    /**
     * Monitor API calls
     */
    monitorApiCall(endpoint, method = 'GET') {
        const traceName = `api_${method.toLowerCase()}_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
        return {
            start: () => this.startTrace(traceName),
            stop: (responseTime, statusCode) => {
                const metrics = {};
                if (responseTime)
                    metrics.response_time_ms = responseTime;
                if (statusCode)
                    metrics.status_code = statusCode;
                this.stopTrace(traceName, metrics);
            },
        };
    }
    /**
     * Monitor page loads
     */
    monitorPageLoad(pageName) {
        const traceName = `page_load_${pageName}`;
        return {
            start: () => this.startTrace(traceName),
            stop: (loadTime) => {
                const metrics = {};
                if (loadTime)
                    metrics.load_time_ms = loadTime;
                this.stopTrace(traceName, metrics);
            },
        };
    }
    /**
     * Monitor Firebase operations
     */
    monitorFirebaseOperation(operation, collection) {
        const traceName = `firebase_${operation}${collection ? `_${collection}` : ''}`;
        return {
            start: () => this.startTrace(traceName),
            stop: (recordCount, errors) => {
                const metrics = {};
                if (recordCount)
                    metrics.record_count = recordCount;
                if (errors)
                    metrics.error_count = errors;
                this.stopTrace(traceName, metrics);
            },
        };
    }
    /**
     * Set custom attributes for current traces
     */
    setCustomAttribute(attribute, value) {
        this.traces.forEach((traceInstance, traceName) => {
            try {
                traceInstance.putAttribute(attribute, value);
                logger.info(`📝 Custom attribute set for ${traceName}: ${attribute}=${value}`, 'firebase:performance');
            }
            catch (error) {
                logger.error(`Failed to set attribute for ${traceName}:`, 'firebase:performance', error);
            }
        });
    }
}
// Singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
// Performance thresholds for alerts
export const PERFORMANCE_THRESHOLDS = {
    API_RESPONSE_TIME_MS: 3000,
    PAGE_LOAD_TIME_MS: 5000,
    FIREBASE_QUERY_TIME_MS: 2000,
    ERROR_RATE_THRESHOLD: 0.05, // 5%
};
export class PerformanceAnalytics {
    static metrics = [];
    static recordMetric(metric) {
        this.metrics.push(metric);
        // Keep only last 1000 metrics to prevent memory leaks
        if (this.metrics.length > 1000) {
            this.metrics = this.metrics.slice(-1000);
        }
        // Check for performance issues
        this.checkThresholds(metric);
    }
    static checkThresholds(metric) {
        const { operation, duration } = metric;
        // API response time alert
        if (operation.startsWith('api_') && duration > PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME_MS) {
            logger.warn(`⚠️ PERFORMANCE ALERT: API ${operation} took ${duration}ms (threshold: ${PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME_MS}ms)`);
        }
        // Page load time alert
        if (operation.startsWith('page_load_') && duration > PERFORMANCE_THRESHOLDS.PAGE_LOAD_TIME_MS) {
            logger.warn(`⚠️ PERFORMANCE ALERT: Page ${operation} took ${duration}ms (threshold: ${PERFORMANCE_THRESHOLDS.PAGE_LOAD_TIME_MS}ms)`);
        }
        // Firebase query time alert
        if (operation.startsWith('firebase_') &&
            duration > PERFORMANCE_THRESHOLDS.FIREBASE_QUERY_TIME_MS) {
            logger.warn(`⚠️ PERFORMANCE ALERT: Firebase ${operation} took ${duration}ms (threshold: ${PERFORMANCE_THRESHOLDS.FIREBASE_QUERY_TIME_MS}ms)`);
        }
    }
    static getMetrics(since) {
        if (!since)
            return [...this.metrics];
        return this.metrics.filter((metric) => metric.timestamp >= since);
    }
    static getAveragePerformance(operation, since) {
        const relevantMetrics = this.getMetrics(since).filter((m) => m.operation === operation);
        if (relevantMetrics.length === 0)
            return null;
        const totalDuration = relevantMetrics.reduce((sum, metric) => sum + metric.duration, 0);
        return totalDuration / relevantMetrics.length;
    }
    static getErrorRate(operation, since) {
        const relevantMetrics = this.getMetrics(since).filter((m) => m.operation === operation);
        if (relevantMetrics.length === 0)
            return 0;
        const errorCount = relevantMetrics.filter((m) => !m.success).length;
        return errorCount / relevantMetrics.length;
    }
}
export default performanceMonitor;
