/**
 * 🩺 TELEMEDICINE SESSION SERVICE - ALTAMEDICA
 * Servicio para la gestión de la entidad de sesión de telemedicina en la base de datos.
 */
import { adminDb } from '@/lib/firebase-admin';
import { z } from 'zod';
import { BaseService, ServiceContext } from '@/lib/patterns/ServicePattern';

// Esquema de Zod para la validación de una sesión de telemedicina.
export const TelemedicineSessionSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  appointmentId: z.string(),
  status: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show']),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  durationMinutes: z.number().optional(),
  platformUrl: z.string().url().optional(),
  notes: z.string().optional(),
  recordings: z.array(z.object({
    url: z.string().url(),
    size: z.number(),
    duration: z.number(),
  })).optional(),
});

export interface TelemedicineSession extends z.infer<typeof TelemedicineSessionSchema> {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

class TelemedicineSessionService extends BaseService<TelemedicineSession> {
  protected collectionName = 'telemedicine_sessions';
  protected entitySchema = TelemedicineSessionSchema;

  async findById(id: string, context: ServiceContext): Promise<TelemedicineSession | null> {
    const doc = await adminDb.collection(this.collectionName).doc(id).get();
    if (!doc.exists) {
      return null;
    }

    const session = { id: doc.id, ...doc.data() } as TelemedicineSession;

    // Lógica de permisos: solo el paciente, doctor o un admin pueden ver la sesión.
    if (context.userRole !== 'admin' && session.patientId !== context.userId && session.doctorId !== context.userId) {
      return null;
    }
    
    return session;
  }

  async update(id: string, data: Partial<TelemedicineSession>, context: ServiceContext): Promise<TelemedicineSession> {
    const validatedData = this.validateUpdate(data);

    const docRef = adminDb.collection(this.collectionName).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error('NOT_FOUND');
    }
    
    // Lógica de permisos: solo el doctor o un admin pueden actualizar la sesión.
    if (context.userRole !== 'admin' && doc.data()?.doctorId !== context.userId) {
        throw new Error('FORBIDDEN');
    }

    const updatePayload = {
      ...validatedData,
      updatedAt: new Date(),
      updatedBy: context.userId,
    };

    await docRef.update(updatePayload);
    await this.logAction('update', id, context, { updatedFields: Object.keys(validatedData) });

    return (await this.findById(id, context))!;
  }

  async delete(id: string, context: ServiceContext): Promise<boolean> {
    const docRef = adminDb.collection(this.collectionName).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return false;
    }

    // Lógica de permisos: solo un admin puede eliminar (borrado lógico).
    if (context.userRole !== 'admin') {
        throw new Error('FORBIDDEN');
    }

    // Borrado lógico: se cancela la sesión.
    await docRef.update({
      status: 'cancelled',
      updatedAt: new Date(),
      updatedBy: context.userId,
    });

    await this.logAction('delete', id, context, { reason: 'cancelled by admin' });
    return true;
  }

  /**
   * Permite a un usuario unirse a una sesión de telemedicina.
   */
  async joinSession(id: string, context: ServiceContext): Promise<{ session: TelemedicineSession; accessToken: string }> {
    const docRef = adminDb.collection(this.collectionName).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error('NOT_FOUND');
    }

    const session = { id: doc.id, ...doc.data() } as TelemedicineSession;

    // 1. Validar permisos: solo el paciente o el doctor de la sesión pueden unirse.
    if (session.patientId !== context.userId && session.doctorId !== context.userId) {
      throw new Error('FORBIDDEN');
    }

    // 2. Validar estado de la sesión: no se puede unir a una sesión completada o cancelada.
    if (['completed', 'cancelled', 'no-show'].includes(session.status)) {
      throw new Error(`BAD_REQUEST: Cannot join a session that is already ${session.status}.`);
    }

    // 3. Actualizar el estado de la sesión a "in-progress" si es la primera persona en unirse.
    if (session.status === 'scheduled') {
      const updatePayload = {
        status: 'in-progress' as const,
        startTime: new Date().toISOString(),
        updatedAt: new Date(),
        updatedBy: context.userId,
      };
      await docRef.update(updatePayload);
      Object.assign(session, updatePayload); // Actualizar el objeto local
    }

    // 4. Generar un token de acceso simulado para la plataforma de video.
    // En una implementación real, aquí se llamaría al SDK del proveedor de video (ej. Twilio, Vonage).
    const accessToken = `tok_${Buffer.from(`${context.userId}:${id}:${Date.now()}`).toString('base64')}`;

    await this.logAction('join_session', id, context);

    return { session, accessToken };
  }

  // No implementados para este alcance
  async create(data: any, context: ServiceContext): Promise<TelemedicineSession> {
    // Solo un doctor o admin puede crear una sesión de telemedicina (asociada a una cita)
    if (context.userRole !== 'admin' && context.userRole !== 'doctor') {
      throw new Error('FORBIDDEN');
    }

    const validatedData = this.validateCreate(data);

    const sessionPayload = {
      ...validatedData,
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: context.userId,
    };

    const docRef = await adminDb.collection(this.collectionName).add(sessionPayload);
    
    await this.logAction('create', docRef.id, context);

    return { id: docRef.id, ...sessionPayload } as TelemedicineSession;
  }

  async findMany(options: any, context: ServiceContext): Promise<any> {
    throw new Error("Method not implemented.");
  }
}

export const telemedicineSessionService = new TelemedicineSessionService();
