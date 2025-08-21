/**
 * GAP-009: WebRTC Quality of Service (QoS) Metrics Service
 * 
 * Monitorea y reporta métricas de calidad en tiempo real para videollamadas médicas:
 * - Latencia (RTT)
 * - Jitter
 * - Packet loss
 * - Bandwidth
 * - Frame rate
 * - Resolution
 * 
 * Cumple con estándares médicos para telemedicina de alta calidad.
 */

import { EventEmitter } from 'events';

// TODO: Re-enable when shared package is built
// // Simple logger implementation to avoid circular dependencies
const logger = {
  info: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(message, data);
    }
  },
  warn: (message, data) => {
    if (typeof console !== 'undefined') {
      console.warn(message, data);
    }
  },
  error: (message, data) => {
    if (typeof console !== 'undefined') {
      console.error(message, data);
    }
  },
  debug: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.debug(message, data);
    }
  }
};
export interface QoSMetrics {
  // Network metrics
  latency: number;           // RTT en ms
  jitter: number;           // Variación de latencia en ms
  packetLoss: number;       // Porcentaje de pérdida de paquetes
  bandwidth: {
    upload: number;         // kbps
    download: number;       // kbps
  };
  
  // Video metrics
  video: {
    frameRate: number;      // FPS
    resolution: {
      width: number;
      height: number;
    };
    bitrate: number;        // kbps
    codec: string;
  bytesReceived?: number; // raw bytes (para delta interno)
  };
  
  // Audio metrics
  audio: {
    bitrate: number;        // kbps
    codec: string;
    level: number;          // 0-1
    echoReturnLoss: number; // dB
  bytesReceived?: number; // raw bytes (para delta interno)
  };
  
  // Overall quality score
  qualityScore: number;     // 0-100
  qualityLevel: 'excellent' | 'good' | 'fair' | 'poor';
  
  // Timestamps
  timestamp: Date;
  sessionId: string;
}

export interface QoSThresholds {
  excellent: {
    latency: number;      // <50ms
    jitter: number;       // <10ms
    packetLoss: number;   // <0.5%
    minBandwidth: number; // >1000kbps
  };
  good: {
    latency: number;      // <100ms
    jitter: number;       // <20ms
    packetLoss: number;   // <1%
    minBandwidth: number; // >500kbps
  };
  fair: {
    latency: number;      // <200ms
    jitter: number;       // <50ms
    packetLoss: number;   // <3%
    minBandwidth: number; // >250kbps
  };
  // Anything worse is 'poor'
}

export interface QoSAlert {
  type: 'warning' | 'critical';
  metric: keyof QoSMetrics;
  value: number;
  threshold: number;
  message: string;
  timestamp: Date;
}

const DEFAULT_THRESHOLDS: QoSThresholds = {
  excellent: {
    latency: 50,
    jitter: 10,
    packetLoss: 0.5,
    minBandwidth: 1000
  },
  good: {
    latency: 100,
    jitter: 20,
    packetLoss: 1,
    minBandwidth: 500
  },
  fair: {
    latency: 200,
    jitter: 50,
    packetLoss: 3,
    minBandwidth: 250
  }
};

export class WebRTCQoSService extends EventEmitter {
  private metrics: Map<string, QoSMetrics[]> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private readonly MAX_HISTORY = 100; // Keep last 100 measurements per session

  constructor(private thresholds: QoSThresholds = DEFAULT_THRESHOLDS) {
    super();
  }

  /**
   * Start monitoring QoS for a peer connection
   */
  async startMonitoring(
    sessionId: string,
    peerConnection: RTCPeerConnection,
    intervalMs: number = 1000
  ): Promise<void> {
    // Clear any existing monitoring for this session
    this.stopMonitoring(sessionId);

    const interval = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics(sessionId, peerConnection);
        this.recordMetrics(sessionId, metrics);
        
        // Check for quality issues
        this.checkThresholds(metrics);
        
        // Emit metrics event
        this.emit('metrics', { sessionId, metrics });
      } catch (error) {
        // logger.error(`Error collecting QoS metrics for session ${sessionId}:`, error);
      }
    }, intervalMs);

    this.intervals.set(sessionId, interval);
  }

  /**
   * Stop monitoring QoS for a session
   */
  stopMonitoring(sessionId: string): void {
    const interval = this.intervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(sessionId);
    }
  }

  /**
   * Collect current metrics from peer connection
   */
  private async collectMetrics(
    sessionId: string,
    peerConnection: RTCPeerConnection
  ): Promise<QoSMetrics> {
    const stats = await peerConnection.getStats();
    
    let latency = 0;
    let jitter = 0;
    let packetLoss = 0;
    let uploadBandwidth = 0;
    let downloadBandwidth = 0;
    let videoFrameRate = 0;
    let videoWidth = 0;
    let videoHeight = 0;
    let videoBitrate = 0;
    let videoCodec = '';
    let audioBitrate = 0;
    let audioCodec = '';
    let audioLevel = 0;
    let echoReturnLoss = 0;

  stats.forEach((report: any) => {
      // Collect RTT (latency)
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        latency = report.currentRoundTripTime ? report.currentRoundTripTime * 1000 : latency;
      }

      // Collect inbound RTP stats (receiving)
      if (report.type === 'inbound-rtp') {
        if (report.mediaType === 'video') {
          videoFrameRate = report.framesPerSecond || videoFrameRate;
          videoWidth = report.frameWidth || videoWidth;
          videoHeight = report.frameHeight || videoHeight;
          
          // Calculate packet loss
          const packetsLost = report.packetsLost || 0;
          const packetsReceived = report.packetsReceived || 0;
          if (packetsReceived > 0) {
            packetLoss = (packetsLost / (packetsLost + packetsReceived)) * 100;
          }
          
          // Calculate jitter
          jitter = report.jitter ? report.jitter * 1000 : jitter;
          
          // Bitrate calculation
          if (typeof report.bytesReceived === 'number' && report.timestamp) {
            const prevMetrics = this.getPreviousMetrics(sessionId);
            if (prevMetrics && prevMetrics.video?.bytesReceived && prevMetrics.timestamp) {
              const timeDiff = (report.timestamp - prevMetrics.timestamp.getTime()) / 1000;
              const byteDelta = report.bytesReceived - prevMetrics.video.bytesReceived;
              if (timeDiff > 0 && byteDelta >= 0) {
                videoBitrate = (byteDelta * 8) / timeDiff / 1000; // kbps
              }
            }
            // Guardamos bytesReceived actuales para próximo delta
            videoBitrate = Number.isFinite(videoBitrate) ? videoBitrate : 0;
            if (!Number.isFinite(videoBitrate) || videoBitrate < 0) videoBitrate = 0;
            // store in temp var for final object (we'll attach bytesReceived there)
            videoWidth = report.frameWidth || videoWidth;
            videoHeight = report.frameHeight || videoHeight;
          }
        }
        
        if (report.mediaType === 'audio') {
          audioLevel = report.audioLevel || audioLevel;
          
          // Audio bitrate
          if (typeof report.bytesReceived === 'number' && report.timestamp) {
            const prevMetrics = this.getPreviousMetrics(sessionId);
            if (prevMetrics && prevMetrics.audio?.bytesReceived && prevMetrics.timestamp) {
              const timeDiff = (report.timestamp - prevMetrics.timestamp.getTime()) / 1000;
              const byteDelta = report.bytesReceived - prevMetrics.audio.bytesReceived;
              if (timeDiff > 0 && byteDelta >= 0) {
                audioBitrate = (byteDelta * 8) / timeDiff / 1000; // kbps
              }
            }
            audioBitrate = Number.isFinite(audioBitrate) && audioBitrate >= 0 ? audioBitrate : 0;
          }
        }
      }

      // Collect outbound RTP stats (sending)
      if (report.type === 'outbound-rtp') {
        if (report.mediaType === 'video') {
          videoCodec = report.codecId || videoCodec;
        }
        if (report.mediaType === 'audio') {
          audioCodec = report.codecId || audioCodec;
          echoReturnLoss = report.echoReturnLoss || echoReturnLoss;
        }
      }

      // Bandwidth estimation
      if (report.type === 'transport') {
        uploadBandwidth = report.availableOutgoingBitrate ? report.availableOutgoingBitrate / 1000 : uploadBandwidth;
        downloadBandwidth = report.availableIncomingBitrate ? report.availableIncomingBitrate / 1000 : downloadBandwidth;
      }
    });

    // Calculate quality score
    const qualityScore = this.calculateQualityScore({
      latency,
      jitter,
      packetLoss,
      bandwidth: { upload: uploadBandwidth, download: downloadBandwidth }
    });

    const qualityLevel = this.determineQualityLevel(qualityScore);

    return {
      latency,
      jitter,
      packetLoss,
      bandwidth: {
        upload: uploadBandwidth,
        download: downloadBandwidth
      },
      video: {
        frameRate: videoFrameRate,
        resolution: {
          width: videoWidth,
          height: videoHeight
        },
        bitrate: videoBitrate,
  codec: videoCodec,
  bytesReceived: typeof (stats as any).videoBytesReceived === 'number' ? (stats as any).videoBytesReceived : undefined
      },
      audio: {
        bitrate: audioBitrate,
        codec: audioCodec,
        level: audioLevel,
  echoReturnLoss,
  bytesReceived: undefined
      },
      qualityScore,
      qualityLevel,
      timestamp: new Date(),
      sessionId
    };
  }

  /**
   * Calculate overall quality score (0-100)
   */
  private calculateQualityScore(metrics: {
    latency: number;
    jitter: number;
    packetLoss: number;
    bandwidth: { upload: number; download: number };
  }): number {
    let score = 100;

    // Latency impact (0-30 points)
    if (metrics.latency <= this.thresholds.excellent.latency) {
      score -= 0;
    } else if (metrics.latency <= this.thresholds.good.latency) {
      score -= 10;
    } else if (metrics.latency <= this.thresholds.fair.latency) {
      score -= 20;
    } else {
      score -= 30;
    }

    // Jitter impact (0-20 points)
    if (metrics.jitter <= this.thresholds.excellent.jitter) {
      score -= 0;
    } else if (metrics.jitter <= this.thresholds.good.jitter) {
      score -= 7;
    } else if (metrics.jitter <= this.thresholds.fair.jitter) {
      score -= 14;
    } else {
      score -= 20;
    }

    // Packet loss impact (0-30 points)
    if (metrics.packetLoss <= this.thresholds.excellent.packetLoss) {
      score -= 0;
    } else if (metrics.packetLoss <= this.thresholds.good.packetLoss) {
      score -= 10;
    } else if (metrics.packetLoss <= this.thresholds.fair.packetLoss) {
      score -= 20;
    } else {
      score -= 30;
    }

    // Bandwidth impact (0-20 points)
    const minBandwidth = Math.min(metrics.bandwidth.upload, metrics.bandwidth.download);
    if (minBandwidth >= this.thresholds.excellent.minBandwidth) {
      score -= 0;
    } else if (minBandwidth >= this.thresholds.good.minBandwidth) {
      score -= 7;
    } else if (minBandwidth >= this.thresholds.fair.minBandwidth) {
      score -= 14;
    } else {
      score -= 20;
    }

    return Math.max(0, score);
  }

  /**
   * Determine quality level based on score
   */
  private determineQualityLevel(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  /**
   * Check metrics against thresholds and emit alerts
   */
  private checkThresholds(metrics: QoSMetrics): void {
    const alerts: QoSAlert[] = [];

    // Check latency
    if (metrics.latency > this.thresholds.fair.latency) {
      alerts.push({
        type: 'critical',
        metric: 'latency',
        value: metrics.latency,
        threshold: this.thresholds.fair.latency,
        message: `High latency detected: ${metrics.latency}ms`,
        timestamp: new Date()
      });
    } else if (metrics.latency > this.thresholds.good.latency) {
      alerts.push({
        type: 'warning',
        metric: 'latency',
        value: metrics.latency,
        threshold: this.thresholds.good.latency,
        message: `Moderate latency: ${metrics.latency}ms`,
        timestamp: new Date()
      });
    }

    // Check packet loss
    if (metrics.packetLoss > this.thresholds.fair.packetLoss) {
      alerts.push({
        type: 'critical',
        metric: 'packetLoss',
        value: metrics.packetLoss,
        threshold: this.thresholds.fair.packetLoss,
        message: `High packet loss: ${metrics.packetLoss.toFixed(2)}%`,
        timestamp: new Date()
      });
    }

    // Emit alerts
    if (alerts.length > 0) {
      this.emit('alerts', { sessionId: metrics.sessionId, alerts });
    }
  }

  /**
   * Record metrics for historical analysis
   */
  private recordMetrics(sessionId: string, metrics: QoSMetrics): void {
    const history = this.metrics.get(sessionId) || [];
    history.push(metrics);
    
    // Keep only last N measurements
    if (history.length > this.MAX_HISTORY) {
      history.shift();
    }
    
    this.metrics.set(sessionId, history);
  }

  /**
   * Get previous metrics for a session
   */
  private getPreviousMetrics(sessionId: string): QoSMetrics | undefined {
    const history = this.metrics.get(sessionId);
    return history && history.length > 0 ? history[history.length - 1] : undefined;
  }

  /**
   * Get metrics history for a session
   */
  getMetricsHistory(sessionId: string): QoSMetrics[] {
    return this.metrics.get(sessionId) || [];
  }

  /**
   * Get average metrics for a session
   */
  getAverageMetrics(sessionId: string): Partial<QoSMetrics> | null {
    const history = this.metrics.get(sessionId);
    if (!history || history.length === 0) return null;

    const sum = history.reduce((acc, m) => ({
      latency: acc.latency + m.latency,
      jitter: acc.jitter + m.jitter,
      packetLoss: acc.packetLoss + m.packetLoss,
      uploadBandwidth: acc.uploadBandwidth + m.bandwidth.upload,
      downloadBandwidth: acc.downloadBandwidth + m.bandwidth.download,
      qualityScore: acc.qualityScore + m.qualityScore
    }), {
      latency: 0,
      jitter: 0,
      packetLoss: 0,
      uploadBandwidth: 0,
      downloadBandwidth: 0,
      qualityScore: 0
    });

    const count = history.length;
    return {
      latency: sum.latency / count,
      jitter: sum.jitter / count,
      packetLoss: sum.packetLoss / count,
      bandwidth: {
        upload: sum.uploadBandwidth / count,
        download: sum.downloadBandwidth / count
      },
      qualityScore: sum.qualityScore / count
    };
  }

  /**
   * Get quality report for medical records
   */
  generateQualityReport(sessionId: string): {
    summary: Partial<QoSMetrics>;
    qualityPercentages: {
      excellent: number;
      good: number;
      fair: number;
      poor: number;
    };
    issues: string[];
    recommendations: string[];
  } | null {
    const history = this.metrics.get(sessionId);
    if (!history || history.length === 0) return null;

    const avgMetrics = this.getAverageMetrics(sessionId);
    if (!avgMetrics) return null;

    // Calculate quality distribution
    const qualityCounts = { excellent: 0, good: 0, fair: 0, poor: 0 };
    history.forEach(m => {
      qualityCounts[m.qualityLevel]++;
    });

    const total = history.length;
    const qualityPercentages = {
      excellent: (qualityCounts.excellent / total) * 100,
      good: (qualityCounts.good / total) * 100,
      fair: (qualityCounts.fair / total) * 100,
      poor: (qualityCounts.poor / total) * 100
    };

    // Identify issues
    const issues: string[] = [];
    if (avgMetrics.latency! > this.thresholds.good.latency) {
      issues.push(`Average latency (${avgMetrics.latency!.toFixed(0)}ms) exceeded recommended threshold`);
    }
    if (avgMetrics.packetLoss! > this.thresholds.good.packetLoss) {
      issues.push(`Packet loss (${avgMetrics.packetLoss!.toFixed(2)}%) impacted call quality`);
    }
    if (qualityPercentages.poor > 10) {
      issues.push(`Poor quality detected for ${qualityPercentages.poor.toFixed(0)}% of the session`);
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (avgMetrics.latency! > this.thresholds.good.latency) {
      recommendations.push('Consider using a closer server or optimizing network routing');
    }
    if (avgMetrics.packetLoss! > this.thresholds.good.packetLoss) {
      recommendations.push('Check network stability and consider wired connection');
    }
    if (avgMetrics.bandwidth && avgMetrics.bandwidth.upload < this.thresholds.good.minBandwidth) {
      recommendations.push('Upgrade internet connection for better video quality');
    }

    return {
      summary: avgMetrics,
      qualityPercentages,
      issues,
      recommendations
    };
  }

  /**
   * Clean up all monitoring
   */
  destroy(): void {
    this.intervals.forEach((interval, sessionId) => {
      clearInterval(interval);
    });
    this.intervals.clear();
    this.metrics.clear();
    this.removeAllListeners();
  }
}

// Singleton instance
export const qosService = new WebRTCQoSService();