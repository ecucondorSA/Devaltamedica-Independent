/**
 * Integration Test: Integración WebRTC para Telemedicina
 * 
 * Este test valida la integración entre:
 * - Servidor de señalización WebRTC
 * - API de consultas médicas
 * - Gestión de sesiones de video
 * - Calidad de conexión y latencia
 * - Grabación de consultas médicas
 * - Seguridad en transmisiones médicas
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/database-setup'
import { createTestPatient, createTestDoctor, createWebRTCRoom } from '../helpers/test-data-generators'
import { apiRequest } from '../helpers/api-client'
import { validateHIPAACompliance } from '../helpers/hipaa-validator'
import { WebRTCTestClient, MockMediaStream } from '../helpers/webrtc-test-utils'

describe('Integration: WebRTC Telemedicina', () => {
  let testPatient: any
  let testDoctor: any
  let testConsultation: any
  let webrtcRoom: any
  let patientClient: WebRTCTestClient
  let doctorClient: WebRTCTestClient

  beforeAll(async () => {
    await setupTestDatabase()
    
    // Verificar que el servidor de señalización esté corriendo
    const signalingHealth = await apiRequest('GET', 'http://localhost:8888/health')
    expect(signalingHealth.status).toBe(200)
  })

  beforeEach(async () => {
    // Crear datos de prueba
    testPatient = await createTestPatient({
      age: 35,
      conditions: ['anxiety'],
      internetSpeed: 'high', // Para tests de calidad
      deviceType: 'desktop'
    })

    testDoctor = await createTestDoctor({
      specialty: 'psychiatry',
      telemedicineEnabled: true,
      videoQualityPreference: 'high'
    })

    // Crear consulta programada
    const consultationResponse = await apiRequest('POST', '/api/v1/consultations', {
      body: {
        patientId: testPatient.id,
        doctorId: testDoctor.id,
        type: 'telemedicine',
        scheduledFor: new Date().toISOString(),
        duration: 30
      },
      doctorId: testDoctor.id
    })
    testConsultation = consultationResponse.data.consultation

    // Crear sala WebRTC
    webrtcRoom = await createWebRTCRoom({
      consultationId: testConsultation.id,
      maxParticipants: 2,
      recordingEnabled: true
    })

    // Inicializar clientes WebRTC mock
    patientClient = new WebRTCTestClient('patient', testPatient.id)
    doctorClient = new WebRTCTestClient('doctor', testDoctor.id)
  })

  afterEach(async () => {
    // Limpiar conexiones WebRTC
    await patientClient?.disconnect()
    await doctorClient?.disconnect()
    await cleanupTestDatabase()
  })

  describe('Paso 1: Inicialización de Sala WebRTC', () => {
    it('debe crear sala de video con configuración médica', async () => {
      const roomRequest = {
        consultationId: testConsultation.id,
        participants: [
          { id: testPatient.id, role: 'patient' },
          { id: testDoctor.id, role: 'doctor' }
        ],
        securityLevel: 'medical_grade',
        recordingRequired: true,
        qualitySettings: {
          minBandwidth: '1Mbps',
          preferredResolution: '720p',
          audioCodec: 'opus',
          videoCodec: 'h264'
        }
      }

      const response = await apiRequest('POST', '/api/v1/webrtc/rooms', {
        body: roomRequest,
        doctorId: testDoctor.id
      })

      expect(response.status).toBe(201)
      expect(response.data.room).toMatchObject({
        consultationId: testConsultation.id,
        status: 'waiting',
        securityLevel: 'medical_grade',
        roomId: expect.any(String)
      })

      webrtcRoom = response.data.room
    })

    it('debe generar tokens de acceso seguros por rol', async () => {
      const patientTokenResponse = await apiRequest('POST', `/api/v1/webrtc/rooms/${webrtcRoom.id}/token`, {
        body: {
          participantId: testPatient.id,
          role: 'patient'
        },
        patientId: testPatient.id
      })

      const doctorTokenResponse = await apiRequest('POST', `/api/v1/webrtc/rooms/${webrtcRoom.id}/token`, {
        body: {
          participantId: testDoctor.id,
          role: 'doctor'
        },
        doctorId: testDoctor.id
      })

      expect(patientTokenResponse.status).toBe(200)
      expect(doctorTokenResponse.status).toBe(200)

      // Verificar que los tokens son diferentes y tienen permisos apropiados
      expect(patientTokenResponse.data.token).not.toBe(doctorTokenResponse.data.token)
      expect(patientTokenResponse.data.permissions).toEqual(['video', 'audio', 'chat'])
      expect(doctorTokenResponse.data.permissions).toEqual(['video', 'audio', 'chat', 'screen_share', 'record'])
    })

    it('debe validar autorización antes de crear sala', async () => {
      // Intentar crear sala sin autorización
      const unauthorizedResponse = await apiRequest('POST', '/api/v1/webrtc/rooms', {
        body: {
          consultationId: testConsultation.id,
          participants: [{ id: 'unauthorized-user', role: 'patient' }]
        },
        headers: { 'Authorization': 'Bearer invalid-token' }
      })

      expect(unauthorizedResponse.status).toBe(401)
    })
  })

  describe('Paso 2: Establecimiento de Conexión WebRTC', () => {
    beforeEach(async () => {
      // Setup sala WebRTC
      const roomResponse = await apiRequest('POST', '/api/v1/webrtc/rooms', {
        body: {
          consultationId: testConsultation.id,
          participants: [
            { id: testPatient.id, role: 'patient' },
            { id: testDoctor.id, role: 'doctor' }
          ]
        },
        doctorId: testDoctor.id
      })
      webrtcRoom = roomResponse.data.room
    })

    it('debe establecer conexión P2P entre paciente y doctor', async () => {
      // Obtener tokens
      const patientToken = await apiRequest('POST', `/api/v1/webrtc/rooms/${webrtcRoom.id}/token`, {
        body: { participantId: testPatient.id, role: 'patient' },
        patientId: testPatient.id
      })

      const doctorToken = await apiRequest('POST', `/api/v1/webrtc/rooms/${webrtcRoom.id}/token`, {
        body: { participantId: testDoctor.id, role: 'doctor' },
        doctorId: testDoctor.id
      })

      // Conectar clientes
      await patientClient.connect(webrtcRoom.id, patientToken.data.token)
      await doctorClient.connect(webrtcRoom.id, doctorToken.data.token)

      // Esperar establecimiento de conexión
      const patientConnection = await patientClient.waitForConnection(5000)
      const doctorConnection = await doctorClient.waitForConnection(5000)

      expect(patientConnection.state).toBe('connected')
      expect(doctorConnection.state).toBe('connected')
      expect(patientConnection.remotePeerId).toBe(testDoctor.id)
      expect(doctorConnection.remotePeerId).toBe(testPatient.id)
    })

    it('debe negociar calidad de video adaptativa', async () => {
      await patientClient.connect(webrtcRoom.id, 'patient-token')
      await doctorClient.connect(webrtcRoom.id, 'doctor-token')

      // Simular ancho de banda limitado
      await patientClient.simulateBandwidthLimitation('512kbps')

      // Verificar que se negoció calidad más baja
      const stats = await patientClient.getConnectionStats()
      expect(stats.videoResolution).toBe('480p') // Degradado desde 720p
      expect(stats.bitrate).toBeLessThan(600000) // <600kbps
    })

    it('debe manejar reconexión automática', async () => {
      await patientClient.connect(webrtcRoom.id, 'patient-token')
      await doctorClient.connect(webrtcRoom.id, 'doctor-token')

      // Simular pérdida de conexión
      await patientClient.simulateConnectionLoss()

      // Verificar reconexión automática
      const reconnection = await patientClient.waitForReconnection(10000)
      expect(reconnection.success).toBe(true)
      expect(reconnection.timeToReconnect).toBeLessThan(5000) // <5 segundos
    })
  })

  describe('Paso 3: Gestión de Media Streams', () => {
    beforeEach(async () => {
      // Setup conexión establecida
      await patientClient.connect(webrtcRoom.id, 'patient-token')
      await doctorClient.connect(webrtcRoom.id, 'doctor-token')
      await patientClient.waitForConnection()
      await doctorClient.waitForConnection()
    })

    it('debe manejar streams de video y audio', async () => {
      // Activar video del paciente
      await patientClient.enableVideo(true)
      const videoTrack = patientClient.getVideoTrack()
      
      expect(videoTrack).toBeDefined()
      expect(videoTrack.readyState).toBe('live')

      // Verificar que el doctor recibe el video
      const remoteVideo = await doctorClient.waitForRemoteVideo(3000)
      expect(remoteVideo.width).toBeGreaterThan(0)
      expect(remoteVideo.height).toBeGreaterThan(0)
    })

    it('debe permitir compartir pantalla (solo doctor)', async () => {
      // Paciente no debe poder compartir pantalla
      const patientScreenShare = await patientClient.startScreenShare()
      expect(patientScreenShare.error).toContain('permission_denied')

      // Doctor sí puede compartir pantalla
      const doctorScreenShare = await doctorClient.startScreenShare()
      expect(doctorScreenShare.success).toBe(true)

      // Verificar que paciente recibe la pantalla compartida
      const remoteScreen = await patientClient.waitForRemoteScreenShare(3000)
      expect(remoteScreen.isScreenShare).toBe(true)
    })

    it('debe controlar mute/unmute de audio', async () => {
      // Paciente silencia su micrófono
      await patientClient.muteAudio(true)
      
      const audioTrack = patientClient.getAudioTrack()
      expect(audioTrack.enabled).toBe(false)

      // Verificar que doctor recibe notificación
      const muteNotification = await doctorClient.waitForPeerMuteStatus(2000)
      expect(muteNotification.peerId).toBe(testPatient.id)
      expect(muteNotification.muted).toBe(true)
    })
  })

  describe('Paso 4: Grabación de Consultas', () => {
    beforeEach(async () => {
      await patientClient.connect(webrtcRoom.id, 'patient-token')
      await doctorClient.connect(webrtcRoom.id, 'doctor-token')
      await patientClient.waitForConnection()
      await doctorClient.waitForConnection()
    })

    it('debe iniciar grabación con consentimiento del paciente', async () => {
      // Solicitar consentimiento de grabación
      const consentRequest = await apiRequest('POST', `/api/v1/consultations/${testConsultation.id}/request-recording-consent`, {
        body: { requestedBy: testDoctor.id },
        doctorId: testDoctor.id
      })

      expect(consentRequest.status).toBe(200)

      // Paciente otorga consentimiento
      await apiRequest('POST', `/api/v1/consultations/${testConsultation.id}/recording-consent`, {
        body: { 
          consent: true,
          digitalSignature: 'patient-consent-signature',
          timestamp: new Date().toISOString()
        },
        patientId: testPatient.id
      })

      // Iniciar grabación
      const recordingResponse = await apiRequest('POST', `/api/v1/webrtc/rooms/${webrtcRoom.id}/start-recording`, {
        body: { quality: 'high' },
        doctorId: testDoctor.id
      })

      expect(recordingResponse.status).toBe(200)
      expect(recordingResponse.data.recording).toMatchObject({
        status: 'recording',
        startedAt: expect.any(String),
        consentVerified: true
      })
    })

    it('debe rechazar grabación sin consentimiento', async () => {
      // Intentar grabar sin consentimiento
      const recordingResponse = await apiRequest('POST', `/api/v1/webrtc/rooms/${webrtcRoom.id}/start-recording`, {
        doctorId: testDoctor.id
      })

      expect(recordingResponse.status).toBe(403)
      expect(recordingResponse.data.error).toContain('recording_consent_required')
    })

    it('debe encriptar grabaciones con estándares médicos', async () => {
      // Setup consentimiento y grabación
      await apiRequest('POST', `/api/v1/consultations/${testConsultation.id}/recording-consent`, {
        body: { consent: true },
        patientId: testPatient.id
      })

      const recording = await apiRequest('POST', `/api/v1/webrtc/rooms/${webrtcRoom.id}/start-recording`, {
        doctorId: testDoctor.id
      })

      // Simular finalización de grabación
      await apiRequest('POST', `/api/v1/webrtc/rooms/${webrtcRoom.id}/stop-recording`, {
        doctorId: testDoctor.id
      })

      // Verificar que la grabación está encriptada
      const recordingDetails = await apiRequest('GET', `/api/v1/recordings/${recording.data.recording.id}`)
      
      expect(recordingDetails.data.recording.encryption).toMatchObject({
        algorithm: 'AES-256-GCM',
        keyManagement: 'HIPAA_compliant',
        status: 'encrypted'
      })
    })
  })

  describe('Paso 5: Monitoreo de Calidad en Tiempo Real', () => {
    beforeEach(async () => {
      await patientClient.connect(webrtcRoom.id, 'patient-token')
      await doctorClient.connect(webrtcRoom.id, 'doctor-token')
      await patientClient.waitForConnection()
      await doctorClient.waitForConnection()
    })

    it('debe monitorear latencia de la conexión', async () => {
      // Iniciar monitoreo de latencia
      await patientClient.startLatencyMonitoring()
      await doctorClient.startLatencyMonitoring()

      // Esperar algunas mediciones
      await new Promise(resolve => setTimeout(resolve, 2000))

      const patientLatency = await patientClient.getLatencyStats()
      const doctorLatency = await doctorClient.getLatencyStats()

      // Para telemedicina médica, la latencia debe ser <150ms
      expect(patientLatency.average).toBeLessThan(150)
      expect(doctorLatency.average).toBeLessThan(150)
    })

    it('debe alertar sobre problemas de calidad', async () => {
      // Simular degradación de calidad
      await patientClient.simulatePoorConnection()

      // Verificar que se genera alerta de calidad
      const qualityAlert = await apiRequest('GET', `/api/v1/webrtc/rooms/${webrtcRoom.id}/quality-alerts`)
      
      expect(qualityAlert.data.alerts).toContainEqual(
        expect.objectContaining({
          type: 'poor_video_quality',
          participantId: testPatient.id,
          severity: 'warning'
        })
      )
    })

    it('debe generar métricas de uso para optimización', async () => {
      // Simular uso durante 5 segundos
      await patientClient.simulateUsage(5000)
      
      const metrics = await apiRequest('GET', `/api/v1/webrtc/rooms/${webrtcRoom.id}/metrics`)
      
      expect(metrics.data.metrics).toMatchObject({
        averageLatency: expect.any(Number),
        bandwidthUsed: expect.any(Number),
        videoQuality: expect.stringMatching(/480p|720p|1080p/),
        participantCount: 2,
        duration: expect.any(Number)
      })
    })
  })

  describe('Paso 6: Finalización y Limpieza', () => {
    beforeEach(async () => {
      // Setup sesión activa
      await patientClient.connect(webrtcRoom.id, 'patient-token')
      await doctorClient.connect(webrtcRoom.id, 'doctor-token')
      await patientClient.waitForConnection()
    })

    it('debe finalizar sesión y limpiar recursos', async () => {
      // Doctor finaliza la consulta
      const endResponse = await apiRequest('POST', `/api/v1/webrtc/rooms/${webrtcRoom.id}/end-session`, {
        body: {
          endedBy: testDoctor.id,
          duration: 1800, // 30 minutos
          summary: 'Consulta completada exitosamente'
        },
        doctorId: testDoctor.id
      })

      expect(endResponse.status).toBe(200)

      // Verificar que se desconectaron los clientes
      const disconnection = await patientClient.waitForDisconnection(3000)
      expect(disconnection.reason).toBe('session_ended_by_doctor')

      // Verificar que la sala se marcó como finalizada
      const roomStatus = await apiRequest('GET', `/api/v1/webrtc/rooms/${webrtcRoom.id}`)
      expect(roomStatus.data.room.status).toBe('ended')
    })

    it('debe generar resumen de calidad de la sesión', async () => {
      // Finalizar sesión
      await apiRequest('POST', `/api/v1/webrtc/rooms/${webrtcRoom.id}/end-session`, {
        body: { endedBy: testDoctor.id, duration: 1800 },
        doctorId: testDoctor.id
      })

      // Obtener resumen de calidad
      const qualitySummary = await apiRequest('GET', `/api/v1/webrtc/sessions/${webrtcRoom.id}/quality-report`)
      
      expect(qualitySummary.data.report).toMatchObject({
        overallQuality: expect.stringMatching(/excellent|good|fair|poor/),
        averageLatency: expect.any(Number),
        connectionStability: expect.any(Number), // Porcentaje
        audioQuality: expect.any(Number), // 1-5
        videoQuality: expect.any(Number), // 1-5
        participantSatisfaction: expect.any(Object)
      })
    })

    it('debe actualizar estado de consulta médica', async () => {
      await apiRequest('POST', `/api/v1/webrtc/rooms/${webrtcRoom.id}/end-session`, {
        body: { endedBy: testDoctor.id, duration: 1800 },
        doctorId: testDoctor.id
      })

      // Verificar que se actualizó la consulta
      const consultationStatus = await apiRequest('GET', `/api/v1/consultations/${testConsultation.id}`)
      
      expect(consultationStatus.data.consultation).toMatchObject({
        status: 'completed',
        actualDuration: 1800,
        telemedicineSession: {
          quality: expect.any(String),
          recordingAvailable: expect.any(Boolean)
        }
      })
    })
  })

  describe('Validaciones de Seguridad y Compliance', () => {
    it('debe mantener encriptación end-to-end en transmisión', async () => {
      await patientClient.connect(webrtcRoom.id, 'patient-token')
      await doctorClient.connect(webrtcRoom.id, 'doctor-token')
      await patientClient.waitForConnection()

      // Verificar que la conexión usa DTLS para encriptación
      const connectionInfo = await patientClient.getConnectionInfo()
      
      expect(connectionInfo.dtlsState).toBe('connected')
      expect(connectionInfo.srtpCipher).toMatch(/AES_CM_128_HMAC_SHA1_80|AES_CM_256_HMAC_SHA1_80/)
      expect(connectionInfo.dtlsCipher).toContain('TLS_')
    })

    it('debe cumplir con estándares HIPAA para telemedicina', async () => {
      const telemedicineData = {
        session: webrtcRoom,
        participants: [testPatient, testDoctor],
        transmission: 'encrypted',
        recordingConsent: true
      }

      const complianceResult = validateHIPAACompliance(telemedicineData)
      
      expect(complianceResult.isCompliant).toBe(true)
      expect(complianceResult.telemedicineCompliance).toMatchObject({
        encryptionInTransit: true,
        consentDocumented: true,
        auditTrailComplete: true,
        accessControlVerified: true
      })
    })

    it('debe registrar todos los eventos de seguridad', async () => {
      // Ejecutar sesión completa
      await patientClient.connect(webrtcRoom.id, 'patient-token')
      await doctorClient.connect(webrtcRoom.id, 'doctor-token')
      await patientClient.waitForConnection()
      
      await apiRequest('POST', `/api/v1/webrtc/rooms/${webrtcRoom.id}/end-session`, {
        body: { endedBy: testDoctor.id },
        doctorId: testDoctor.id
      })

      // Verificar audit trail de seguridad
      const securityAudit = await apiRequest('GET', `/api/v1/audit/webrtc-security/${webrtcRoom.id}`)
      
      const expectedSecurityEvents = [
        'room_created',
        'participant_authenticated',
        'connection_established',
        'encryption_verified',
        'session_ended'
      ]

      expectedSecurityEvents.forEach(event => {
        expect(securityAudit.data.securityLog).toContainEqual(
          expect.objectContaining({ event })
        )
      })
    })
  })
})