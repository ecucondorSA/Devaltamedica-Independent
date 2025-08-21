/**
 * 👥 USER SERVICE - ALTAMEDICA
 * Servicio consolidado para la gestión de usuarios
 * Combina lo mejor de user.service.ts y UserService.ts
 */

import { getAuthAdmin, getFirestoreAdmin } from '@/lib/firebase-admin';
import { z } from 'zod';
import { BaseService, BaseEntity, ServiceContext, QueryOptions, ServiceResponse } from '@/lib/patterns/ServicePattern';
import { AppError, ErrorCodes } from '@/lib/response-helpers';

import { logger } from '@altamedica/shared/services/logger.service';
// Schema de validación para creación de usuario
export const UserCreateSchema = z.object({
  email: z.string().email('Email inválido'),
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(50),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').max(50),
  role: z.enum(['admin', 'doctor', 'patient', 'company', 'nurse']),
  phoneNumber: z.string().optional(),
  companyId: z.string().optional(),
  profile: z.object({
    avatar: z.string().url().optional(),
    bio: z.string().max(500).optional(),
    specialties: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    timezone: z.string().optional()
  }).optional(),
});

// Schema de validación para actualización de usuario
export const UserUpdateSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(50).optional(),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').max(50).optional(),
  phoneNumber: z.string().optional(),
  profile: z.object({
    avatar: z.string().url().optional(),
    bio: z.string().max(500).optional(),
    specialties: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    timezone: z.string().optional(),
    title: z.string().optional(),
  }).optional(),
  settings: z.object({
    notifications: z.object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      sms: z.boolean().optional()
    }).optional(),
    privacy: z.object({
      profileVisible: z.boolean().optional(),
      shareData: z.boolean().optional()
    }).optional()
  }).optional(),
});

// Schema para cambios realizados por un administrador
export const AdminUserUpdateSchema = UserUpdateSchema.extend({
  role: z.enum(['patient', 'doctor', 'nurse', 'company', 'admin']).optional(),
  isActive: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  companyId: z.string().optional(),
});

// Interfaz de usuario
export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'doctor' | 'patient' | 'company' | 'nurse';
  phoneNumber?: string;
  isActive: boolean;
  emailVerified: boolean;
  companyId?: string;
  profile?: {
    avatar?: string;
    bio?: string;
    specialties?: string[];
    languages?: string[];
    timezone?: string;
    title?: string;
  };
  settings?: {
    notifications?: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    privacy?: {
      profileVisible: boolean;
      shareData: boolean;
    };
  };
  metadata?: {
    lastSignIn?: Date;
    signInCount: number;
    lastIP?: string;
    lastUserAgent?: string;
    createdFrom?: string;
  };
}

class UserService extends BaseService<User> {
  protected collectionName = 'users';
  protected entitySchema = UserUpdateSchema;

  /**
   * Crear un nuevo usuario
   */
  async create(data: Omit<User, keyof BaseEntity>, context: ServiceContext): Promise<User> {
    // Solo admins pueden crear usuarios
    if (context.userRole !== 'admin') {
      throw new AppError('Permisos insuficientes', 403, ErrorCodes.FORBIDDEN);
    }

    // Validar datos
    const parseResult = UserCreateSchema.safeParse(data);
    if (!parseResult.success) {
      throw new AppError(
        `Validation error: ${parseResult.error.flatten().formErrors.join(', ')}`,
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }
    const validatedData = parseResult.data;

    // Verificar si el usuario ya existe
    const existingUser = await this.findByEmail(validatedData.email);
    if (existingUser) {
      throw new AppError('El email ya está registrado', 409, ErrorCodes.ALREADY_EXISTS);
    }

    const adminAuth = getAuthAdmin();
    const adminDb = getFirestoreAdmin();

    if (!adminAuth || !adminDb) {
      throw new AppError('Servicios no disponibles', 503, ErrorCodes.SERVICE_UNAVAILABLE);
    }

    try {
      // Crear usuario en Firebase Auth primero
      const userRecord = await adminAuth.createUser({
        email: validatedData.email,
        displayName: `${validatedData.firstName} ${validatedData.lastName}`,
        emailVerified: false,
      });

      // Establecer custom claims
      await adminAuth.setCustomUserClaims(userRecord.uid, {
        role: validatedData.role,
        altamedicaUser: true,
        createdAt: Date.now(),
      });

      const now = new Date();
      const newUser: User = {
        ...validatedData,
        id: userRecord.uid,
        isActive: true,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
        createdBy: context.userId,
        metadata: {
          signInCount: 0,
          createdFrom: 'api'
        }
      };

      // Guardar en Firestore
      await adminDb.collection(this.collectionName).doc(userRecord.uid).set(newUser);

      // Crear perfil específico según el rol
      await this.createRoleProfile(userRecord.uid, validatedData.role);

      // Log action
      await this.logAction('create', userRecord.uid, context, {
        userRole: validatedData.role,
        companyId: validatedData.companyId
      });

      return newUser;
    } catch (error: any) {
      // Si falla, intentar limpiar Firebase Auth
      if (error.userRecord?.uid) {
        try {
          await adminAuth.deleteUser(error.userRecord.uid);
        } catch (cleanupError) {
          logger.error('Error cleaning up user:', cleanupError);
        }
      }
      throw error;
    }
  }

  /**
   * Buscar usuario por ID
   */
  async findById(id: string, context: ServiceContext): Promise<User | null> {
    // Verificar permisos
    const hasAccess = await this.canAccessUser(id, context);
    if (!hasAccess) {
      throw new AppError('Permisos insuficientes', 403, ErrorCodes.FORBIDDEN);
    }

    const adminDb = getFirestoreAdmin();
    if (!adminDb) {
      throw new AppError('Servicio no disponible', 503, ErrorCodes.SERVICE_UNAVAILABLE);
    }

    const doc = await adminDb.collection(this.collectionName).doc(id).get();
    if (!doc.exists) {
      return null;
    }

    const userData = doc.data()!;
    
    // Excluir datos sensibles
    const { passwordHash, ...safeUserData } = userData;
    
    return {
      id: doc.id,
      ...safeUserData,
      createdAt: userData.createdAt?.toDate() || userData.createdAt,
      updatedAt: userData.updatedAt?.toDate() || userData.updatedAt,
      metadata: {
        ...userData.metadata,
        lastSignIn: userData.metadata?.lastSignIn?.toDate() || userData.metadata?.lastSignIn
      }
    } as User;
  }

  /**
   * Buscar múltiples usuarios
   */
  async findMany(options: QueryOptions, context: ServiceContext): Promise<ServiceResponse<User[]>> {
    const adminDb = getFirestoreAdmin();
    if (!adminDb) {
      throw new AppError('Servicio no disponible', 503, ErrorCodes.SERVICE_UNAVAILABLE);
    }

    const query = this.buildQuery(options);

    try {
      let firestoreQuery: any = adminDb.collection(this.collectionName);

      // Aplicar filtros basados en rol
      if (context.userRole !== 'admin') {
        if (context.userRole === 'company' && context.companyId) {
          firestoreQuery = firestoreQuery.where('companyId', '==', context.companyId);
        } else if (context.userRole === 'doctor') {
          // Los doctores pueden ver pacientes y otros doctores de su compañía
          firestoreQuery = firestoreQuery.where('role', 'in', ['patient', 'doctor']);
          if (context.companyId) {
            firestoreQuery = firestoreQuery.where('companyId', '==', context.companyId);
          }
        } else {
          // Pacientes y otros solo pueden ver su propio registro
          firestoreQuery = firestoreQuery.where('id', '==', context.userId);
        }
      }

      // Aplicar filtros adicionales
      Object.entries(query.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          firestoreQuery = firestoreQuery.where(key, '==', value);
        }
      });

      // Aplicar ordenamiento
      firestoreQuery = firestoreQuery.orderBy(query.sortBy, query.sortOrder);

      // Obtener total
      const totalSnapshot = await firestoreQuery.get();
      const total = totalSnapshot.size;

      // Aplicar paginación
      const paginatedQuery = firestoreQuery.offset(query.offset).limit(query.limit);
      const snapshot = await paginatedQuery.get();

      const users: User[] = [];
      for (const doc of snapshot.docs) {
        const userData = doc.data();
        users.push({
          id: doc.id,
          ...userData,
          createdAt: userData.createdAt?.toDate() || userData.createdAt,
          updatedAt: userData.updatedAt?.toDate() || userData.updatedAt,
          metadata: {
            ...userData.metadata,
            lastSignIn: userData.metadata?.lastSignIn?.toDate() || userData.metadata?.lastSignIn
          }
        } as User);
      }

      return {
        data: users,
        total,
        page: query.page,
        limit: query.limit,
        hasNext: query.offset + query.limit < total,
        hasPrev: query.page > 1
      };
    } catch (error) {
      logger.error('Error finding users:', undefined, error);
      throw error;
    }
  }

  /**
   * Actualizar usuario
   */
  async update(id: string, data: Partial<User>, context: ServiceContext): Promise<User> {
    const adminAuth = getAuthAdmin();
    const adminDb = getFirestoreAdmin();

    if (!adminAuth || !adminDb) {
      throw new AppError('Servicios no disponibles', 503, ErrorCodes.SERVICE_UNAVAILABLE);
    }

    // Verificar que el usuario existe
    const existingUser = await this.findById(id, context);
    if (!existingUser) {
      throw new AppError('Usuario no encontrado', 404, ErrorCodes.NOT_FOUND);
    }

    // Determinar qué schema usar según el rol
    let validatedData;
    if (context.userRole === 'admin') {
      const parseResult = AdminUserUpdateSchema.safeParse(data);
      if (!parseResult.success) {
        throw new AppError(
          `Validation error: ${parseResult.error.flatten().formErrors.join(', ')}`,
          400,
          ErrorCodes.VALIDATION_ERROR
        );
      }
      validatedData = parseResult.data;
    } else {
      // Un usuario solo puede actualizar su propio perfil
      if (context.userId !== id) {
        throw new AppError('Solo puedes actualizar tu propio perfil', 403, ErrorCodes.FORBIDDEN);
      }
      const parseResult = UserUpdateSchema.safeParse(data);
      if (!parseResult.success) {
        throw new AppError(
          `Validation error: ${parseResult.error.flatten().formErrors.join(', ')}`,
          400,
          ErrorCodes.VALIDATION_ERROR
        );
      }
      validatedData = parseResult.data;
    }

    const updatePayload = {
      ...validatedData,
      updatedAt: new Date(),
      updatedBy: context.userId,
    };

    try {
      // Actualizar en Firestore
      await adminDb.collection(this.collectionName).doc(id).update(updatePayload);

      // Si el rol cambió, actualizar en Firebase Auth
      if (validatedData.role && context.userRole === 'admin') {
        await adminAuth.setCustomUserClaims(id, { role: validatedData.role });
      }

      // Log action
      await this.logAction('update', id, context, { 
        updatedFields: Object.keys(validatedData) 
      });

      // Obtener usuario actualizado
      const updatedUser = await this.findById(id, context);
      if (!updatedUser) {
        throw new AppError('Error al obtener usuario actualizado', 500, ErrorCodes.INTERNAL_ERROR);
      }

      return updatedUser;
    } catch (error) {
      logger.error('Error updating user:', undefined, error);
      throw error;
    }
  }

  /**
   * Eliminar usuario (desactivación lógica)
   */
  async delete(id: string, context: ServiceContext): Promise<boolean> {
    // Solo admins pueden eliminar usuarios
    if (context.userRole !== 'admin') {
      throw new AppError('Solo administradores pueden eliminar usuarios', 403, ErrorCodes.FORBIDDEN);
    }

    // Un admin no puede eliminarse a sí mismo
    if (context.userId === id) {
      throw new AppError('No puedes eliminar tu propia cuenta', 400, ErrorCodes.BUSINESS_RULE_VIOLATION);
    }

    const adminAuth = getAuthAdmin();
    const adminDb = getFirestoreAdmin();

    if (!adminAuth || !adminDb) {
      throw new AppError('Servicios no disponibles', 503, ErrorCodes.SERVICE_UNAVAILABLE);
    }

    // Verificar que el usuario existe
    const userRef = adminDb.collection(this.collectionName).doc(id);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return false;
    }

    try {
      // Desactivar en Firestore
      await userRef.update({
        isActive: false,
        deletedAt: new Date(),
        deletedBy: context.userId,
        updatedAt: new Date()
      });

      // Desactivar en Firebase Auth
      await adminAuth.updateUser(id, { disabled: true });

      // Log action
      await this.logAction('delete', id, context, { 
        reason: 'Desactivado por administrador' 
      });

      return true;
    } catch (error) {
      logger.error('Error deleting user:', undefined, error);
      throw error;
    }
  }

  /**
   * Obtener perfil del usuario autenticado con perfil de rol
   */
  async getMe(context: ServiceContext): Promise<User | null> {
    const adminDb = getFirestoreAdmin();
    if (!adminDb) {
      throw new AppError('Servicio no disponible', 503, ErrorCodes.SERVICE_UNAVAILABLE);
    }

    const user = await this.findById(context.userId, context);
    if (!user) {
      return null;
    }

    // Obtener perfil específico del rol
    const roleProfile = await this.getRoleProfile(context.userId, user.role);
    
    return {
      ...user,
      profile: {
        ...user.profile,
        ...roleProfile
      }
    };
  }

  /**
   * Buscar usuario por email
   */
  async findByEmail(email: string): Promise<User | null> {
    const adminDb = getFirestoreAdmin();
    if (!adminDb) {
      throw new AppError('Servicio no disponible', 503, ErrorCodes.SERVICE_UNAVAILABLE);
    }

    try {
      const snapshot = await adminDb.collection(this.collectionName)
        .where('email', '==', email)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const userData = doc.data();

      return {
        id: doc.id,
        ...userData,
        createdAt: userData.createdAt?.toDate() || userData.createdAt,
        updatedAt: userData.updatedAt?.toDate() || userData.updatedAt,
        metadata: {
          ...userData.metadata,
          lastSignIn: userData.metadata?.lastSignIn?.toDate() || userData.metadata?.lastSignIn
        }
      } as User;
    } catch (error) {
      logger.error('Error finding user by email:', undefined, error);
      throw error;
    }
  }

  /**
   * Actualizar último inicio de sesión
   */
  async updateLastSignIn(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const adminDb = getFirestoreAdmin();
    if (!adminDb) {
      throw new AppError('Servicio no disponible', 503, ErrorCodes.SERVICE_UNAVAILABLE);
    }

    try {
      const FieldValue = adminDb.FieldValue;
      const updateData: any = {
        'metadata.lastSignIn': new Date(),
        'metadata.signInCount': FieldValue.increment(1),
        updatedAt: new Date()
      };

      if (ipAddress) updateData['metadata.lastIP'] = ipAddress;
      if (userAgent) updateData['metadata.lastUserAgent'] = userAgent;

      await adminDb.collection(this.collectionName).doc(userId).update(updateData);
    } catch (error) {
      logger.error('Error updating last sign in:', undefined, error);
      throw error;
    }
  }

  /**
   * Buscar usuarios por rol
   */
  async findByRole(role: string, context: ServiceContext): Promise<User[]> {
    if (!this.checkPermission(context, 'read')) {
      throw new AppError('Permisos insuficientes', 403, ErrorCodes.FORBIDDEN);
    }

    const adminDb = getFirestoreAdmin();
    if (!adminDb) {
      throw new AppError('Servicio no disponible', 503, ErrorCodes.SERVICE_UNAVAILABLE);
    }

    try {
      let query: any = adminDb.collection(this.collectionName)
        .where('role', '==', role)
        .where('isActive', '==', true);

      // Aplicar filtro de compañía si no es admin
      if (context.userRole !== 'admin' && context.companyId) {
        query = query.where('companyId', '==', context.companyId);
      }

      const snapshot = await query.get();
      const users: User[] = [];

      for (const doc of snapshot.docs) {
        const userData = doc.data();
        users.push({
          id: doc.id,
          ...userData,
          createdAt: userData.createdAt?.toDate() || userData.createdAt,
          updatedAt: userData.updatedAt?.toDate() || userData.updatedAt,
          metadata: {
            ...userData.metadata,
            lastSignIn: userData.metadata?.lastSignIn?.toDate() || userData.metadata?.lastSignIn
          }
        } as User);
      }

      return users;
    } catch (error) {
      logger.error('Error finding users by role:', undefined, error);
      throw error;
    }
  }

  /**
   * Verificar si el usuario puede acceder a los datos de otro usuario
   */
  private async canAccessUser(targetUserId: string, context: ServiceContext): Promise<boolean> {
    // Los administradores pueden acceder a todos los usuarios
    if (context.userRole === 'admin') {
      return true;
    }

    // Los usuarios pueden acceder a sus propios datos
    if (context.userId === targetUserId) {
      return true;
    }

    const adminDb = getFirestoreAdmin();
    if (!adminDb) {
      return false;
    }

    try {
      // Los administradores de empresa pueden acceder a usuarios de su empresa
      if (context.userRole === 'company' && context.companyId) {
        // Verificar que el usuario objetivo pertenece a la misma empresa
        const targetUserDoc = await adminDb.collection(this.collectionName).doc(targetUserId).get();
        if (targetUserDoc.exists) {
          const targetUser = targetUserDoc.data();
          return targetUser?.companyId === context.companyId;
        }
        return false;
      }

      // Los doctores pueden acceder a sus pacientes
      if (context.userRole === 'doctor') {
        // Verificar relación doctor-paciente a través de citas o asignaciones
        // Primero verificar si hay citas entre el doctor y el paciente
        const appointmentsSnapshot = await adminDb.collection('appointments')
          .where('doctorId', '==', context.userId)
          .where('patientId', '==', targetUserId)
          .limit(1)
          .get();
        
        if (!appointmentsSnapshot.empty) {
          return true;
        }

        // Verificar si hay una relación explícita doctor-paciente
        const relationshipSnapshot = await adminDb.collection('doctor_patient_relationships')
          .where('doctorId', '==', context.userId)
          .where('patientId', '==', targetUserId)
          .where('isActive', '==', true)
          .limit(1)
          .get();
        
        if (!relationshipSnapshot.empty) {
          return true;
        }

        // Verificar si pertenecen a la misma empresa (para doctores de la misma clínica)
        if (context.companyId) {
          const targetUserDoc = await adminDb.collection(this.collectionName).doc(targetUserId).get();
          if (targetUserDoc.exists) {
            const targetUser = targetUserDoc.data();
            // Solo permitir si el target es un paciente y pertenece a la misma empresa
            return targetUser?.role === 'patient' && targetUser?.companyId === context.companyId;
          }
        }
      }

      // Las enfermeras pueden acceder a pacientes de su departamento/empresa
      if (context.userRole === 'nurse' && context.companyId) {
        const targetUserDoc = await adminDb.collection(this.collectionName).doc(targetUserId).get();
        if (targetUserDoc.exists) {
          const targetUser = targetUserDoc.data();
          // Solo permitir si el target es un paciente y pertenece a la misma empresa
          return targetUser?.role === 'patient' && targetUser?.companyId === context.companyId;
        }
      }
    } catch (error) {
      logger.error('Error checking user access permissions:', undefined, error);
      // En caso de error, denegar acceso por seguridad
      return false;
    }

    return false;
  }

  /**
   * Crear perfil específico según el rol
   */
  private async createRoleProfile(userId: string, role: string): Promise<void> {
    const adminDb = getFirestoreAdmin();
    if (!adminDb) return;

    const now = new Date();

    switch (role) {
      case 'doctor':
        await adminDb.collection('doctors').doc(userId).set({
          userId,
          specialties: [],
          license: null,
          education: [],
          experience: [],
          availability: {},
          rating: 0,
          reviewCount: 0,
          isVerified: false,
          createdAt: now,
        });
        break;

      case 'patient':
        await adminDb.collection('patients').doc(userId).set({
          userId,
          dateOfBirth: null,
          gender: null,
          bloodType: null,
          allergies: [],
          medications: [],
          emergencyContact: null,
          medicalHistory: [],
          createdAt: now,
        });
        break;

      case 'company':
        await adminDb.collection('companies').doc(userId).set({
          userId,
          companyName: null,
          industry: null,
          size: null,
          description: null,
          website: null,
          address: null,
          isVerified: false,
          subscription: 'basic',
          createdAt: now,
        });
        break;

      case 'nurse':
        await adminDb.collection('nurses').doc(userId).set({
          userId,
          license: null,
          specialties: [],
          shift: null,
          department: null,
          isVerified: false,
          createdAt: now,
        });
        break;
    }
  }

  /**
   * Obtener perfil específico del rol
   */
  private async getRoleProfile(userId: string, role: string): Promise<any> {
    const adminDb = getFirestoreAdmin();
    if (!adminDb) return null;

    const roleCollections: { [key: string]: string } = {
      doctor: 'doctors',
      patient: 'patients',
      company: 'companies',
      nurse: 'nurses',
    };

    const collection = roleCollections[role];
    if (!collection) return null;

    try {
      const doc = await adminDb.collection(collection).doc(userId).get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      logger.error(`Error getting ${role} profile:`, undefined, error);
      return null;
    }
  }
}

// Exportar instancia única del servicio
export const userService = new UserService();
