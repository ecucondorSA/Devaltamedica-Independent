// 🚀 AutoOptimizer - Optimización Automática de Videollamadas
// Basado en las mejores prácticas modernas de WebRTC y telemedicina

export interface NetworkMetrics {
  latency: number;
  jitter: number;
  packetLoss: number;
  bandwidth: number;
  fps: number;
  resolution: {
    width: number;
    height: number;
  };
  bitrate: number;
}

export interface OptimizationConfig {
  autoQuality: boolean;
  adaptiveBitrate: boolean;
  noiseReduction: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  bandwidthOptimization: boolean;
  lowLatencyMode: boolean;
  medicalPriority: boolean;
}

export interface QualityProfile {
  name: string;
  video: {
    width: number;
    height: number;
    frameRate: number;
    bitrate: number;
  };
  audio: {
    sampleRate: number;
    channels: number;
    bitrate: number;
  };
  codec: {
    video: 'VP8' | 'VP9' | 'H264' | 'AV1';
    audio: 'Opus' | 'AAC';
  };
}

export class AutoOptimizer {
  private metrics: NetworkMetrics | null = null;
  private config: OptimizationConfig;
  private qualityProfiles: Map<string, QualityProfile>;
  private currentProfile: string = 'high';
  private optimizationHistory: Array<{
    timestamp: Date;
    action: string;
    reason: string;
    metrics: NetworkMetrics;
  }> = [];

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      autoQuality: true,
      adaptiveBitrate: true,
      noiseReduction: true,
      echoCancellation: true,
      autoGainControl: true,
      bandwidthOptimization: true,
      lowLatencyMode: true,
      medicalPriority: true,
      ...config
    };

    this.qualityProfiles = this.initializeQualityProfiles();
  }

  private initializeQualityProfiles(): Map<string, QualityProfile> {
    const profiles = new Map<string, QualityProfile>();

    // Perfil Ultra HD - Para conexiones excelentes
    profiles.set('ultra', {
      name: 'Ultra HD',
      video: {
        width: 1920,
        height: 1080,
        frameRate: 30,
        bitrate: 4000
      },
      audio: {
        sampleRate: 48000,
        channels: 2,
        bitrate: 128
      },
      codec: {
        video: 'VP9',
        audio: 'Opus'
      }
    });

    // Perfil HD - Para conexiones buenas
    profiles.set('high', {
      name: 'HD',
      video: {
        width: 1280,
        height: 720,
        frameRate: 30,
        bitrate: 2500
      },
      audio: {
        sampleRate: 48000,
        channels: 2,
        bitrate: 96
      },
      codec: {
        video: 'VP8',
        audio: 'Opus'
      }
    });

    // Perfil SD - Para conexiones moderadas
    profiles.set('medium', {
      name: 'SD',
      video: {
        width: 854,
        height: 480,
        frameRate: 25,
        bitrate: 1000
      },
      audio: {
        sampleRate: 44100,
        channels: 1,
        bitrate: 64
      },
      codec: {
        video: 'VP8',
        audio: 'Opus'
      }
    });

    // Perfil Bajo - Para conexiones pobres
    profiles.set('low', {
      name: 'Bajo',
      video: {
        width: 640,
        height: 360,
        frameRate: 15,
        bitrate: 500
      },
      audio: {
        sampleRate: 22050,
        channels: 1,
        bitrate: 32
      },
      codec: {
        video: 'VP8',
        audio: 'Opus'
      }
    });

    // Perfil Médico Crítico - Prioridad en estabilidad
    profiles.set('medical', {
      name: 'Médico Crítico',
      video: {
        width: 854,
        height: 480,
        frameRate: 20,
        bitrate: 800
      },
      audio: {
        sampleRate: 48000,
        channels: 1,
        bitrate: 64
      },
      codec: {
        video: 'H264',
        audio: 'Opus'
      }
    });

    return profiles;
  }

  // Analizar métricas de red y determinar optimizaciones
  public analyzeAndOptimize(metrics: NetworkMetrics): {
    recommendedProfile: string;
    optimizations: string[];
    warnings: string[];
  } {
    this.metrics = metrics;
    
    const optimizations: string[] = [];
    const warnings: string[] = [];
    let recommendedProfile = this.currentProfile;

    // Análisis de latencia
    if (metrics.latency > 300) {
      warnings.push('Latencia alta detectada');
      if (this.config.lowLatencyMode) {
        optimizations.push('Activando modo de baja latencia');
        recommendedProfile = this.getLowerProfile(recommendedProfile);
      }
    }

    // Análisis de pérdida de paquetes
    if (metrics.packetLoss > 0.02) {
      warnings.push('Pérdida de paquetes significativa');
      optimizations.push('Reduciendo calidad para estabilidad');
      recommendedProfile = this.getLowerProfile(recommendedProfile);
    }

    // Análisis de jitter
    if (metrics.jitter > 0.05) {
      warnings.push('Jitter alto detectado');
      optimizations.push('Aplicando buffer de jitter adaptativo');
    }

    // Análisis de ancho de banda
    const requiredBandwidth = this.qualityProfiles.get(recommendedProfile)?.video.bitrate || 1000;
    if (metrics.bandwidth < requiredBandwidth * 1.5) {
      warnings.push('Ancho de banda insuficiente');
      optimizations.push('Ajustando bitrate adaptativo');
      recommendedProfile = this.getLowerProfile(recommendedProfile);
    }

    // Análisis de FPS
    if (metrics.fps < 20) {
      warnings.push('FPS bajo detectado');
      optimizations.push('Reduciendo frame rate para estabilidad');
      recommendedProfile = this.getLowerProfile(recommendedProfile);
    }

    // Modo médico crítico
    if (this.config.medicalPriority && warnings.length > 2) {
      recommendedProfile = 'medical';
      optimizations.push('Activando perfil médico crítico');
    }

    // Registrar optimización
    if (recommendedProfile !== this.currentProfile) {
      this.optimizationHistory.push({
        timestamp: new Date(),
        action: `Cambio de perfil: ${this.currentProfile} → ${recommendedProfile}`,
        reason: warnings.join(', '),
        metrics: { ...metrics }
      });
      
      this.currentProfile = recommendedProfile;
    }

    return {
      recommendedProfile,
      optimizations,
      warnings
    };
  }

  private getLowerProfile(currentProfile: string): string {
    const profileOrder = ['ultra', 'high', 'medium', 'low', 'medical'];
    const currentIndex = profileOrder.indexOf(currentProfile);
    return profileOrder[Math.min(currentIndex + 1, profileOrder.length - 1)];
  }

  // Obtener configuración de medios optimizada
  public getOptimizedMediaConfig(profile: string = this.currentProfile): MediaStreamConstraints {
    const qualityProfile = this.qualityProfiles.get(profile);
    
    if (!qualityProfile) {
      throw new Error(`Perfil de calidad no encontrado: ${profile}`);
    }

    return {
      video: {
        width: { ideal: qualityProfile.video.width, min: qualityProfile.video.width * 0.8 },
        height: { ideal: qualityProfile.video.height, min: qualityProfile.video.height * 0.8 },
        frameRate: { ideal: qualityProfile.video.frameRate, min: qualityProfile.video.frameRate * 0.7 },
        facingMode: 'user',
        deviceId: undefined
      },
      audio: {
        echoCancellation: this.config.echoCancellation,
        noiseSuppression: this.config.noiseReduction,
        autoGainControl: this.config.autoGainControl,
        sampleRate: qualityProfile.audio.sampleRate,
        channelCount: qualityProfile.audio.channels,
        deviceId: undefined
      }
    };
  }

  // Obtener configuración WebRTC optimizada
  public getOptimizedRTCConfig(): RTCConfiguration {
    const qualityProfile = this.qualityProfiles.get(this.currentProfile);
    
    return {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // TURN servers para producción
        {
          urls: [
            'turn:turn.altamedica.com:3478',
            'turns:turn.altamedica.com:5349'
          ],
          username: process.env.NEXT_PUBLIC_TURN_USERNAME || 'altamedica_user',
          credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL || 'altamedica_pass'
        }
      ],
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      iceTransportPolicy: 'all',
      sdpSemantics: 'unified-plan'
    };
  }

  // Aplicar optimizaciones de codificación
  public getEncodingOptimizations(): RTCRtpEncodingParameters[] {
    const qualityProfile = this.qualityProfiles.get(this.currentProfile);
    
    if (!qualityProfile) return [];

    return [
      {
        maxBitrate: qualityProfile.video.bitrate * 1000, // Convertir a bps
        maxFramerate: qualityProfile.video.frameRate,
        scaleResolutionDownBy: 1.0,
        active: true
      }
    ];
  }

  // Obtener recomendaciones de optimización
  public getOptimizationRecommendations(): {
    immediate: string[];
    suggested: string[];
    longTerm: string[];
  } {
    if (!this.metrics) {
      return { immediate: [], suggested: [], longTerm: [] };
    }

    const immediate: string[] = [];
    const suggested: string[] = [];
    const longTerm: string[] = [];

    // Recomendaciones inmediatas
    if (this.metrics.latency > 500) {
      immediate.push('Verificar conexión a internet');
      immediate.push('Cerrar aplicaciones que consuman ancho de banda');
    }

    if (this.metrics.packetLoss > 0.05) {
      immediate.push('Cambiar a conexión más estable');
      immediate.push('Verificar interferencias de red');
    }

    // Recomendaciones sugeridas
    if (this.metrics.bandwidth < 2000) {
      suggested.push('Considerar actualizar plan de internet');
      suggested.push('Usar conexión por cable en lugar de WiFi');
    }

    if (this.metrics.fps < 25) {
      suggested.push('Verificar rendimiento del dispositivo');
      suggested.push('Cerrar aplicaciones en segundo plano');
    }

    // Recomendaciones a largo plazo
    if (this.metrics.latency > 200) {
      longTerm.push('Considerar proveedor de internet con menor latencia');
    }

    if (this.metrics.bandwidth < 5000) {
      longTerm.push('Evaluar actualización de infraestructura de red');
    }

    return { immediate, suggested, longTerm };
  }

  // Obtener historial de optimizaciones
  public getOptimizationHistory() {
    return this.optimizationHistory;
  }

  // Obtener estadísticas de rendimiento
  public getPerformanceStats() {
    if (!this.metrics) return null;

    return {
      currentProfile: this.currentProfile,
      profileInfo: this.qualityProfiles.get(this.currentProfile),
      metrics: this.metrics,
      optimizationCount: this.optimizationHistory.length,
      lastOptimization: this.optimizationHistory[this.optimizationHistory.length - 1]?.timestamp
    };
  }

  // Configurar optimizaciones específicas para telemedicina
  public setMedicalOptimizations(enabled: boolean) {
    this.config.medicalPriority = enabled;
    
    if (enabled) {
      // Priorizar estabilidad sobre calidad
      this.config.autoQuality = true;
      this.config.adaptiveBitrate = true;
      this.config.lowLatencyMode = true;
    }
  }

  // Limpiar historial de optimizaciones
  public clearHistory() {
    this.optimizationHistory = [];
  }
}

// Instancia global del optimizador
export const autoOptimizer = new AutoOptimizer();

// Hook para React
export const useAutoOptimizer = () => {
  return {
    optimizer: autoOptimizer,
    analyzeAndOptimize: (metrics: NetworkMetrics) => autoOptimizer.analyzeAndOptimize(metrics),
    getOptimizedMediaConfig: (profile?: string) => autoOptimizer.getOptimizedMediaConfig(profile),
    getOptimizationRecommendations: () => autoOptimizer.getOptimizationRecommendations(),
    getPerformanceStats: () => autoOptimizer.getPerformanceStats()
  };
}; 