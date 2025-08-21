// ARCHIVO CONSOLIDADO - Configuración centralizada Firebase
// Los tipos y configuraciones médicas han sido preservados y consolidados

export const firebaseConfig = {
  // Configuración del proyecto Firebase
  projectId: process.env.FIREBASE_PROJECT_ID || 'altamedica-medical',
  
  // Configuración de Firestore
  firestore: {
    // Colecciones principales del sistema médico
    collections: {
      users: 'users',
      patients: 'patients', 
      doctors: 'doctors',
      companies: 'companies',
      appointments: 'appointments',
      medicalRecords: 'medical_records',
      prescriptions: 'prescriptions',
      labResults: 'lab_results',
      telemedicineSessions: 'telemedicine_sessions',
      payments: 'payments',
      systemLogs: 'system_logs',
      alerts: 'alerts',
      analytics: 'analytics',
      compliance: 'compliance',
      security: 'security_events',
      auditLogs: 'audit_logs'
    },
    
    // Subcolecciones
    subcollections: {
      userSessions: 'sessions',
      userActivity: 'activity',
      appointmentHistory: 'history',
      medicalHistory: 'history',
      paymentHistory: 'history',
      chatMessages: 'chat_messages',
      notifications: 'notifications'
    }
  },
  
  // Configuración de autenticación (migrada a UnifiedAuthSystem)
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  // Configuración de seguridad
  security: {
    // Roles del sistema médico (compatibilidad con UserRole enum)
    roles: {
      admin: 'admin',
      doctor: 'doctor', 
      patient: 'patient',
      company: 'company',
      staff: 'staff'
    },
    
    // Permisos específicos para el sector médico
    permissions: {
      // Gestión de pacientes
      'patients:view': 'view_patients',
      'patients:create': 'create_patients',
      'patients:update': 'update_patients',
      'patients:delete': 'delete_patients',
      
      // Gestión de citas
      'appointments:view': 'view_appointments',
      'appointments:create': 'create_appointments',
      'appointments:update': 'update_appointments',
      'appointments:cancel': 'cancel_appointments',
      
      // Gestión médica
      'medical:read': 'view_medical_records',
      'medical:write': 'create_medical_records',
      'medical:update': 'update_medical_records',
      
      // Prescripciones
      'prescriptions:write': 'create_prescriptions',
      'prescriptions:view': 'view_prescriptions',
      
      // Telemedicina
      'telemedicine:access': 'access_telemedicine',
      'telemedicine:create': 'create_telemedicine_sessions',
      
      // Administración
      'admin:view': 'view_analytics',
      'users:manage': 'manage_users',
      'system:manage': 'manage_system',
      'compliance:view': 'view_compliance'
    }
  },
  
  // Configuración de cumplimiento médico (HIPAA/GDPR)
  compliance: {
    hipaa: {
      phiFields: ['ssn', 'medicalRecordNumber', 'diagnosis', 'treatment', 'medications', 'vitalSigns'],
      auditRequired: true,
      encryptionRequired: true,
      accessLogging: true,
      retentionPeriod: '6_years' // HIPAA requirement
    },
    
    gdpr: {
      dataRetention: '7_years',
      rightToBeForgotten: true,
      dataPortability: true,
      consentManagement: true
    }
  },
  
  // Configuración de monitoreo y métricas
  monitoring: {
    metrics: {
      responseTime: true,
      errorRate: true,
      userActivity: true,
      systemHealth: true,
      databasePerformance: true
    },
    
    alerts: {
      criticalThreshold: 95,
      warningThreshold: 80,
      notificationChannels: ['email', 'slack', 'dashboard']
    }
  }
};

// ============================================================================
// TIPOS MÉDICOS CONSOLIDADOS
// ============================================================================

export interface MedicalUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'doctor' | 'patient' | 'company' | 'staff';
  status: 'active' | 'inactive' | 'suspended';
  permissions: string[];
  isActive: boolean;
  
  // IDs relacionados
  patientId?: string;
  doctorId?: string;
  companyId?: string;
  
  profile: {
    phone?: string;
    avatar?: string;
    specialty?: string;
    licenseNumber?: string;
    department?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  
  medicalInfo?: {
    bloodType?: string;
    allergies?: string[];
    chronicConditions?: string[];
    medications?: string[];
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  lastLogoutAt?: Date;
  lastLoginIP?: string;
}

export interface MedicalAppointment {
  id: string;
  patientId: string;
  doctorId: string;
  companyId?: string;
  type: 'consultation' | 'follow-up' | 'telemedicine' | 'emergency' | 'screening';
  scheduledAt: Date;
  duration: number; // minutes
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  reason: string;
  notes?: string;
  
  // Medical data
  symptoms?: string[];
  diagnosis?: string;
  prescriptions?: string[];
  labOrders?: string[];
  
  // Follow-up
  followUpRequired: boolean;
  followUpDate?: Date;
  
  // Payment
  cost: number;
  currency: string;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'insurance';
  
  // Telemedicine
  roomId?: string;
  recordingUrl?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

export // Removed local interface - using @altamedica/types
import { MedicalRecord } from '@altamedica/types';;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
    oxygenSaturation?: number;
    respiratoryRate?: number;
    bmi?: number;
  };
  
  medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  
  labResults?: Array<{
    testName: string;
    value: string;
    unit: string;
    referenceRange: string;
    status: 'normal' | 'abnormal' | 'critical';
  }>;
  
  attachments?: Array<{
    id: string;
    type: 'image' | 'pdf' | 'lab-result' | 'x-ray' | 'scan';
    url: string;
    filename: string;
    description?: string;
    uploadedAt: Date;
  }>;
  
  // Privacy & compliance
  isConfidential: boolean;
  accessLog?: Array<{
    userId: string;
    accessedAt: Date;
    action: 'view' | 'edit' | 'download';
  }>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface TelemedicineSession {
  id: string;
  roomId: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  status: 'scheduled' | 'waiting' | 'active' | 'completed' | 'cancelled';
  
  // Session timing
  scheduledAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
  
  // Session data
  notes?: string;
  recordingUrl?: string;
  chatHistory?: Array<{
    id: string;
    senderId: string;
    senderType: 'patient' | 'doctor';
    message: string;
    timestamp: Date;
  }>;
  
  // Technical info
  connectionQuality?: 'excellent' | 'good' | 'poor';
  technicalIssues?: string[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalPayment {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  companyId?: string;
  
  // Payment details
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'disputed';
  paymentMethod: 'credit_card' | 'debit_card' | 'insurance' | 'cash' | 'bank_transfer';
  
  // External payment data
  paymentIntentId?: string; // Stripe/MercadoPago ID
  transactionId?: string;
  
  // Insurance info
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    coverage: number;
    copay: number;
    deductible: number;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
}

export interface SystemLog {
  id: string;
  level: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  category: 'auth' | 'appointment' | 'payment' | 'medical' | 'telemedicine' | 'system' | 'security' | 'compliance';
  message: string;
  
  // User context
  userId?: string;
  patientId?: string;
  doctorId?: string;
  
  // Request context
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  
  // Additional data
  metadata?: Record<string, any>;
  stackTrace?: string;
  
  // Timestamps
  createdAt: Date;
}

export interface SystemAlert {
  id: string;
  type: 'security' | 'performance' | 'compliance' | 'health' | 'maintenance' | 'medical';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  
  // Alert management
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  
  // Alert data
  affectedUsers?: string[];
  affectedSystems?: string[];
  recommendedActions?: string[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemMetrics {
  id: string;
  timestamp: Date;
  category: 'performance' | 'security' | 'compliance' | 'health' | 'usage';
  
  // System metrics
  metrics: {
    responseTime: number;
    errorRate: number;
    successRate: number;
    activeUsers: number;
    totalRequests: number;
    
    // Medical-specific metrics
    appointmentsCompleted: number;
    telemedicineSessions: number;
    prescriptionsFilled: number;
    
    // System health
    databaseConnections: number;
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    
    // Security metrics
    loginAttempts: number;
    failedLogins: number;
    suspiciousActivity: number;
  };
  
  metadata?: Record<string, any>;
}

// ============================================================================
// COLLECTION HELPERS
// ============================================================================

export const collections = firebaseConfig.firestore.collections;
export const subcollections = firebaseConfig.firestore.subcollections;

// Helper para obtener referencia de colección
export function getCollectionRef(collectionName: keyof typeof collections) {
  return collections[collectionName];
}

// Helper para obtener referencia de subcolección
export function getSubcollectionRef(subcollectionName: keyof typeof subcollections) {
  return subcollections[subcollectionName];
}

export default firebaseConfig;