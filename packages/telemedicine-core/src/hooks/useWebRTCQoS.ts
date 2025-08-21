/**
 * GAP-009: Hook para monitoreo de QoS en tiempo real
 *
 * Proporciona acceso fácil al servicio de QoS y sus métricas
 * para componentes React de telemedicina.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { QoSAlert, QoSMetrics, qosService } from '../qos/webrtc-qos.service';

// TODO: Re-enable when shared package is built
// import { logger } from '@altamedica/shared/services/logger.service';
export interface UseWebRTCQoSOptions {
  sessionId: string;
  peerConnection?: RTCPeerConnection | null;
  monitoringInterval?: number;
  autoStart?: boolean;
}

export interface UseWebRTCQoSReturn {
  // Current metrics
  metrics: QoSMetrics | null;

  // History
  metricsHistory: QoSMetrics[];

  // Aggregated data
  averageMetrics: Partial<QoSMetrics> | null;

  // Quality indicators
  qualityScore: number;
  qualityLevel: 'excellent' | 'good' | 'fair' | 'poor' | null;

  // Alerts
  alerts: QoSAlert[];
  hasWarnings: boolean;
  hasCriticalIssues: boolean;

  // Control functions
  startMonitoring: () => void;
  stopMonitoring: () => void;
  isMonitoring: boolean;

  // Report generation
  generateReport: () => {
    summary: Partial<QoSMetrics>;
    qualityPercentages: {
      excellent: number;
      good: number;
      fair: number;
      poor: number;
    };
    issues: string[];
    recommendations: string[];
  } | null;
}

/**
 * Hook para monitoreo de calidad WebRTC
 */
export function useWebRTCQoS({
  sessionId,
  peerConnection,
  monitoringInterval = 1000,
  autoStart = true,
}: UseWebRTCQoSOptions): UseWebRTCQoSReturn {
  const [metrics, setMetrics] = useState<QoSMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<QoSMetrics[]>([]);
  const [alerts, setAlerts] = useState<QoSAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const alertsRef = useRef<QoSAlert[]>([]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (!peerConnection || !sessionId) {
      // logger.warn('Cannot start QoS monitoring: missing peerConnection or sessionId');
      return;
    }

    setIsMonitoring(true);
    qosService.startMonitoring(sessionId, peerConnection, monitoringInterval);
  }, [sessionId, peerConnection, monitoringInterval]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (sessionId) {
      qosService.stopMonitoring(sessionId);
      setIsMonitoring(false);
    }
  }, [sessionId]);

  // Subscribe to metrics events
  useEffect(() => {
    if (!sessionId) return;

    const handleMetrics = ({ metrics: newMetrics }: { sessionId: string; metrics: QoSMetrics }) => {
      setMetrics(newMetrics);
      setMetricsHistory(qosService.getMetricsHistory(sessionId));
    };

    const handleAlerts = ({ alerts: newAlerts }: { sessionId: string; alerts: QoSAlert[] }) => {
      alertsRef.current = [...alertsRef.current, ...newAlerts].slice(-50); // Keep last 50 alerts
      setAlerts([...alertsRef.current]);
    };

    qosService.on('metrics', handleMetrics);
    qosService.on('alerts', handleAlerts);

    return () => {
      qosService.off('metrics', handleMetrics);
      qosService.off('alerts', handleAlerts);
    };
  }, [sessionId]);

  // Auto-start monitoring when peerConnection is available
  useEffect(() => {
    if (autoStart && peerConnection && sessionId && !isMonitoring) {
      startMonitoring();
    }

    return () => {
      if (isMonitoring) {
        stopMonitoring();
      }
    };
  }, [autoStart, peerConnection, sessionId, isMonitoring, startMonitoring, stopMonitoring]);

  // Get average metrics
  const averageMetrics = sessionId ? qosService.getAverageMetrics(sessionId) : null;

  // Calculate quality indicators
  const qualityScore = metrics?.qualityScore || 0;
  const qualityLevel = metrics?.qualityLevel || null;

  // Check for warnings and critical issues
  const hasWarnings = alerts.some((a: QoSAlert) => a.type === 'warning');
  const hasCriticalIssues = alerts.some((a: QoSAlert) => a.type === 'critical');

  // Generate report
  const generateReport = useCallback(() => {
    if (!sessionId) return null;
    return qosService.generateQualityReport(sessionId);
  }, [sessionId]);

  return {
    metrics,
    metricsHistory,
    averageMetrics,
    qualityScore,
    qualityLevel,
    alerts,
    hasWarnings,
    hasCriticalIssues,
    startMonitoring,
    stopMonitoring,
    isMonitoring,
    generateReport,
  };
}

/**
 * Hook para mostrar indicadores visuales de calidad
 */
export function useQoSIndicators(metrics: QoSMetrics | null) {
  const getLatencyIndicator = () => {
    if (!metrics) return { color: 'gray', label: 'No data' };
    if (metrics.latency < 50) return { color: 'green', label: 'Excellent' };
    if (metrics.latency < 100) return { color: 'yellow', label: 'Good' };
    if (metrics.latency < 200) return { color: 'orange', label: 'Fair' };
    return { color: 'red', label: 'Poor' };
  };

  const getPacketLossIndicator = () => {
    if (!metrics) return { color: 'gray', label: 'No data' };
    if (metrics.packetLoss < 0.5) return { color: 'green', label: 'Excellent' };
    if (metrics.packetLoss < 1) return { color: 'yellow', label: 'Good' };
    if (metrics.packetLoss < 3) return { color: 'orange', label: 'Fair' };
    return { color: 'red', label: 'Poor' };
  };

  const getBandwidthIndicator = () => {
    if (!metrics) return { color: 'gray', label: 'No data' };
    const minBw = Math.min(metrics.bandwidth.upload, metrics.bandwidth.download);
    if (minBw > 1000) return { color: 'green', label: 'HD Ready' };
    if (minBw > 500) return { color: 'yellow', label: 'SD Quality' };
    if (minBw > 250) return { color: 'orange', label: 'Low Quality' };
    return { color: 'red', label: 'Insufficient' };
  };

  const getOverallIndicator = () => {
    if (!metrics) return { color: 'gray', label: 'No data', icon: '⚪' };
    switch (metrics.qualityLevel) {
      case 'excellent':
        return { color: 'green', label: 'Excellent', icon: '🟢' };
      case 'good':
        return { color: 'yellow', label: 'Good', icon: '🟡' };
      case 'fair':
        return { color: 'orange', label: 'Fair', icon: '🟠' };
      case 'poor':
        return { color: 'red', label: 'Poor', icon: '🔴' };
      default:
        return { color: 'gray', label: 'Unknown', icon: '⚪' };
    }
  };

  return {
    latency: getLatencyIndicator(),
    packetLoss: getPacketLossIndicator(),
    bandwidth: getBandwidthIndicator(),
    overall: getOverallIndicator(),
  };
}
