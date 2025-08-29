/**
 * Hook Híbrido de Telemedicina para Doctores
 * Combina Socket.IO real-time + Firebase persistence + funcionalidades médicas especializadas
 * Integración completa con el sistema médico existente
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { logger } from '@altamedica/shared';
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getFirestore,
} from 'firebase/firestore';

// Tipos médicos especializados para doctores
interface DoctorTelemedicineSession {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientBloodType: string;
  patientAllergies: string[];
  patientMedications: string[];
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  status: 'waiting' | 'active' | 'paused' | 'ended' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration?: number;
  type: 'video' | 'audio' | 'chat' | 'emergency';
  priority: 'routine' | 'urgent' | 'emergency' | 'critical';

  // Datos médicos específicos para doctores
  medicalData: {
    chiefComplaint: string;
    presentIllness: string;
    vitalSigns?: {
      bloodPressure?: { systolic: number; diastolic: number };
      heartRate?: number;
      temperature?: number;
      oxygenSaturation?: number;
      respiratoryRate?: number;
    };
    symptoms: string[];
    assessmentNotes: string;
    differentialDiagnosis: string[];
    workingDiagnosis?: string;
    treatmentPlan: string[];
    prescriptions: MedicalPrescription[];
    followUpInstructions: string;
    referrals: MedicalReferral[];
  };

  // Control de calidad y cumplimiento
  qualityMetrics: {
    audioQuality: 'excellent' | 'good' | 'fair' | 'poor';
    videoQuality: 'excellent' | 'good' | 'fair' | 'poor';
    connectionStability: 'stable' | 'unstable' | 'poor';
    patientSatisfaction?: number; // 1-5
    technicalIssues: string[];
  };

  // Auditoría médica y legal
  auditTrail: {
    sessionRecorded: boolean;
    consentObtained: boolean;
    hipaaCompliant: boolean;
    dataEncrypted: boolean;
    accessLog: AuditLogEntry[];
  };

  createdAt: string;
  updatedAt: string;
}

interface MedicalPrescription {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  refills: number;
  genericAllowed: boolean;
  interactions: string[];
  sideEffects: string[];
}

interface MedicalReferral {
  id: string;
  specialty: string;
  reason: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  preferredProvider?: string;
  instructions: string;
}

interface AuditLogEntry {
  timestamp: string;
  action: string;
  userId: string;
  details: string;
  ipAddress?: string;
}

interface MedicalChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  senderRole: 'doctor' | 'patient' | 'system';
  message: string;
  timestamp: string;
  messageType: 'text' | 'medical_note' | 'prescription' | 'vital_signs' | 'system_alert';

  // Datos médicos específicos
  medicalContext?: {
    isConfidential: boolean;
    requiresAcknowledgment: boolean;
    category: 'diagnosis' | 'treatment' | 'medication' | 'follow_up' | 'general';
    urgency: 'low' | 'medium' | 'high' | 'critical';
  };

  acknowledged?: boolean;
  acknowledgedAt?: string;
}

interface DoctorVitalSigns {
  sessionId: string;
  patientId: string;
  recordedBy: string;
  timestamp: string;

  // Signos vitales
  bloodPressure?: {
    systolic: number;
    diastolic: number;
    confidence: 'high' | 'medium' | 'low';
  };
  heartRate?: {
    value: number;
    rhythm: 'regular' | 'irregular';
    confidence: 'high' | 'medium' | 'low';
  };
  temperature?: {
    value: number;
    method: 'oral' | 'axillary' | 'rectal' | 'temporal';
    confidence: 'high' | 'medium' | 'low';
  };
  oxygenSaturation?: {
    value: number;
    onSupplemental: boolean;
    confidence: 'high' | 'medium' | 'low';
  };
  respiratoryRate?: {
    value: number;
    quality: 'normal' | 'labored' | 'shallow';
    confidence: 'high' | 'medium' | 'low';
  };

  // Contexto médico
  clinicalContext: {
    patientState: 'stable' | 'improving' | 'declining' | 'critical';
    measurementReliability: 'high' | 'medium' | 'low';
    environmentalFactors: string[];
    notes: string;
  };
}

interface UseTelemedicineDoctorHybridConfig {
  doctorId: string;
  doctorName: string;
  specialty: string;
  signaling?: {
    url?: string;
    options?: any;
  };
  firebase?: {
    enabled?: boolean;
    collections?: {
      sessions?: string;
      messages?: string;
      vitalSigns?: string;
      auditLogs?: string;
    };
  };
  medical?: {
    autoSaveInterval?: number;
    requireConsentForRecording?: boolean;
    enableAuditTrail?: boolean;
    hipaaMode?: boolean;
  };
}

interface UseTelemedicineDoctorHybridReturn {
  // Estado de sesión
  session: DoctorTelemedicineSession | null;
  sessions: DoctorTelemedicineSession[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Socket y conexión
  socket: Socket | null;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';

  // Chat médico
  chatMessages: MedicalChatMessage[];
  unreadCount: number;

  // Signos vitales
  vitalSignsHistory: DoctorVitalSigns[];
  currentVitalSigns: DoctorVitalSigns | null;

  // Funciones principales
  createSession: (sessionData: Partial<DoctorTelemedicineSession>) => Promise<string>;
  joinSession: (sessionId: string) => Promise<void>;
  leaveSession: () => Promise<void>;
  endSession: (sessionId: string, sessionSummary: any) => Promise<void>;

  // Chat médico
  sendMessage: (message: string, messageType?: MedicalChatMessage['messageType']) => Promise<void>;
  sendMedicalNote: (note: string, category: string, urgency: string) => Promise<void>;
  acknowledgeMessage: (messageId: string) => Promise<void>;

  // Signos vitales
  recordVitalSigns: (vitalSigns: Partial<DoctorVitalSigns>) => Promise<void>;
  updatePatientStatus: (status: string, notes: string) => Promise<void>;

  // Prescripciones y diagnósticos
  addPrescription: (prescription: Omit<MedicalPrescription, 'id'>) => Promise<void>;
  updateDiagnosis: (diagnosis: string, confidence: string) => Promise<void>;
  addReferral: (referral: Omit<MedicalReferral, 'id'>) => Promise<void>;

  // Control de sesión
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  transferSession: (newDoctorId: string, reason: string) => Promise<void>;

  // Calidad y métricas
  updateQualityMetrics: (
    metrics: Partial<DoctorTelemedicineSession['qualityMetrics']>,
  ) => Promise<void>;
  reportTechnicalIssue: (issue: string) => Promise<void>;

  // Auditoría
  getAuditTrail: (sessionId: string) => Promise<AuditLogEntry[]>;
  logMedicalAction: (action: string, details: any) => Promise<void>;
}

export function useTelemedicineDoctorHybrid(
  config: UseTelemedicineDoctorHybridConfig,
): UseTelemedicineDoctorHybridReturn {
  // Estados principales
  const [session, setSession] = useState<DoctorTelemedicineSession | null>(null);
  const [sessions, setSessions] = useState<DoctorTelemedicineSession[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<
    'excellent' | 'good' | 'fair' | 'poor'
  >('good');

  // Chat médico
  const [chatMessages, setChatMessages] = useState<MedicalChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Signos vitales
  const [vitalSignsHistory, setVitalSignsHistory] = useState<DoctorVitalSigns[]>([]);
  const [currentVitalSigns, setCurrentVitalSigns] = useState<DoctorVitalSigns | null>(null);

  // Referencias
  const socketRef = useRef<Socket | null>(null);
  const firestore = useRef<any>(null);
  const autoSaveInterval = useRef<NodeJS.Timeout | null>(null);

  // Configuración
  const signaling = config.signaling || {};
  const firebase = config.firebase || { enabled: true };
  const medical = config.medical || {};
  const collections = firebase.collections || {
    sessions: 'telemedicine_sessions_doctors',
    messages: 'telemedicine_messages_doctors',
    vitalSigns: 'vital_signs_doctors',
    auditLogs: 'audit_logs_doctors',
  };

  // Inicializar Firebase
  useEffect(() => {
    if (firebase.enabled) {
      try {
        firestore.current = getFirestore();
      } catch (err) {
        logger.warn('Firebase no disponible, usando solo Socket.IO:', err as any);
      }
    }
  }, [firebase.enabled]);

  // Inicializar Socket.IO
  useEffect(() => {
    const signalingUrl = signaling.url || 'ws://localhost:8888';

    try {
      const socketInstance = io(signalingUrl, {
        ...signaling.options,
        query: {
          userId: config.doctorId,
          userType: 'doctor',
          specialty: config.specialty,
        },
      });

      socketRef.current = socketInstance;
      setSocket(socketInstance);

      // Eventos de conexión
      socketInstance.on('connect', () => {
        setIsConnected(true);
        setError(null);
        logMedicalAction('socket_connected', { doctorId: config.doctorId });
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
        setConnectionQuality('poor');
      });

      socketInstance.on('connect_error', (err: any) => {
        setError(`Error de conexión: ${(err as any).message}`);
        setIsConnected(false);
      });

      // Eventos médicos específicos
      socketInstance.on('medical_session_created', (sessionData: DoctorTelemedicineSession) => {
        setSession(sessionData);
        logMedicalAction('session_created', sessionData);
      });

      socketInstance.on('medical_session_updated', (sessionData: DoctorTelemedicineSession) => {
        setSession(sessionData);
        // Autosave a Firebase si está habilitado
        if (firestore.current) {
          const sessionRef = doc(firestore.current, collections.sessions!, sessionData.id);
          updateDoc(sessionRef, {
            ...sessionData,
            updatedAt: serverTimestamp(),
          }).catch(console.error);
        }
      });

      socketInstance.on('medical_message_received', (message: MedicalChatMessage) => {
        setChatMessages((prev) => [...prev, message]);
        if (message.senderRole === 'patient') {
          setUnreadCount((prev) => prev + 1);
        }

        // Persistir en Firebase
        if (firestore.current) {
          addDoc(collection(firestore.current, collections.messages!), message).catch(
            console.error,
          );
        }
      });

      socketInstance.on('vital_signs_received', (vitalSigns: DoctorVitalSigns) => {
        setCurrentVitalSigns(vitalSigns);
        setVitalSignsHistory((prev) => [...prev, vitalSigns]);

        // Persistir en Firebase
        if (firestore.current) {
          addDoc(collection(firestore.current, collections.vitalSigns!), vitalSigns).catch(
            console.error,
          );
        }
      });

      socketInstance.on('quality_metrics_update', (metrics: any) => {
        if (metrics.connectionQuality) {
          setConnectionQuality(metrics.connectionQuality);
        }
      });

      socketInstance.on('medical_alert', (alert: any) => {
        // Manejar alertas médicas críticas
        logger.warn('Alerta médica recibida:', alert);
        if (alert.priority === 'critical') {
          // Notificación inmediata
          if ('Notification' in window) {
            new Notification(`Alerta Crítica: ${alert.message}`, {
              icon: '/medical-alert-icon.png',
              requireInteraction: true,
            });
          }
        }
      });

      return () => {
        socketInstance.disconnect();
        socketRef.current = null;
      };
    } catch (err) {
      setError(`Error al inicializar Socket.IO: ${err as any}`);
    }
  }, [config.doctorId, config.specialty, signaling.url]);

  // Listeners de Firebase para sesiones
  useEffect(() => {
    if (!firestore.current) return;

    const sessionsQuery = query(
      collection(firestore.current, collections.sessions!),
      where('doctorId', '==', config.doctorId),
      where('status', 'in', ['waiting', 'active', 'paused']),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(sessionsQuery, (snapshot) => {
      const sessionsList = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as DoctorTelemedicineSession,
      );

      setSessions(sessionsList);
    });

    return unsubscribe;
  }, [config.doctorId, collections.sessions]);

  // Auto-guardado médico
  useEffect(() => {
    if (medical.autoSaveInterval && session) {
      autoSaveInterval.current = setInterval(() => {
        if (session && firestore.current) {
          const sessionRef = doc(firestore.current, collections.sessions!, session.id);
          updateDoc(sessionRef, {
            ...session,
            updatedAt: serverTimestamp(),
          }).catch(console.error);
        }
      }, medical.autoSaveInterval);

      return () => {
        if (autoSaveInterval.current) {
          clearInterval(autoSaveInterval.current);
        }
      };
    }
  }, [session, medical.autoSaveInterval]);

  // Funciones principales
  const createSession = useCallback(
    async (sessionData: Partial<DoctorTelemedicineSession>): Promise<string> => {
      setIsLoading(true);
      setError(null);

      try {
        const newSession: any = {
          id: `session_${Date.now()}_${config.doctorId}`,
          doctorId: config.doctorId,
          doctorName: config.doctorName,
          doctorSpecialty: config.specialty,
          status: 'waiting',
          type: 'video',
          priority: 'routine',
          medicalData: {
            chiefComplaint: '',
            presentIllness: '',
            symptoms: [],
            assessmentNotes: '',
            differentialDiagnosis: [],
            treatmentPlan: [],
            prescriptions: [],
            followUpInstructions: '',
            referrals: [],
          },
          qualityMetrics: {
            audioQuality: 'good',
            videoQuality: 'good',
            connectionStability: 'stable',
            technicalIssues: [],
          },
          auditTrail: {
            sessionRecorded: medical.requireConsentForRecording || false,
            consentObtained: false,
            hipaaCompliant: medical.hipaaMode || true,
            dataEncrypted: true,
            accessLog: [],
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...sessionData,
        };

        // Crear en Firebase primero
        if (firestore.current) {
          const docRef = await addDoc(
            collection(firestore.current, collections.sessions!),
            newSession,
          );
          newSession.id = docRef.id;

          await updateDoc(docRef, { id: docRef.id });
        }

        // Notificar via Socket.IO
        if (socket) {
          socket.emit('create_medical_session', newSession);
        }

        setSession(newSession);
        await logMedicalAction('session_created', { sessionId: newSession.id });

        return newSession.id;
      } catch (err) {
        const errorMsg = `Error al crear sesión médica: ${err as any}`;
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [config.doctorId, config.doctorName, config.specialty, socket, firestore.current],
  );

  const joinSession = useCallback(
    async (sessionId: string): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        if (socket) {
          socket.emit('join_medical_session', {
            sessionId,
            doctorId: config.doctorId,
            doctorName: config.doctorName,
            specialty: config.specialty,
          });
        }

        // Cargar datos de Firebase
        if (firestore.current) {
          // Cargar mensajes
          const messagesQuery = query(
            collection(firestore.current, collections.messages!),
            where('sessionId', '==', sessionId),
            orderBy('timestamp', 'asc'),
          );

          const messagesSnapshot = await (messagesQuery as any).get();
          const messages = messagesSnapshot.docs.map(
            (doc: any) =>
              ({
                id: doc.id,
                ...doc.data(),
              }) as MedicalChatMessage,
          );

          setChatMessages(messages);

          // Cargar signos vitales
          const vitalSignsQuery = query(
            collection(firestore.current, collections.vitalSigns!),
            where('sessionId', '==', sessionId),
            orderBy('timestamp', 'desc'),
          );

          const vitalSignsSnapshot = await (vitalSignsQuery as any).get();
          const vitalSigns = vitalSignsSnapshot.docs.map(
            (doc: any) =>
              ({
                id: doc.id,
                ...doc.data(),
              }) as DoctorVitalSigns,
          );

          setVitalSignsHistory(vitalSigns);
          if (vitalSigns.length > 0) {
            setCurrentVitalSigns(vitalSigns[0]);
          }
        }

        await logMedicalAction('session_joined', { sessionId });
      } catch (err) {
        setError(`Error al unirse a la sesión: ${err as any}`);
      } finally {
        setIsLoading(false);
      }
    },
    [socket, config.doctorId, config.doctorName, config.specialty],
  );

  const sendMedicalNote = useCallback(
    async (note: string, category: string, urgency: string): Promise<void> => {
      if (!session || !socket) return;

      const message: MedicalChatMessage = {
        id: `msg_${Date.now()}_${config.doctorId}`,
        sessionId: session.id,
        senderId: config.doctorId,
        senderName: config.doctorName,
        senderRole: 'doctor',
        message: note,
        timestamp: new Date().toISOString(),
        messageType: 'medical_note',
        medicalContext: {
          isConfidential: true,
          requiresAcknowledgment: urgency === 'critical',
          category: category as any,
          urgency: urgency as any,
        },
      };

      // Enviar via Socket.IO
      socket.emit('send_medical_message', message);

      // Persistir en Firebase
      if (firestore.current) {
        await addDoc(collection(firestore.current, collections.messages!), message);
      }

      setChatMessages((prev) => [...prev, message]);
      await logMedicalAction('medical_note_sent', { messageId: message.id, category, urgency });
    },
    [session, socket, config.doctorId, config.doctorName],
  );

  const recordVitalSigns = useCallback(
    async (vitalSignsData: Partial<DoctorVitalSigns>): Promise<void> => {
      if (!session) return;

      const vitalSigns: DoctorVitalSigns = {
        sessionId: session.id,
        patientId: session.patientId,
        recordedBy: config.doctorId,
        timestamp: new Date().toISOString(),
        clinicalContext: {
          patientState: 'stable',
          measurementReliability: 'high',
          environmentalFactors: [],
          notes: '',
        },
        ...vitalSignsData,
      };

      // Enviar via Socket.IO
      if (socket) {
        socket.emit('record_vital_signs', vitalSigns);
      }

      // Persistir en Firebase
      if (firestore.current) {
        await addDoc(collection(firestore.current, collections.vitalSigns!), vitalSigns);
      }

      setCurrentVitalSigns(vitalSigns);
      setVitalSignsHistory((prev) => [vitalSigns, ...prev]);

      await logMedicalAction('vital_signs_recorded', { vitalSigns });
    },
    [session, socket, config.doctorId],
  );

  const addPrescription = useCallback(
    async (prescriptionData: Omit<MedicalPrescription, 'id'>): Promise<void> => {
      if (!session) return;

      const prescription: MedicalPrescription = {
        id: `rx_${Date.now()}_${config.doctorId}`,
        ...prescriptionData,
      };

      const updatedSession = {
        ...session,
        medicalData: {
          ...session.medicalData,
          prescriptions: [...session.medicalData.prescriptions, prescription],
        },
        updatedAt: new Date().toISOString(),
      };

      setSession(updatedSession);

      // Actualizar en Firebase
      if (firestore.current) {
        const sessionRef = doc(firestore.current, collections.sessions!, session.id);
        await updateDoc(sessionRef, {
          medicalData: updatedSession.medicalData,
          updatedAt: serverTimestamp(),
        });
      }

      // Notificar via Socket.IO
      if (socket) {
        socket.emit('prescription_added', {
          sessionId: session.id,
          prescription,
        });
      }

      await logMedicalAction('prescription_added', {
        prescriptionId: prescription.id,
        medication: prescription.medicationName,
      });
    },
    [session, socket, config.doctorId],
  );

  const endSession = useCallback(
    async (sessionId: string, sessionSummary: any): Promise<void> => {
      setIsLoading(true);

      try {
        const endTime = new Date().toISOString();
        const updatedSession = {
          ...session!,
          status: 'ended' as const,
          endTime,
          duration: session
            ? Math.floor(
                (new Date(endTime).getTime() - new Date(session.startTime).getTime()) / 1000,
              )
            : 0,
          ...sessionSummary,
          updatedAt: endTime,
        };

        // Actualizar en Firebase
        if (firestore.current) {
          const sessionRef = doc(firestore.current, collections.sessions!, sessionId);
          await updateDoc(sessionRef, {
            status: 'ended',
            endTime,
            duration: updatedSession.duration,
            updatedAt: serverTimestamp(),
            ...sessionSummary,
          });
        }

        // Notificar via Socket.IO
        if (socket) {
          socket.emit('end_medical_session', {
            sessionId,
            summary: sessionSummary,
          });
        }

        setSession(null);
        setChatMessages([]);
        setCurrentVitalSigns(null);

        await logMedicalAction('session_ended', { sessionId, duration: updatedSession.duration });
      } catch (err) {
        setError(`Error al finalizar sesión: ${String(err)}`);
      } finally {
        setIsLoading(false);
      }
    },
    [session, socket],
  );

  const logMedicalAction = useCallback(
    async (action: string, details: any): Promise<void> => {
      if (!medical.enableAuditTrail) return;

      const auditEntry: AuditLogEntry = {
        timestamp: new Date().toISOString(),
        action,
        userId: config.doctorId,
        details: JSON.stringify(details),
        ipAddress: window.location.hostname,
      };

      if (firestore.current) {
        try {
          await addDoc(collection(firestore.current, collections.auditLogs!), auditEntry);
        } catch (err) {
          logger.error('Error logging medical action:', err as any);
        }
      }
    },
    [config.doctorId, medical.enableAuditTrail],
  );

  // Funciones simplificadas para las restantes
  const leaveSession = useCallback(async (): Promise<void> => {
    if (socket && session) {
      socket.emit('leave_medical_session', { sessionId: session.id });
      setSession(null);
      setChatMessages([]);
      await logMedicalAction('session_left', { sessionId: session.id });
    }
  }, [socket, session]);

  const sendMessage = useCallback(
    async (
      message: string,
      messageType: MedicalChatMessage['messageType'] = 'text',
    ): Promise<void> => {
      await sendMedicalNote(message, 'general', 'low');
    },
    [sendMedicalNote],
  );

  const acknowledgeMessage = useCallback(
    async (messageId: string): Promise<void> => {
      // Implementar lógica de acknowledgment
      if (socket) {
        socket.emit('acknowledge_message', { messageId });
      }
    },
    [socket],
  );

  const updatePatientStatus = useCallback(
    async (status: string, notes: string): Promise<void> => {
      if (!session) return;

      const updatedSession = {
        ...session,
        medicalData: {
          ...session.medicalData,
          assessmentNotes: `${session.medicalData.assessmentNotes}\n[${new Date().toLocaleTimeString()}] Estado: ${status} - ${notes}`,
        },
      };

      setSession(updatedSession);

      if (firestore.current) {
        const sessionRef = doc(firestore.current, collections.sessions!, session.id);
        await updateDoc(sessionRef, {
          medicalData: updatedSession.medicalData,
          updatedAt: serverTimestamp(),
        });
      }
    },
    [session],
  );

  const updateDiagnosis = useCallback(
    async (diagnosis: string, confidence: string): Promise<void> => {
      if (!session) return;

      const updatedSession = {
        ...session,
        medicalData: {
          ...session.medicalData,
          workingDiagnosis: diagnosis,
        },
      };

      setSession(updatedSession);
      await logMedicalAction('diagnosis_updated', { diagnosis, confidence });
    },
    [session],
  );

  const addReferral = useCallback(
    async (referralData: Omit<MedicalReferral, 'id'>): Promise<void> => {
      if (!session) return;

      const referral: MedicalReferral = {
        id: `ref_${Date.now()}`,
        ...referralData,
      };

      const updatedSession = {
        ...session,
        medicalData: {
          ...session.medicalData,
          referrals: [...session.medicalData.referrals, referral],
        },
      };

      setSession(updatedSession);
      await logMedicalAction('referral_added', { referralId: referral.id });
    },
    [session],
  );

  const pauseSession = useCallback(async (): Promise<void> => {
    if (socket && session) {
      socket.emit('pause_session', { sessionId: session.id });
      setSession({ ...session, status: 'paused' });
    }
  }, [socket, session]);

  const resumeSession = useCallback(async (): Promise<void> => {
    if (socket && session) {
      socket.emit('resume_session', { sessionId: session.id });
      setSession({ ...session, status: 'active' });
    }
  }, [socket, session]);

  const transferSession = useCallback(
    async (newDoctorId: string, reason: string): Promise<void> => {
      if (socket && session) {
        socket.emit('transfer_session', {
          sessionId: session.id,
          newDoctorId,
          reason,
          currentDoctorId: config.doctorId,
        });
        await logMedicalAction('session_transferred', { newDoctorId, reason });
      }
    },
    [socket, session, config.doctorId],
  );

  const updateQualityMetrics = useCallback(
    async (metrics: Partial<DoctorTelemedicineSession['qualityMetrics']>): Promise<void> => {
      if (!session) return;

      const updatedSession = {
        ...session,
        qualityMetrics: {
          ...session.qualityMetrics,
          ...metrics,
        },
      };

      setSession(updatedSession);
    },
    [session],
  );

  const reportTechnicalIssue = useCallback(
    async (issue: string): Promise<void> => {
      if (!session) return;

      const updatedSession = {
        ...session,
        qualityMetrics: {
          ...session.qualityMetrics,
          technicalIssues: [...session.qualityMetrics.technicalIssues, issue],
        },
      };

      setSession(updatedSession);
      await logMedicalAction('technical_issue_reported', { issue });
    },
    [session],
  );

  const getAuditTrail = useCallback(async (sessionId: string): Promise<AuditLogEntry[]> => {
    if (!firestore.current) return [];

    try {
      const auditQuery = query(
        collection(firestore.current, collections.auditLogs!),
        where('details', 'array-contains-any', [sessionId]),
        orderBy('timestamp', 'desc'),
      );

      const snapshot = await (auditQuery as any).get();
      return snapshot.docs.map((doc: any) => doc.data() as AuditLogEntry);
    } catch (err) {
      logger.error('Error fetching audit trail:', err as any);
      return [];
    }
  }, []);

  return {
    // Estado
    session,
    sessions,
    isConnected,
    isLoading,
    error,
    socket,
    connectionQuality,

    // Chat
    chatMessages,
    unreadCount,

    // Signos vitales
    vitalSignsHistory,
    currentVitalSigns,

    // Funciones principales
    createSession,
    joinSession,
    leaveSession,
    endSession,

    // Chat médico
    sendMessage,
    sendMedicalNote,
    acknowledgeMessage,

    // Signos vitales
    recordVitalSigns,
    updatePatientStatus,

    // Prescripciones y diagnósticos
    addPrescription,
    updateDiagnosis,
    addReferral,

    // Control de sesión
    pauseSession,
    resumeSession,
    transferSession,

    // Calidad
    updateQualityMetrics,
    reportTechnicalIssue,

    // Auditoría
    getAuditTrail,
    logMedicalAction,
  };
}
