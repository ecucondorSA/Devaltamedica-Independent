import { getAuthAdmin, adminDb } from '../lib/firebase-admin';
import { 
  UserRole, 
  UnifiedAuthService,
  type AuthToken
} from '../auth/UnifiedAuthSystem';
import { UserRecord } from 'firebase-admin/auth';

import { logger } from '@altamedica/shared/services/logger.service';
// Interfaz para datos de usuario en Firestore
interface UserDocument {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  permissions?: string[];
  createdAt: Date;
  updatedAt: Date;
  profileComplete?: boolean;
  phoneNumber?: string;
  photoURL?: string;
  // Campos adicionales según el rol
  doctorLicense?: string;
  specialties?: string[];
  companyName?: string;
  companyId?: string;
  patientId?: string;
}

// Mapeo de permisos por rol
const rolePermissions: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: [
    'users:manage',
    'settings:manage',
    'analytics:view',
    'system:configure',
    'medical:manage',
    'billing:manage'
  ],
  [UserRole.DOCTOR]: [
    'prescriptions:write',
    'medical:read',
    'medical:write',
    'appointments:manage',
    'patients:view',
    'telemedicine:host'
  ],
  [UserRole.PATIENT]: [
    'medical:read',
    'appointments:create',
    'prescriptions:view',
    'telemedicine:join'
  ],
  [UserRole.COMPANY]: [
    'employees:manage',
    'billing:view',
    'marketplace:post',
    'analytics:company'
  ],
  [UserRole.STAFF]: [
    'appointments:view',
    'patients:assist',
    'reports:generate'
  ]
};

export class FirebaseAuthService {
  private auth = getAuthAdmin();
  private db = adminDb;

  /**
   * Crear un nuevo usuario en Firebase y Firestore
   */
  async createUser(
    email: string,
    password: string,
    role: UserRole,
    additionalData?: Partial<UserDocument>
  ): Promise<{ user: UserRecord; token: string; refreshToken: string }> {
    if (!this.auth || !this.db) {
      throw new Error('Firebase services not initialized');
    }

    try {
      // Crear usuario en Firebase Auth
      const userRecord = await this.auth.createUser({
        email,
        password,
        emailVerified: false,
        disabled: false
      });

      // Establecer custom claims (rol y permisos)
      const permissions = rolePermissions[role] || [];
      await this.auth.setCustomUserClaims(userRecord.uid, { role, permissions });

      // Crear documento en Firestore
      const userDoc: UserDocument = {
        uid: userRecord.uid,
        email,
        role,
        permissions,
        createdAt: new Date(),
        updatedAt: new Date(),
        profileComplete: false,
        ...additionalData
      };

      await this.db.collection('users').doc(userRecord.uid).set(userDoc);

      // Generar tokens JWT
      const authToken: Omit<AuthToken, 'exp' | 'iat'> = {
        userId: userRecord.uid,
        email,
        role,
        firebaseUid: userRecord.uid,
        permissions
      };

      const token = UnifiedAuthService.generateAuthToken(authToken);
      const refreshToken = UnifiedAuthService.generateRefreshToken(userRecord.uid);

      logger.info(`✅ User created: ${email} with role: ${role}`);

      return { user: userRecord, token, refreshToken };
    } catch (error: any) {
      logger.error('Error creating user:', undefined, error);
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Autenticar usuario con email y password
   */
  async authenticateUser(
    email: string,
    idToken: string
  ): Promise<{ token: string; refreshToken: string; user: UserDocument }> {
    if (!this.auth || !this.db) {
      throw new Error('Firebase services not initialized');
    }

    try {
      // Verificar token de Firebase
      const decodedToken = await this.auth.verifyIdToken(idToken);
      
      // Obtener datos del usuario de Firestore
      const userDoc = await this.db.collection('users').doc(decodedToken.uid).get();
      
      if (!userDoc.exists) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data() as UserDocument;

      // Generar tokens JWT
      const authToken: Omit<AuthToken, 'exp' | 'iat'> = {
        userId: decodedToken.uid,
        email: userData.email,
        role: userData.role,
        firebaseUid: decodedToken.uid,
        permissions: userData.permissions || rolePermissions[userData.role] || []
      };

      const token = UnifiedAuthService.generateAuthToken(authToken);
      const refreshToken = UnifiedAuthService.generateRefreshToken(decodedToken.uid);

      logger.info(`✅ User authenticated: ${email}`);

      return { token, refreshToken, user: userData };
    } catch (error: any) {
      logger.error('Authentication error:', undefined, error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Obtener usuario por UID
   */
  async getUserById(uid: string): Promise<UserDocument | null> {
    if (!this.db) {
      throw new Error('Firestore not initialized');
    }

    try {
      const userDoc = await this.db.collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        return null;
      }

      return userDoc.data() as UserDocument;
    } catch (error) {
      logger.error('Error getting user:', undefined, error);
      return null;
    }
  }

  /**
   * Actualizar rol de usuario
   */
  async updateUserRole(uid: string, newRole: UserRole): Promise<boolean> {
    if (!this.auth || !this.db) {
      throw new Error('Firebase services not initialized');
    }

    try {
      // Obtener nuevos permisos para el rol
      const permissions = rolePermissions[newRole] || [];

      // Actualizar custom claims en Firebase Auth
      await this.auth.setCustomUserClaims(uid, { role: newRole, permissions });

      // Actualizar documento en Firestore
      await this.db.collection('users').doc(uid).update({
        role: newRole,
        permissions,
        updatedAt: new Date()
      });

      logger.info(`✅ User role updated: ${uid} -> ${newRole}`);
      return true;
    } catch (error) {
      logger.error('Error updating user role:', undefined, error);
      return false;
    }
  }

  /**
   * Agregar permisos adicionales a un usuario
   */
  async addUserPermissions(uid: string, additionalPermissions: string[]): Promise<boolean> {
    if (!this.auth || !this.db) {
      throw new Error('Firebase services not initialized');
    }

    try {
      // Obtener usuario actual
      const userDoc = await this.getUserById(uid);
      if (!userDoc) {
        throw new Error('User not found');
      }

      // Combinar permisos existentes con nuevos
      const currentPermissions = userDoc.permissions || [];
      const newPermissions = [...new Set([...currentPermissions, ...additionalPermissions])];

      // Actualizar custom claims
      await this.auth.setCustomUserClaims(uid, { role: userDoc.role, permissions: newPermissions });

      // Actualizar Firestore
      await this.db.collection('users').doc(uid).update({
        permissions: newPermissions,
        updatedAt: new Date()
      });

      logger.info(`✅ Permissions added for user ${uid}`);
      return true;
    } catch (error) {
      logger.error('Error adding permissions:', undefined, error);
      return false;
    }
  }

  /**
   * Verificar si un usuario tiene un permiso específico
   */
  async userHasPermission(uid: string, permission: string): Promise<boolean> {
    try {
      const user = await this.getUserById(uid);
      if (!user) return false;

      return user.permissions?.includes(permission) || false;
    } catch (error) {
      logger.error('Error checking permission:', undefined, error);
      return false;
    }
  }

  /**
   * Obtener usuario por email
   */
  async getUserByEmail(email: string): Promise<UserRecord | null> {
    if (!this.auth) {
      throw new Error('Firebase Auth not initialized');
    }

    try {
      const userRecord = await this.auth.getUserByEmail(email);
      return userRecord;
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return null;
      }
      logger.error('Error getting user by email:', undefined, error);
      throw error;
    }
  }

  /**
   * Obtener todos los usuarios con un rol específico
   */
  async getUsersByRole(role: UserRole): Promise<UserDocument[]> {
    if (!this.db) {
      throw new Error('Firestore not initialized');
    }

    try {
      const snapshot = await this.db
        .collection('users')
        .where('role', '==', role)
        .get();

      return snapshot.docs.map(doc => doc.data() as UserDocument);
    } catch (error) {
      logger.error('Error getting users by role:', undefined, error);
      return [];
    }
  }

  /**
   * Desactivar usuario
   */
  async disableUser(uid: string): Promise<boolean> {
    if (!this.auth) {
      throw new Error('Firebase Auth not initialized');
    }

    try {
      await this.auth.updateUser(uid, { disabled: true });
      
      // También actualizar en Firestore
      if (this.db) {
        await this.db.collection('users').doc(uid).update({
          disabled: true,
          updatedAt: new Date()
        });
      }

      logger.info(`✅ User disabled: ${uid}`);
      return true;
    } catch (error) {
      logger.error('Error disabling user:', undefined, error);
      return false;
    }
  }

  /**
   * Habilitar usuario
   */
  async enableUser(uid: string): Promise<boolean> {
    if (!this.auth) {
      throw new Error('Firebase Auth not initialized');
    }

    try {
      await this.auth.updateUser(uid, { disabled: false });
      
      // También actualizar en Firestore
      if (this.db) {
        await this.db.collection('users').doc(uid).update({
          disabled: false,
          updatedAt: new Date()
        });
      }

      logger.info(`✅ User enabled: ${uid}`);
      return true;
    } catch (error) {
      logger.error('Error enabling user:', undefined, error);
      return false;
    }
  }

  /**
   * Eliminar usuario completamente
   */
  async deleteUser(uid: string): Promise<boolean> {
    if (!this.auth || !this.db) {
      throw new Error('Firebase services not initialized');
    }

    try {
      // Eliminar de Firebase Auth
      await this.auth.deleteUser(uid);
      
      // Eliminar de Firestore
      await this.db.collection('users').doc(uid).delete();

      logger.info(`✅ User deleted: ${uid}`);
      return true;
    } catch (error) {
      logger.error('Error deleting user:', undefined, error);
      return false;
    }
  }
}

// Exportar instancia singleton
export const firebaseAuthService = new FirebaseAuthService();