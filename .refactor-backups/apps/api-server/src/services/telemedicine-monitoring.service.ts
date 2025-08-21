import { db } from '@/lib/firestore';
import { logger } from '@/lib/logger';
import { notificationService } from '@/notifications/UnifiedNotificationSystem';

export interface WebRTCMetrics {
  sessionId: string;
  userId: string;
  userRole: 'doctor' | 'patient';
  timestamp: Date;
  
  // Métricas de conexión
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'failed';
  iceConnectionState: string;
  connectionTime?: number; // tiempo en conectar (ms)
  
  // Métricas de video
  video?: {
    inboundRtp?: {
      packetsReceived: number;
      packetsLost: number;
      jitter: number;
      frameWidth: number;
      frameHeight: number;
      framesPerSecond: number;
      bytesReceived: number;
    };
    outboundRtp?: {
      packetsSent: number;
      packetsLost: number;
      frameWidth: number;
      frameHeight: number;
      framesPerSecond: number;
      bytesSent: number;
      targetBitrate: number;
      encoderImplementation: string;
    };
  };
  
  // Métricas de audio
  audio?: {
    inboundRtp?: {
      packetsReceived: number;
      packetsLost: number;
      jitter: number;
      audioLevel: number;
      totalAudioEnergy: number;
      bytesReceived: number;
    };
    outboundRtp?: {
      packetsSent: number;
      packetsLost: number;
      audioLevel: number;
      totalAudioEnergy: number;
      bytesSent: number;
      targetBitrate: number;
    };
  };
  
  // Métricas de red
  network?: {
    rtt?: number; // Round Trip Time
    availableIncomingBitrate?: number;
    availableOutgoingBitrate?: number;
    totalRoundTripTime?: number;
    currentRoundTripTime?: number;
  };
  
  // Calidad calculada
  qualityScore?: number; // 0-100
  qualityIssues?: string[];
}

export interface SessionQualityReport {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // segundos
  participants: {
    userId: string;
    role: 'doctor' | 'patient';
    averageQuality: number;
    connectionIssues: number;
    reconnections: number;
  }[];
  overallQuality: number;
  majorIssues: string[];
  recommendations: string[];
}

export interface QualityThresholds {
  video: {
    maxPacketLoss: number; // %
    minFrameRate: number;
    maxJitter: number; // ms
  };
  audio: {
    maxPacketLoss: number; // %
    maxJitter: number; // ms
    minAudioLevel: number;
  };
  network: {
    maxRtt: number; // ms
    minBandwidth: number; // kbps
  };
}

export class TelemedicineMonitoringService {
  private static qualityThresholds: QualityThresholds = {
    video: {
      maxPacketLoss: 5, // 5%
      minFrameRate: 15,
      maxJitter: 100, // 100ms
    },
    audio: {
      maxPacketLoss: 2, // 2%
      maxJitter: 50, // 50ms
      minAudioLevel: 0.01,
    },
    network: {
      maxRtt: 300, // 300ms
      minBandwidth: 500, // 500kbps
    },
  };

  /**
   * Registrar métricas WebRTC de una sesión
   */
  static async recordMetrics(metrics: WebRTCMetrics): Promise<void> {
    try {
      // Calcular score de calidad
      const qualityScore = this.calculateQualityScore(metrics);
      metrics.qualityScore = qualityScore;
      metrics.qualityIssues = this.identifyQualityIssues(metrics);

      // Guardar en Firestore
      await db.collection('telemedicine_metrics').add({
        ...metrics,
        timestamp: new Date(),
        createdAt: new Date(),
      });

      // Detectar problemas críticos y alertar
      if (qualityScore < 30) {
        await this.triggerQualityAlert(metrics, 'critical');
      } else if (qualityScore < 50) {
        await this.triggerQualityAlert(metrics, 'warning');
      }

      logger.info('WebRTC metrics recorded', {
        sessionId: metrics.sessionId,
        userId: metrics.userId,
        qualityScore,
        issues: metrics.qualityIssues,
      });
    } catch (error) {
      logger.error('Error recording WebRTC metrics', {
        error: error.message,
        sessionId: metrics.sessionId,
        userId: metrics.userId,
      });
    }
  }

  /**
   * Obtener métricas en tiempo real de una sesión
   */
  static async getSessionMetrics(sessionId: string): Promise<WebRTCMetrics[]> {
    try {
      const snapshot = await db
        .collection('telemedicine_metrics')
        .where('sessionId', '==', sessionId)
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as WebRTCMetrics[];
    } catch (error) {
      logger.error('Error fetching session metrics', {
        error: error.message,
        sessionId,
      });
      return [];
    }
  }

  /**
   * Generar reporte de calidad de sesión
   */
  static async generateSessionReport(sessionId: string): Promise<SessionQualityReport | null> {
    try {
      const metrics = await this.getSessionMetrics(sessionId);
      if (metrics.length === 0) return null;

      const sessionStart = new Date(Math.min(...metrics.map(m => m.timestamp.getTime())));
      const sessionEnd = new Date(Math.max(...metrics.map(m => m.timestamp.getTime())));
      const duration = Math.floor((sessionEnd.getTime() - sessionStart.getTime()) / 1000);

      // Agrupar por participante
      const participantMetrics = new Map<string, WebRTCMetrics[]>();
      metrics.forEach(metric => {
        const key = `${metric.userId}_${metric.userRole}`;
        if (!participantMetrics.has(key)) {
          participantMetrics.set(key, []);
        }
        participantMetrics.get(key)!.push(metric);
      });

      // Calcular estadísticas por participante
      const participants = Array.from(participantMetrics.entries()).map(([key, metrics]) => {
        const [userId, role] = key.split('_');
        const qualityScores = metrics.map(m => m.qualityScore || 0);
        const averageQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
        const connectionIssues = metrics.filter(m => 
          m.connectionState === 'failed' || m.connectionState === 'disconnected'
        ).length;
        const reconnections = metrics.filter(m => m.connectionState === 'connecting').length;

        return {
          userId,
          role: role as 'doctor' | 'patient',
          averageQuality,
          connectionIssues,
          reconnections,
        };
      });

      // Calidad general
      const overallQuality = participants.reduce((sum, p) => sum + p.averageQuality, 0) / participants.length;

      // Identificar problemas principales
      const majorIssues = this.identifySessionIssues(metrics);
      const recommendations = this.generateRecommendations(metrics, majorIssues);

      const report: SessionQualityReport = {
        sessionId,
        startTime: sessionStart,
        endTime: sessionEnd,
        duration,
        participants,
        overallQuality,
        majorIssues,
        recommendations,
      };

      // Guardar reporte
      await db.collection('session_quality_reports').add({
        ...report,
        createdAt: new Date(),
      });

      return report;
    } catch (error) {
      logger.error('Error generating session report', {
        error: error.message,
        sessionId,
      });
      return null;
    }
  }

  /**
   * Obtener estadísticas agregadas por período
   */
  static async getAggregatedStats(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<{
    totalSessions: number;
    averageQuality: number;
    averageDuration: number;
    commonIssues: { issue: string; frequency: number }[];
    qualityTrend: { date: string; quality: number }[];
  }> {
    try {
      let query = db
        .collection('session_quality_reports')
        .where('startTime', '>=', startDate)
        .where('startTime', '<=', endDate);

      if (userId) {
        query = query.where('participants', 'array-contains-any', [
          { userId, role: 'doctor' },
          { userId, role: 'patient' },
        ]);
      }

      const snapshot = await query.get();
      const reports = snapshot.docs.map(doc => doc.data()) as SessionQualityReport[];

      const totalSessions = reports.length;
      const averageQuality = reports.reduce((sum, r) => sum + r.overallQuality, 0) / totalSessions || 0;
      const averageDuration = reports.reduce((sum, r) => sum + (r.duration || 0), 0) / totalSessions || 0;

      // Contar problemas comunes
      const issueCount = new Map<string, number>();
      reports.forEach(report => {
        report.majorIssues.forEach(issue => {
          issueCount.set(issue, (issueCount.get(issue) || 0) + 1);
        });
      });

      const commonIssues = Array.from(issueCount.entries())
        .map(([issue, frequency]) => ({ issue, frequency }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10);

      // Tendencia de calidad por día
      const dailyQuality = new Map<string, number[]>();
      reports.forEach(report => {
        const dateKey = report.startTime.toISOString().split('T')[0];
        if (!dailyQuality.has(dateKey)) {
          dailyQuality.set(dateKey, []);
        }
        dailyQuality.get(dateKey)!.push(report.overallQuality);
      });

      const qualityTrend = Array.from(dailyQuality.entries())
        .map(([date, qualities]) => ({
          date,
          quality: qualities.reduce((a, b) => a + b, 0) / qualities.length,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        totalSessions,
        averageQuality,
        averageDuration,
        commonIssues,
        qualityTrend,
      };
    } catch (error) {
      logger.error('Error getting aggregated stats', {
        error: error.message,
        startDate,
        endDate,
        userId,
      });
      return {
        totalSessions: 0,
        averageQuality: 0,
        averageDuration: 0,
        commonIssues: [],
        qualityTrend: [],
      };
    }
  }

  /**
   * Calcular score de calidad basado en métricas
   */
  private static calculateQualityScore(metrics: WebRTCMetrics): number {
    let score = 100;
    const thresholds = this.qualityThresholds;

    // Penalizar por conexión
    if (metrics.connectionState === 'failed') score -= 50;
    if (metrics.connectionState === 'disconnected') score -= 30;
    if (metrics.connectionState === 'connecting') score -= 10;

    // Penalizar por video
    if (metrics.video?.inboundRtp) {
      const video = metrics.video.inboundRtp;
      const packetLoss = (video.packetsLost / (video.packetsReceived + video.packetsLost)) * 100;
      
      if (packetLoss > thresholds.video.maxPacketLoss) {
        score -= Math.min(20, packetLoss * 2);
      }
      
      if (video.framesPerSecond < thresholds.video.minFrameRate) {
        score -= (thresholds.video.minFrameRate - video.framesPerSecond) * 2;
      }
      
      if (video.jitter > thresholds.video.maxJitter) {
        score -= Math.min(15, (video.jitter - thresholds.video.maxJitter) / 10);
      }
    }

    // Penalizar por audio
    if (metrics.audio?.inboundRtp) {
      const audio = metrics.audio.inboundRtp;
      const packetLoss = (audio.packetsLost / (audio.packetsReceived + audio.packetsLost)) * 100;
      
      if (packetLoss > thresholds.audio.maxPacketLoss) {
        score -= Math.min(15, packetLoss * 3);
      }
      
      if (audio.jitter > thresholds.audio.maxJitter) {
        score -= Math.min(10, (audio.jitter - thresholds.audio.maxJitter) / 5);
      }

      if (audio.audioLevel < thresholds.audio.minAudioLevel) {
        score -= 10;
      }
    }

    // Penalizar por red
    if (metrics.network?.rtt && metrics.network.rtt > thresholds.network.maxRtt) {
      score -= Math.min(15, (metrics.network.rtt - thresholds.network.maxRtt) / 10);
    }

    return Math.max(0, Math.round(score));
  }

  /**
   * Identificar problemas específicos de calidad
   */
  private static identifyQualityIssues(metrics: WebRTCMetrics): string[] {
    const issues: string[] = [];
    const thresholds = this.qualityThresholds;

    if (metrics.connectionState === 'failed') {
      issues.push('Conexión fallida');
    }

    if (metrics.video?.inboundRtp) {
      const video = metrics.video.inboundRtp;
      const packetLoss = (video.packetsLost / (video.packetsReceived + video.packetsLost)) * 100;
      
      if (packetLoss > thresholds.video.maxPacketLoss) {
        issues.push(`Alta pérdida de paquetes de video: ${packetLoss.toFixed(1)}%`);
      }
      
      if (video.framesPerSecond < thresholds.video.minFrameRate) {
        issues.push(`Baja tasa de frames: ${video.framesPerSecond} fps`);
      }
      
      if (video.jitter > thresholds.video.maxJitter) {
        issues.push(`Alto jitter de video: ${video.jitter}ms`);
      }
    }

    if (metrics.audio?.inboundRtp) {
      const audio = metrics.audio.inboundRtp;
      const packetLoss = (audio.packetsLost / (audio.packetsReceived + audio.packetsLost)) * 100;
      
      if (packetLoss > thresholds.audio.maxPacketLoss) {
        issues.push(`Alta pérdida de paquetes de audio: ${packetLoss.toFixed(1)}%`);
      }
      
      if (audio.jitter > thresholds.audio.maxJitter) {
        issues.push(`Alto jitter de audio: ${audio.jitter}ms`);
      }
    }

    if (metrics.network?.rtt && metrics.network.rtt > thresholds.network.maxRtt) {
      issues.push(`Alta latencia: ${metrics.network.rtt}ms`);
    }

    return issues;
  }

  /**
   * Identificar problemas principales de una sesión
   */
  private static identifySessionIssues(metrics: WebRTCMetrics[]): string[] {
    const issues = new Set<string>();
    
    metrics.forEach(metric => {
      metric.qualityIssues?.forEach(issue => issues.add(issue));
    });

    const disconnections = metrics.filter(m => m.connectionState === 'disconnected').length;
    if (disconnections > 3) {
      issues.add(`Múltiples desconexiones: ${disconnections}`);
    }

    const lowQualityCount = metrics.filter(m => (m.qualityScore || 0) < 50).length;
    if (lowQualityCount > metrics.length * 0.3) {
      issues.add('Calidad consistentemente baja');
    }

    return Array.from(issues);
  }

  /**
   * Generar recomendaciones basadas en problemas
   */
  private static generateRecommendations(metrics: WebRTCMetrics[], issues: string[]): string[] {
    const recommendations: string[] = [];

    if (issues.some(i => i.includes('pérdida de paquetes'))) {
      recommendations.push('Verificar estabilidad de la conexión a internet');
      recommendations.push('Considerar usar conexión por cable en lugar de WiFi');
    }

    if (issues.some(i => i.includes('latencia'))) {
      recommendations.push('Verificar ancho de banda disponible');
      recommendations.push('Cerrar aplicaciones que consuman internet');
    }

    if (issues.some(i => i.includes('frames'))) {
      recommendations.push('Reducir resolución de video');
      recommendations.push('Verificar CPU y memoria disponible');
    }

    if (issues.some(i => i.includes('desconexiones'))) {
      recommendations.push('Verificar estabilidad de la red');
      recommendations.push('Considerar reiniciar router/módem');
    }

    if (issues.some(i => i.includes('audio'))) {
      recommendations.push('Verificar micrófono y altavoces');
      recommendations.push('Probar diferentes dispositivos de audio');
    }

    return recommendations;
  }

  /**
   * Disparar alerta de calidad
   */
  private static async triggerQualityAlert(
    metrics: WebRTCMetrics,
    severity: 'warning' | 'critical'
  ): Promise<void> {
    try {
      // Notificar al doctor sobre problemas de calidad
      if (metrics.userRole === 'patient') {
        await notificationService.createNotification({
          userId: metrics.userId, // Este sería el doctor
          type: 'quality_alert',
          title: severity === 'critical' 
            ? 'Problemas críticos de conexión detectados'
            : 'Degradación de calidad detectada',
          message: `Calidad de videollamada: ${metrics.qualityScore}%. Problemas: ${metrics.qualityIssues?.join(', ')}`,
          priority: severity === 'critical' ? 'high' : 'medium',
          data: {
            sessionId: metrics.sessionId,
            qualityScore: metrics.qualityScore,
            issues: metrics.qualityIssues,
          },
          channels: ['push'],
        });
      }

      logger.warn(`Quality alert triggered`, {
        severity,
        sessionId: metrics.sessionId,
        userId: metrics.userId,
        qualityScore: metrics.qualityScore,
        issues: metrics.qualityIssues,
      });
    } catch (error) {
      logger.error('Error triggering quality alert', {
        error: error.message,
        sessionId: metrics.sessionId,
        severity,
      });
    }
  }

  /**
   * Configurar umbrales de calidad personalizados
   */
  static setQualityThresholds(thresholds: Partial<QualityThresholds>): void {
    this.qualityThresholds = { ...this.qualityThresholds, ...thresholds };
  }

  /**
   * Obtener umbrales actuales
   */
  static getQualityThresholds(): QualityThresholds {
    return { ...this.qualityThresholds };
  }
}