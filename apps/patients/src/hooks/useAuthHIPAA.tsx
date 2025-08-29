/**
 * useAuthHIPAA.tsx
 * Hook de autenticación HIPAA real que conecta con el backend Firebase implementado
 * Implementado por ChatGPT-5 (Líder Técnico Principal)
 */

'use client';

import { logger } from '@altamedica/shared';
import {
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase-config';

// ============================================================================
// TIPOS Y INTERFACES HIPAA
// ============================================================================

export interface HIPAAUser {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'doctor' | 'patient' | 'company' | 'staff';
  permissions: string[];
  profileComplete: boolean;
  phoneNumber?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date;
  isActive: boolean;
  // Campos específicos por rol
  doctorLicense?: string;
  specialties?: string[];
  companyName?: string;
  companyId?: string;
  patientId?: string;
  // Campos de compliance HIPAA
  hipaaConsent: boolean;
  hipaaConsentDate: Date;
  dataAccessLog: DataAccessEntry[];
  auditTrail: AuditEntry[];
}

export interface DataAccessEntry {
  timestamp: Date;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  reason: string;
}

export interface AuditEntry {
  timestamp: Date;
  action: string;
  userId: string;
  resource: string;
  details: string;
  ipAddress: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  role: 'patient' | 'doctor' | 'company';
  phoneNumber?: string;
  hipaaConsent: boolean;
}

export interface AuthState {
  user: HIPAAUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// CONTEXTO DE AUTENTICACIÓN HIPAA
// ============================================================================

const AuthHIPAAContext = createContext<{
  state: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<HIPAAUser>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
} | null>(null);

// ============================================================================
// HOOK PRINCIPAL DE AUTENTICACIÓN HIPAA
// ============================================================================

export const useAuthHIPAA = () => {
  const context = useContext(AuthHIPAAContext);
  if (!context) {
    throw new Error('useAuthHIPAA must be used within AuthHIPAAProvider');
  }
  return context;
};

// ============================================================================
// PROVEEDOR DE AUTENTICACIÓN HIPAA
// ============================================================================

export const AuthHIPAAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // ============================================================================
  // FUNCIONES DE AUTENTICACIÓN HIPAA
  // ============================================================================

  const mapFirebaseUserToHIPAA = useCallback(
    async (firebaseUser: FirebaseUser): Promise<HIPAAUser> => {
      try {
        // Obtener datos del usuario desde Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          return {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || userData.displayName,
            role: userData.role || 'patient',
            permissions: userData.permissions || [],
            profileComplete: userData.profileComplete || false,
            phoneNumber: firebaseUser.phoneNumber || userData.phoneNumber,
            photoURL: firebaseUser.photoURL || userData.photoURL,
            createdAt: userData.createdAt?.toDate() || new Date(),
            updatedAt: userData.updatedAt?.toDate() || new Date(),
            lastLogin: new Date(),
            isActive: userData.isActive || true,
            doctorLicense: userData.doctorLicense,
            specialties: userData.specialties,
            companyName: userData.companyName,
            companyId: userData.companyId,
            patientId: userData.patientId,
            hipaaConsent: userData.hipaaConsent || false,
            hipaaConsentDate: userData.hipaaConsentDate?.toDate() || new Date(),
            dataAccessLog: userData.dataAccessLog || [],
            auditTrail: userData.auditTrail || [],
          };
        } else {
          // Usuario nuevo, crear documento básico
          const basicUser: HIPAAUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            role: 'patient',
            permissions: ['read:own_records'],
            profileComplete: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLogin: new Date(),
            isActive: true,
            hipaaConsent: false,
            hipaaConsentDate: new Date(),
            dataAccessLog: [],
            auditTrail: [],
          };

          // Guardar en Firestore
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            ...basicUser,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          return basicUser;
        }
      } catch (error) {
        logger.error('Error mapping Firebase user to HIPAA:', String(error));
        throw new Error('Failed to map user data');
      }
    },
  );

  const logDataAccess = useCallback(
    async (userId: string, action: string, resource: string, reason: string) => {
      try {
        const accessEntry: DataAccessEntry = {
          timestamp: new Date(),
          action,
          resource,
          ipAddress: 'client-ip', // TODO: Implementar detección real de IP
          userAgent: navigator.userAgent,
          reason,
        };

        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          dataAccessLog: [...(state.user?.dataAccessLog || []), accessEntry],
          updatedAt: serverTimestamp(),
        });

        // Log de auditoría
        const auditEntry: AuditEntry = {
          timestamp: new Date(),
          action: `DATA_ACCESS_${action.toUpperCase()}`,
          userId,
          resource,
          details: `User accessed ${resource} for ${reason}`,
          ipAddress: 'client-ip',
        };

        await setDoc(doc(db, 'audit_logs', `${userId}_${Date.now()}`), auditEntry);
      } catch (error) {
        logger.error('Error logging data access:', String(error));
      }
    },
  );

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Autenticación con Firebase
        const userCredential = await signInWithEmailAndPassword(
          auth,
          credentials.email,
          credentials.password,
        );
        const firebaseUser = userCredential.user;

        // Mapear a usuario HIPAA
        const hipaaUser = await mapFirebaseUserToHIPAA(firebaseUser);

        // Log de acceso
        await logDataAccess(hipaaUser.uid, 'LOGIN', 'AUTH_SYSTEM', 'User authentication');

        // Actualizar último login
        await updateDoc(doc(db, 'users', hipaaUser.uid), {
          lastLogin: serverTimestamp(),
        });

        setState({
          user: hipaaUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        logger.info('User logged in successfully:', hipaaUser.email);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Login failed';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        logger.error('Login error:', String(error));
        throw error;
      }
    },
    [mapFirebaseUserToHIPAA, logDataAccess],
  );

  const register = useCallback(
    async (data: RegisterData) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Crear usuario en Firebase
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          data.email,
          data.password,
        );
        const firebaseUser = userCredential.user;

        // Actualizar perfil
        await updateProfile(firebaseUser, {
          displayName: data.displayName,
          photoURL: undefined,
        });

        // Crear usuario HIPAA
        const hipaaUser: HIPAAUser = {
          uid: firebaseUser.uid,
          email: data.email,
          displayName: data.displayName,
          role: data.role,
          permissions: getDefaultPermissions(data.role),
          profileComplete: false,
          phoneNumber: data.phoneNumber,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: new Date(),
          isActive: true,
          hipaaConsent: data.hipaaConsent,
          hipaaConsentDate: new Date(),
          dataAccessLog: [],
          auditTrail: [],
        };

        // Guardar en Firestore
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          ...hipaaUser,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Log de registro
        await logDataAccess(hipaaUser.uid, 'REGISTER', 'AUTH_SYSTEM', 'New user registration');

        setState({
          user: hipaaUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        logger.info('User registered successfully:', hipaaUser.email);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Registration failed';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        logger.error('Registration error:', String(error));
        throw error;
      }
    },
    [logDataAccess],
  );

  const logout = useCallback(async () => {
    try {
      if (state.user) {
        // Log de logout
        await logDataAccess(state.user.uid, 'LOGOUT', 'AUTH_SYSTEM', 'User logout');
      }

      // Logout de Firebase
      await signOut(auth);

      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });

      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Logout error:', String(error));
      // Forzar logout local en caso de error
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, [state.user, logDataAccess]);

  const updateUserProfile = useCallback(
    async (updates: Partial<HIPAAUser>) => {
      try {
        if (!state.user) throw new Error('No user authenticated');

        const userRef = doc(db, 'users', state.user.uid);
        await updateDoc(userRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });

        // Log de actualización
        await logDataAccess(
          state.user.uid,
          'PROFILE_UPDATE',
          'USER_PROFILE',
          'Profile information updated',
        );

        // Actualizar estado local
        setState((prev) => ({
          ...prev,
          user: prev.user ? { ...prev.user, ...updates } : null,
        }));

        logger.info('User profile updated successfully');
      } catch (error) {
        logger.error('Profile update error:', String(error));
        throw error;
      }
    },
    [state.user, logDataAccess],
  );

  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      logger.info('Password reset email sent to:', email);
    } catch (error) {
      logger.error('Password reset error:', String(error));
      throw error;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      if (!state.user) return;

      const userDoc = await getDoc(doc(db, 'users', state.user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const updatedUser: HIPAAUser = {
          ...state.user,
          ...userData,
          updatedAt: userData.updatedAt?.toDate() || new Date(),
        };

        setState((prev) => ({
          ...prev,
          user: updatedUser,
        }));
      }
    } catch (error) {
      logger.error('Error refreshing user:', String(error));
    }
  }, [state.user]);

  // ============================================================================
  // EFECTOS Y LISTENERS
  // ============================================================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Usuario autenticado
          const hipaaUser = await mapFirebaseUserToHIPAA(firebaseUser);
          setState({
            user: hipaaUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          // Usuario no autenticado
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        logger.error('Auth state change error:', String(error));
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Authentication error',
        });
      }
    });

    return () => unsubscribe();
  }, [mapFirebaseUserToHIPAA]);

  // ============================================================================
  // FUNCIONES AUXILIARES
  // ============================================================================

  const getDefaultPermissions = (role: string): string[] => {
    switch (role) {
      case 'admin':
        return ['users:manage', 'settings:manage', 'analytics:view', 'system:configure'];
      case 'doctor':
        return ['prescriptions:write', 'medical:read', 'medical:write', 'appointments:manage'];
      case 'patient':
        return ['read:own_records', 'write:own_appointments', 'prescriptions:view'];
      case 'company':
        return ['employees:manage', 'billing:view', 'marketplace:post'];
      case 'staff':
        return ['appointments:view', 'patients:assist', 'reports:generate'];
      default:
        return ['read:own_records'];
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const contextValue = {
    state,
    login,
    register,
    logout,
    updateProfile: updateUserProfile,
    resetPassword,
    refreshUser,
  };

  return <AuthHIPAAContext.Provider value={contextValue}>{children}</AuthHIPAAContext.Provider>;
};

export default useAuthHIPAA;
