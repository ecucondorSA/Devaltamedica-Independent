/**
 * 👨‍⚕️ DOCTOR SERVICE - ALTAMEDICA
 * Servicio para la gestión de la lógica de negocio de los doctores.
 */
import { adminDb } from '@/lib/firebase-admin';
import { z } from 'zod';
import { ServiceContext } from '@/lib/patterns/ServicePattern';

// Esquema para la actualización de la disponibilidad
export const AvailabilitySchema = z.record(z.array(z.object({
    start: z.string(), // ej: "09:00"
    end: z.string(),   // ej: "17:00"
})));

class DoctorService {
  private collectionName = 'doctors';

  /**
   * Obtiene la disponibilidad de un doctor.
   */
  async getAvailability(doctorId: string, context: ServiceContext): Promise<any> {
    // Cualquiera autenticado puede ver la disponibilidad de un doctor.
    const doc = await adminDb.collection(this.collectionName).doc(doctorId).get();
    if (!doc.exists) {
      throw new Error('NOT_FOUND');
    }
    return doc.data()?.availability || {};
  }

  /**
   * Actualiza la disponibilidad de un doctor.
   */
  async updateAvailability(doctorId: string, availability: z.infer<typeof AvailabilitySchema>, context: ServiceContext): Promise<any> {
    // Solo el propio doctor o un admin pueden actualizar la disponibilidad.
    if (context.userRole !== 'admin' && context.userId !== doctorId) {
      throw new Error('FORBIDDEN');
    }

    const validatedAvailability = AvailabilitySchema.parse(availability);

    const docRef = adminDb.collection(this.collectionName).doc(doctorId);
    if (!(await docRef.get()).exists) {
      throw new Error('NOT_FOUND');
    }

    await docRef.update({
      availability: validatedAvailability,
      updatedAt: new Date(),
    });

    return validatedAvailability;
  }
  /**
   * Obtiene la lista de pacientes de un doctor.
   */
  async getPatients(doctorId: string, context: ServiceContext): Promise<any[]> {
    // Solo el propio doctor o un admin pueden ver la lista de pacientes.
    if (context.userRole !== 'admin' && context.userId !== doctorId) {
      throw new Error('FORBIDDEN');
    }

    const appointmentsSnapshot = await adminDb.collection('appointments')
      .where('doctorId', '==', doctorId)
      .get();

    if (appointmentsSnapshot.empty) {
      return [];
    }

    const patientIds = [...new Set(appointmentsSnapshot.docs.map(doc => doc.data().patientId))];

    if (patientIds.length === 0) {
        return [];
    }

    // Obtener los perfiles de los pacientes
    const patientsSnapshot = await adminDb.collection('users')
        .where(adminDb.FieldPath.documentId(), 'in', patientIds)
        .get();
        
    return patientsSnapshot.docs.map(doc => ({
        id: doc.id,
        firstName: doc.data().firstName,
        lastName: doc.data().lastName,
        email: doc.data().email,
    }));
  }
}

export const doctorService = new DoctorService();
