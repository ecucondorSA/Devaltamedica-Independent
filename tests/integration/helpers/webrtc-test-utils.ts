/**
 * Utilidades de Testing para WebRTC
 * Proporciona mocks y helpers para testing de telemedicina
 */

interface ConnectionStats {
  state: 'connecting' | 'connected' | 'disconnected' | 'failed'
  remotePeerId?: string
  latency?: number
  bandwidth?: number
  videoResolution?: string
  bitrate?: number
}

interface LatencyStats {
  average: number
  min: number
  max: number
  jitter: number
}

interface ConnectionInfo {
  dtlsState: string
  srtpCipher: string
  dtlsCipher: string
}

export class WebRTCTestClient {
  private role: string
  private userId: string
  private connectionState: ConnectionStats['state'] = 'disconnected'
  private mockPeerConnection: any
  private mockMediaStream: MockMediaStream
  private latencyMeasurements: number[] = []

  constructor(role: string, userId: string) {
    this.role = role
    this.userId = userId
    this.mockMediaStream = new MockMediaStream()
    this.setupMockPeerConnection()
  }

  private setupMockPeerConnection() {
    this.mockPeerConnection = {
      connectionState: 'new',
      iceConnectionState: 'new',
      localDescription: null,
      remoteDescription: null,
      getStats: () => Promise.resolve(this.generateMockStats()),
      close: () => {
        this.connectionState = 'disconnected'
      }
    }
  }

  async connect(roomId: string, token: string): Promise<void> {
    // Simular proceso de conexión WebRTC
    this.connectionState = 'connecting'
    
    // Simular tiempo de establecimiento de conexión
    await this.delay(500)
    
    this.connectionState = 'connected'
    this.mockPeerConnection.connectionState = 'connected'
    this.mockPeerConnection.iceConnectionState = 'connected'
  }

  async waitForConnection(timeout: number = 5000): Promise<ConnectionStats> {
    const startTime = Date.now()
    
    while (this.connectionState !== 'connected' && Date.now() - startTime < timeout) {
      await this.delay(100)
    }
    
    if (this.connectionState !== 'connected') {
      throw new Error('Connection timeout')
    }
    
    return {
      state: this.connectionState,
      remotePeerId: this.role === 'patient' ? 'doctor-id' : 'patient-id',
      latency: 50,
      bandwidth: 1000000, // 1Mbps
      videoResolution: '720p',
      bitrate: 800000
    }
  }

  async disconnect(): Promise<void> {
    this.connectionState = 'disconnected'
    this.mockPeerConnection?.close()
  }

  async simulateBandwidthLimitation(bandwidth: string): Promise<void> {
    // Simular limitación de ancho de banda
    const bandwidthNum = parseInt(bandwidth.replace(/[^\d]/g, ''))
    
    if (bandwidthNum < 1000) {
      // Degradar calidad de video
      this.mockMediaStream.degradeQuality('480p')
    }
  }

  async simulateConnectionLoss(): Promise<void> {
    this.connectionState = 'disconnected'
    this.mockPeerConnection.connectionState = 'disconnected'
  }

  async waitForReconnection(timeout: number): Promise<{ success: boolean, timeToReconnect: number }> {
    const startTime = Date.now()
    
    // Simular reconexión automática después de 2 segundos
    await this.delay(2000)
    
    this.connectionState = 'connected'
    const timeToReconnect = Date.now() - startTime
    
    return {
      success: true,
      timeToReconnect
    }
  }

  async enableVideo(enabled: boolean): Promise<void> {
    this.mockMediaStream.setVideoEnabled(enabled)
  }

  getVideoTrack(): any {
    return this.mockMediaStream.getVideoTrack()
  }

  getAudioTrack(): any {
    return this.mockMediaStream.getAudioTrack()
  }

  async waitForRemoteVideo(timeout: number): Promise<{ width: number, height: number }> {
    await this.delay(1000) // Simular tiempo de recepción
    return { width: 1280, height: 720 }
  }

  async startScreenShare(): Promise<{ success?: boolean, error?: string }> {
    if (this.role === 'patient') {
      return { error: 'permission_denied' }
    }
    
    await this.delay(500)
    return { success: true }
  }

  async waitForRemoteScreenShare(timeout: number): Promise<{ isScreenShare: boolean }> {
    await this.delay(1000)
    return { isScreenShare: true }
  }

  async muteAudio(muted: boolean): Promise<void> {
    this.mockMediaStream.setAudioEnabled(!muted)
  }

  async waitForPeerMuteStatus(timeout: number): Promise<{ peerId: string, muted: boolean }> {
    await this.delay(500)
    return {
      peerId: this.role === 'doctor' ? 'patient-id' : 'doctor-id',
      muted: true
    }
  }

  async startLatencyMonitoring(): Promise<void> {
    // Simular mediciones de latencia cada 500ms
    const measureLatency = () => {
      const latency = 30 + Math.random() * 100 // 30-130ms
      this.latencyMeasurements.push(latency)
      
      if (this.connectionState === 'connected') {
        setTimeout(measureLatency, 500)
      }
    }
    
    measureLatency()
  }

  async getLatencyStats(): Promise<LatencyStats> {
    if (this.latencyMeasurements.length === 0) {
      return { average: 50, min: 50, max: 50, jitter: 0 }
    }
    
    const sum = this.latencyMeasurements.reduce((a, b) => a + b, 0)
    const average = sum / this.latencyMeasurements.length
    const min = Math.min(...this.latencyMeasurements)
    const max = Math.max(...this.latencyMeasurements)
    const jitter = Math.sqrt(this.latencyMeasurements.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / this.latencyMeasurements.length)
    
    return { average, min, max, jitter }
  }

  async simulatePoorConnection(): Promise<void> {
    // Simular conexión pobre aumentando latencia y reduciendo calidad
    this.latencyMeasurements.push(...[200, 250, 300, 180, 220])
    this.mockMediaStream.degradeQuality('360p')
  }

  async simulateUsage(duration: number): Promise<void> {
    // Simular uso activo durante la duración especificada
    await this.delay(duration)
  }

  async getConnectionStats(): Promise<any> {
    return this.generateMockStats()
  }

  async waitForDisconnection(timeout: number): Promise<{ reason: string }> {
    await this.delay(1000)
    this.connectionState = 'disconnected'
    return { reason: 'session_ended_by_doctor' }
  }

  async getConnectionInfo(): Promise<ConnectionInfo> {
    return {
      dtlsState: 'connected',
      srtpCipher: 'AES_CM_128_HMAC_SHA1_80',
      dtlsCipher: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384'
    }
  }

  private generateMockStats(): any {
    const currentLatency = this.latencyMeasurements.length > 0 
      ? this.latencyMeasurements[this.latencyMeasurements.length - 1] 
      : 50

    return new Map([
      ['inbound-rtp', {
        type: 'inbound-rtp',
        mediaType: 'video',
        bytesReceived: 1000000,
        packetsReceived: 5000,
        packetsLost: 10,
        framesPerSecond: 30
      }],
      ['outbound-rtp', {
        type: 'outbound-rtp', 
        mediaType: 'video',
        bytesSent: 1200000,
        packetsSent: 6000,
        framesPerSecond: 30
      }],
      ['candidate-pair', {
        type: 'candidate-pair',
        currentRoundTripTime: currentLatency / 1000, // Convertir a segundos
        availableOutgoingBitrate: 800000
      }]
    ])
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export class MockMediaStream {
  private videoTrack: MockMediaTrack
  private audioTrack: MockMediaTrack

  constructor() {
    this.videoTrack = new MockMediaTrack('video')
    this.audioTrack = new MockMediaTrack('audio')
  }

  setVideoEnabled(enabled: boolean): void {
    this.videoTrack.enabled = enabled
  }

  setAudioEnabled(enabled: boolean): void {
    this.audioTrack.enabled = enabled
  }

  getVideoTrack(): MockMediaTrack {
    return this.videoTrack
  }

  getAudioTrack(): MockMediaTrack {
    return this.audioTrack
  }

  degradeQuality(resolution: string): void {
    this.videoTrack.settings = {
      ...this.videoTrack.settings,
      width: resolution === '360p' ? 640 : 854,
      height: resolution === '360p' ? 360 : 480
    }
  }
}

class MockMediaTrack {
  public kind: string
  public enabled: boolean = true
  public readyState: string = 'live'
  public settings: any = {}

  constructor(kind: string) {
    this.kind = kind
    
    if (kind === 'video') {
      this.settings = {
        width: 1280,
        height: 720,
        frameRate: 30
      }
    } else if (kind === 'audio') {
      this.settings = {
        sampleRate: 48000,
        channelCount: 2
      }
    }
  }

  stop(): void {
    this.readyState = 'ended'
  }
}