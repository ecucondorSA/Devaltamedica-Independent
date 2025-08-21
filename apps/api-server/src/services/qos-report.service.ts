/**
 * QoS Report Service
 * Handles Quality of Service metrics storage, analysis and reporting
 */

import { firestore } from '@/lib/firebase-admin';
import { redis } from '@/lib/redis';
import { FieldValue } from 'firebase-admin/firestore';
import { notificationService } from '@/notifications/UnifiedNotificationSystem';
import { io } from '@/lib/socket';

import { logger } from '@altamedica/shared/services/logger.service';
interface QoSMetrics {
  latency: number;
  jitter: number;
  packetLoss: number;
  bandwidth: {
    upload: number;
    download: number;
  };
  video?: {
    resolution: string;
    frameRate: number;
    bitrate: number;
    codec: string;
  };
  audio?: {
    bitrate: number;
    codec: string;
    level: number;
  };
  connection: {
    type: 'stable' | 'unstable' | 'reconnecting' | 'disconnected';
    protocol: string;
    candidateType: string;
  };
}

interface QoSReport {
  id: string;
  sessionId: string;
  doctorId: string;
  patientId: string;
  doctorName: string;
  patientName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  avgLatency: number;
  avgJitter: number;
  avgPacketLoss: number;
  avgBandwidth: {
    upload: number;
    download: number;
  };
  qualityScore: number;
  issues: string[];
}

export class QoSReportService {
  private static readonly COLLECTION = 'qos_reports';
  private static readonly METRICS_COLLECTION = 'qos_metrics';
  private static readonly CACHE_TTL = 300; // 5 minutes

  /**
   * Get QoS reports with filtering and pagination
   */
  static async getReports(params: {
    startDate?: Date;
    endDate?: Date;
    sessionId?: string;
    doctorId?: string;
    patientId?: string;
    limit: number;
    offset: number;
    sortBy: string;
    order: string;
  }): Promise<{ reports: QoSReport[]; total: number }> {
    let query = firestore.collection(this.COLLECTION).where('active', '==', true);

    if (params.doctorId) {
      query = query.where('doctorId', '==', params.doctorId);
    }
    if (params.patientId) {
      query = query.where('patientId', '==', params.patientId);
    }
    if (params.sessionId) {
      query = query.where('sessionId', '==', params.sessionId);
    }
    if (params.startDate) {
      query = query.where('startTime', '>=', params.startDate);
    }
    if (params.endDate) {
      query = query.where('endTime', '<=', params.endDate);
    }

    // Apply sorting
    query = query.orderBy(params.sortBy || 'startTime', params.order as any || 'desc');
    
    // Apply pagination
    query = query.limit(params.limit).offset(params.offset);

    const snapshot = await query.get();
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as QoSReport[];

    // Get total count
    const countSnapshot = await firestore.collection(this.COLLECTION)
      .where('active', '==', true)
      .count()
      .get();
    const total = countSnapshot.data().count;

    return { reports, total };
  }

  /**
   * Get aggregated metrics for dashboard
   */
  static async getAggregatedMetrics(params: {
    doctorId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const cacheKey = `qos:aggregated:${params.doctorId || 'all'}`;
    
    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    let query = firestore.collection(this.COLLECTION).where('active', '==', true);
    
    if (params.doctorId) {
      query = query.where('doctorId', '==', params.doctorId);
    }
    if (params.startDate) {
      query = query.where('startTime', '>=', params.startDate);
    }
    if (params.endDate) {
      query = query.where('endTime', '<=', params.endDate);
    }

    const snapshot = await query.get();
    const reports = snapshot.docs.map(doc => doc.data()) as QoSReport[];

    const aggregated = {
      totalSessions: reports.length,
      avgQualityScore: this.calculateAverage(reports.map(r => r.qualityScore)),
      avgLatency: this.calculateAverage(reports.map(r => r.avgLatency)),
      avgJitter: this.calculateAverage(reports.map(r => r.avgJitter)),
      avgPacketLoss: this.calculateAverage(reports.map(r => r.avgPacketLoss)),
      totalDuration: reports.reduce((sum, r) => sum + r.duration, 0),
      qualityDistribution: {
        excellent: reports.filter(r => r.qualityScore >= 90).length,
        good: reports.filter(r => r.qualityScore >= 70 && r.qualityScore < 90).length,
        fair: reports.filter(r => r.qualityScore >= 50 && r.qualityScore < 70).length,
        poor: reports.filter(r => r.qualityScore < 50).length
      },
      commonIssues: this.getCommonIssues(reports)
    };

    // Cache for 5 minutes
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(aggregated));

    return aggregated;
  }

  /**
   * Get session by ID
   */
  static async getSessionById(sessionId: string) {
    const doc = await firestore.collection('telemedicine_sessions').doc(sessionId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  /**
   * Get detailed QoS metrics for a session
   */
  static async getSessionQoSMetrics(sessionId: string) {
    const snapshot = await firestore.collection(this.METRICS_COLLECTION)
      .where('sessionId', '==', sessionId)
      .orderBy('timestamp', 'desc')
      .limit(1000)
      .get();

    const metrics = snapshot.docs.map(doc => doc.data()) as any[];

    return {
      avgLatency: this.calculateAverage(metrics.map(m => m.metrics.latency)),
      avgJitter: this.calculateAverage(metrics.map(m => m.metrics.jitter)),
      avgPacketLoss: this.calculateAverage(metrics.map(m => m.metrics.packetLoss)),
      minLatency: Math.min(...metrics.map(m => m.metrics.latency)),
      maxLatency: Math.max(...metrics.map(m => m.metrics.latency)),
      avgBandwidth: {
        upload: this.calculateAverage(metrics.map(m => m.metrics.bandwidth.upload)),
        download: this.calculateAverage(metrics.map(m => m.metrics.bandwidth.download))
      },
      connectionStability: this.calculateConnectionStability(metrics),
      totalMetricsCount: metrics.length
    };
  }

  /**
   * Get timeline data for charts
   */
  static async getSessionTimeline(sessionId: string) {
    const snapshot = await firestore.collection(this.METRICS_COLLECTION)
      .where('sessionId', '==', sessionId)
      .orderBy('timestamp', 'asc')
      .get();

    const metrics = snapshot.docs.map(doc => doc.data());

    // Sample data for performance (take every nth point if too many)
    const sampleRate = Math.max(1, Math.floor(metrics.length / 100));
    const sampled = metrics.filter((_, index) => index % sampleRate === 0);

    return sampled.map(m => ({
      timestamp: m.timestamp,
      latency: m.metrics.latency,
      jitter: m.metrics.jitter,
      packetLoss: m.metrics.packetLoss,
      bandwidth: m.metrics.bandwidth
    }));
  }

  /**
   * Calculate quality score based on metrics
   */
  static async calculateQualityScore(metrics: any): Promise<number> {
    // Weight factors for different metrics
    const weights = {
      latency: 0.3,
      jitter: 0.2,
      packetLoss: 0.3,
      bandwidth: 0.2
    };

    // Score components (0-100 scale)
    const latencyScore = Math.max(0, 100 - (metrics.avgLatency / 2)); // 200ms = 0 score
    const jitterScore = Math.max(0, 100 - (metrics.avgJitter * 2)); // 50ms = 0 score
    const packetLossScore = Math.max(0, 100 - (metrics.avgPacketLoss * 10)); // 10% = 0 score
    const bandwidthScore = Math.min(100, (metrics.avgBandwidth.download / 10)); // 10Mbps = 100 score

    const totalScore = 
      latencyScore * weights.latency +
      jitterScore * weights.jitter +
      packetLossScore * weights.packetLoss +
      bandwidthScore * weights.bandwidth;

    return Math.round(totalScore);
  }

  /**
   * Record metrics from active session
   */
  static async recordMetrics(data: {
    sessionId: string;
    timestamp: string;
    metrics: QoSMetrics;
    userId: string;
    userRole: string;
  }) {
    // Store in Firestore
    await firestore.collection(this.METRICS_COLLECTION).add({
      ...data,
      createdAt: FieldValue.serverTimestamp()
    });

    // Also store in Redis for real-time access
    const redisKey = `qos:realtime:${data.sessionId}`;
    await redis.setex(redisKey, 60, JSON.stringify(data.metrics));

    return true;
  }

  /**
   * Analyze quality and determine if alert is needed
   */
  static async analyzeQuality(metrics: QoSMetrics) {
    const issues = [];
    let severity: 'low' | 'medium' | 'high' = 'low';

    if (metrics.latency > 200) {
      issues.push('High latency detected');
      severity = 'high';
    }
    if (metrics.jitter > 50) {
      issues.push('High jitter affecting stability');
      severity = severity === 'high' ? 'high' : 'medium';
    }
    if (metrics.packetLoss > 5) {
      issues.push('Significant packet loss');
      severity = 'high';
    }
    if (metrics.connection.type === 'unstable' || metrics.connection.type === 'reconnecting') {
      issues.push('Connection instability');
      severity = severity === 'high' ? 'high' : 'medium';
    }

    return {
      needsAlert: issues.length > 0 && severity !== 'low',
      issue: issues.join(', '),
      severity,
      recommendations: this.getRecommendations(metrics)
    };
  }

  /**
   * Send quality alert
   */
  static async sendQualityAlert(data: {
    sessionId: string;
    issue: string;
    severity: string;
    metrics: QoSMetrics;
    doctorId?: string;
    patientId?: string;
  }) {
    // Store alert in database
    const alertRef = await firestore.collection('qos_alerts').add({
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      resolved: false
    });

    const alertId = alertRef.id;

    try {
      // Send real-time notification via WebSocket
      if (io) {
        // Emit to doctor's room
        if (data.doctorId) {
          io.to(`user:${data.doctorId}`).emit('qos:alert', {
            alertId,
            sessionId: data.sessionId,
            issue: data.issue,
            severity: data.severity,
            metrics: data.metrics,
            timestamp: new Date()
          });
        }

        // Emit to admin room for monitoring
        io.to('admin:monitoring').emit('qos:alert', {
          alertId,
          sessionId: data.sessionId,
          issue: data.issue,
          severity: data.severity,
          metrics: data.metrics,
          doctorId: data.doctorId,
          patientId: data.patientId,
          timestamp: new Date()
        });
      }

      // Send email notification if severity is high
      if (data.severity === 'high' || data.severity === 'critical') {
        // Get session details for context
        const sessionDoc = await firestore.collection('telemedicine_sessions')
          .doc(data.sessionId)
          .get();
        
        const sessionData = sessionDoc.exists ? sessionDoc.data() : null;

        // Send notification to doctor
        if (data.doctorId) {
          await notificationService.createNotification({
            userId: data.doctorId,
            type: 'system_alert',
            priority: data.severity === 'critical' ? 'urgent' : 'high',
            title: 'Alerta de Calidad en Videollamada',
            message: `Se detectó ${data.issue} en la sesión actual. Latencia: ${data.metrics.latency}ms, Pérdida de paquetes: ${data.metrics.packetLoss}%`,
            data: {
              alertId,
              sessionId: data.sessionId,
              issue: data.issue,
              severity: data.severity,
              metrics: data.metrics
            },
            channels: data.severity === 'critical' ? ['push', 'email', 'in_app'] : ['push', 'in_app']
          });
        }

        // Send notification to patient with user-friendly message
        if (data.patientId) {
          await notificationService.createNotification({
            userId: data.patientId,
            type: 'system_alert',
            priority: 'medium',
            title: 'Problema de Conexión Detectado',
            message: 'Estamos experimentando problemas de conexión. El doctor ha sido notificado.',
            data: {
              sessionId: data.sessionId,
              severity: data.severity
            },
            channels: ['push', 'in_app']
          });
        }

        // Send email to technical support for critical issues
        if (data.severity === 'critical') {
          await notificationService.createNotificationFromTemplate(
            'technical_alert',
            'support@altamedica.com',
            {
              alertId,
              sessionId: data.sessionId,
              issue: data.issue,
              metrics: data.metrics,
              doctorId: data.doctorId,
              patientId: data.patientId,
              sessionData: sessionData || {}
            }
          );
        }
      } else {
        // For low/medium severity, just send in-app notification
        if (data.doctorId) {
          await notificationService.createNotification({
            userId: data.doctorId,
            type: 'info',
            priority: 'low',
            title: 'Calidad de Conexión',
            message: `${data.issue} detectado. La calidad puede verse afectada.`,
            data: {
              sessionId: data.sessionId,
              metrics: data.metrics
            },
            channels: ['in_app']
          });
        }
      }
    } catch (error) {
      logger.error('[QoS Alert] Error sending notifications:', undefined, error);
      // Don't throw - alert was stored, notifications are best-effort
    }

    return true;
  }

  /**
   * Get real-time metrics from Redis
   */
  static async getRealtimeMetrics(sessionId: string) {
    const redisKey = `qos:realtime:${sessionId}`;
    const data = await redis.get(redisKey);
    return data ? JSON.parse(data) : null;
  }

  // Helper methods
  private static calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private static calculateConnectionStability(metrics: any[]): number {
    const stableCount = metrics.filter(m => m.metrics.connection.type === 'stable').length;
    return (stableCount / metrics.length) * 100;
  }

  private static getCommonIssues(reports: QoSReport[]): string[] {
    const issueCount: Record<string, number> = {};
    
    reports.forEach(report => {
      report.issues?.forEach(issue => {
        issueCount[issue] = (issueCount[issue] || 0) + 1;
      });
    });

    return Object.entries(issueCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue]) => issue);
  }

  private static getRecommendations(metrics: QoSMetrics): string[] {
    const recommendations = [];

    if (metrics.latency > 150) {
      recommendations.push('Consider switching to a wired connection');
    }
    if (metrics.packetLoss > 2) {
      recommendations.push('Check network congestion and close bandwidth-heavy applications');
    }
    if (metrics.bandwidth.upload < 1) {
      recommendations.push('Minimum 1 Mbps upload speed recommended for video calls');
    }

    return recommendations;
  }
}