import { adminDb } from '@/lib/firebase-admin';
import { createAppointmentSchema } from '@/lib/schemas/appointment.schema';

export class AppointmentService {
  private static db = adminDb;

  /**
   * Obtiene todas las citas de la base de datos.
   * @returns Una promesa que se resuelve con un array de citas.
   */
  static async getAllAppointments() {
    if (!this.db) throw new Error('Firebase Admin no está inicializado');
    
    const appointmentsSnapshot = await this.db.collection('appointments').get();
    const appointments = appointmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    return appointments;
  }

  /**
   * Obtiene una cita específica por ID.
   * @param id - El ID de la cita.
   * @returns Una promesa que se resuelve con la cita o null si no se encuentra.
   */
  static async getAppointmentById(id: string) {
    if (!this.db) throw new Error('Firebase Admin no está inicializado');
    
    const appointmentDoc = await this.db.collection('appointments').doc(id).get();
    if (!appointmentDoc.exists) {
      return null;
    }
    return {
      id: appointmentDoc.id,
      ...appointmentDoc.data(),
    };
  }

  /**
   * Crea una nueva cita.
   * @param appointmentData - Los datos de la cita.
   * @returns Una promesa que se resuelve con la cita creada.
   */
  static async createAppointment(appointmentData: any) {
    if (!this.db) throw new Error('Firebase Admin no está inicializado');
    
    // Validar datos con esquema
    const validatedData = createAppointmentSchema.parse(appointmentData);
    
    const newAppointmentRef = await this.db.collection('appointments').add({
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    return {
      id: newAppointmentRef.id,
      ...validatedData,
    };
  }

  /**
   * Actualiza una cita existente.
   * @param id - El ID de la cita.
   * @param updateData - Los datos actualizados.
   * @returns Una promesa que se resuelve con la cita actualizada.
   */
  static async updateAppointment(id: string, updateData: any) {
    if (!this.db) throw new Error('Firebase Admin no está inicializado');
    
    await this.db.collection('appointments').doc(id).update({
      ...updateData,
      updatedAt: new Date(),
    });
    
    return this.getAppointmentById(id);
  }

  /**
   * Elimina una cita.
   * @param id - El ID de la cita.
   * @returns Una promesa que se resuelve cuando la cita es eliminada.
   */
  static async deleteAppointment(id: string) {
    if (!this.db) throw new Error('Firebase Admin no está inicializado');
    
    await this.db.collection('appointments').doc(id).delete();
    return { success: true, message: 'Cita eliminada correctamente' };
  }
}
