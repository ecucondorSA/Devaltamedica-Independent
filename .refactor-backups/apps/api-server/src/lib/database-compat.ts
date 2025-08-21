/**
import { logger } from '@altamedica/shared/services/logger.service';

 * 🔄 DATABASE COMPATIBILITY LAYER - ALTAMEDICA
 * Capa de compatibilidad para migrar de database local a @altamedica/database
 * Este archivo proporcionaa un wrapper temporal mientras se migra todo el código
 */

import {
    appointmentRepository,
    dbConnection,
    doctorRepository,
    initializeAltaMedicaDatabase,
    medicalRecordRepository,
    patientRepository,
    type ServiceContext
} from '@altamedica/database';

// Inicializar la base de datos centralizada
let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await initializeAltaMedicaDatabase();
    initialized = true;
  }
}

// ServiceContext por defecto para compat (ajustar si se dispone de contexto real por request)
function defaultContext(): ServiceContext {
  return {
    userId: 'system',
    userRole: 'admin'
  };
}

/**
 * Capa de compatibilidad para patientsDb
 * Mapea las funciones del sistema anterior a los nuevos repositorios
 */
export const patientsDb = {
  async create(patientData: any) {
    await ensureInitialized();
    return await patientRepository.create(patientData, defaultContext());
  },

  async findById(id: string) {
    await ensureInitialized();
    return await patientRepository.findById(id, defaultContext());
  },

  async findByEmail(email: string) {
    await ensureInitialized();
    return await patientRepository.findByEmail(email, defaultContext());
  },

  async update(id: string, updateData: any) {
    await ensureInitialized();
    return await patientRepository.update(id, updateData, defaultContext());
  },

  async delete(id: string) {
    await ensureInitialized();
    return await patientRepository.delete(id, defaultContext());
  },

  async search(filters: any) {
    await ensureInitialized();
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const res = await patientRepository.findMany({ limit }, defaultContext());
    return {
      patients: res.data,
      total: res.total,
      hasMore: res.hasMore,
      page,
      limit
    };
  }
};

/**
 * Capa de compatibilidad para doctorsDb
 */
export const doctorsDb = {
  async create(doctorData: any) {
    await ensureInitialized();
  return await doctorRepository.create(doctorData, defaultContext());
  },

  async findById(id: string) {
    await ensureInitialized();
  return await doctorRepository.findById(id, defaultContext());
  },

  async findBySpecialty(specialty: string) {
    await ensureInitialized();
  const res = await doctorRepository.findBySpecialty(specialty, defaultContext());
  return res.data;
  },

  async update(id: string, updateData: any) {
    await ensureInitialized();
  return await doctorRepository.update(id, updateData, defaultContext());
  }
};

/**
 * Capa de compatibilidad para appointmentsDb
 */
export const appointmentsDb = {
  async create(appointmentData: any) {
    await ensureInitialized();
  return await appointmentRepository.createWithAppointmentNumber(appointmentData, defaultContext());
  },

  async findById(id: string) {
    await ensureInitialized();
  return await appointmentRepository.findById(id, defaultContext());
  },

  async findByPatient(patientId: string, filters?: any) {
    await ensureInitialized();
  const res = await appointmentRepository.findByPatient(patientId, defaultContext(), filters);
  return res.data;
  },

  async findByDoctor(doctorId: string, filters?: any) {
    await ensureInitialized();
  const res = await appointmentRepository.findByDoctor(doctorId, defaultContext(), filters);
  return res.data;
  },

  async update(id: string, updateData: any) {
    await ensureInitialized();
  return await appointmentRepository.update(id, updateData, defaultContext());
  }
};

/**
 * Capa de compatibilidad para medicalRecordsDb
 */
export const medicalRecordsDb = {
  async create(recordData: any) {
    await ensureInitialized();
  return await medicalRecordRepository.create(recordData, defaultContext());
  },

  async findByPatient(patientId: string) {
    await ensureInitialized();
  const res = await medicalRecordRepository.findByPatientId(patientId, defaultContext());
  return res?.data ?? [];
  },

  async findById(id: string) {
    await ensureInitialized();
  return await medicalRecordRepository.findById(id, defaultContext());
  }
};

/**
 * Funciones de inicialización y utilidades
 */
export async function initializeDatabase(): Promise<void> {
  logger.info('🔄 Inicializando base de datos (usando @altamedica/database)...');
  
  try {
    await initializeAltaMedicaDatabase();
    initialized = true;
    logger.info('✅ Base de datos inicializada correctamente');
  } catch (error) {
    logger.error('❌ Error inicializando base de datos:', undefined, error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  // La conexión de @altamedica/database maneja su propio ciclo de vida
  logger.info('✅ Conexión de base de datos cerrada (centralizada)');
}

export function getDatabaseConnection() {
  return dbConnection;
}

// Export por defecto con compatibilidad
export default {
  patients: patientsDb,
  doctors: doctorsDb,
  appointments: appointmentsDb,
  medicalRecords: medicalRecordsDb,
  initialize: initializeDatabase,
  close: closeDatabase,
  connection: getDatabaseConnection
};