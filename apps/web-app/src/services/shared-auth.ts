// Shared authentication service
import { auth } from '@altamedica/firebase';
import { logger } from '@altamedica/shared/services/logger.service';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export class SharedAuthService {
  static async login(email: string, password: string): Promise<AuthUser> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Establecer sesión httpOnly en el backend (Firebase session cookie)
    await this.establishServerSession();
    return this.mapFirebaseUser(userCredential.user);
  }

  static async loginWithGoogle(): Promise<AuthUser> {
    const googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('profile');
    googleProvider.addScope('email');
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    
    const userCredential = await signInWithPopup(auth, googleProvider);
    // Establecer sesión httpOnly en el backend (Firebase session cookie)
    await this.establishServerSession();
    return this.mapFirebaseUser(userCredential.user);
  }

  static async register(email: string, password: string): Promise<AuthUser> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await this.establishServerSession();
    return this.mapFirebaseUser(userCredential.user);
  }

  static async logout(): Promise<void> {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
      await fetch(`${API_BASE}/api/v1/auth/session-logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      await signOut(auth);
    }
  }

  static async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  static getCurrentUser(): AuthUser | null {
    const user = auth.currentUser;
    return user ? this.mapFirebaseUser(user) : null;
  }

  /**
   * Establece la cookie de sesión httpOnly en el backend usando el idToken de Firebase
   * Devuelve el csrfToken emitido por el backend
   */
  static async establishServerSession(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    const idToken = await user.getIdToken();
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
    const res = await fetch(`${API_BASE}/api/v1/auth/session-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      logger.error('[SharedAuthService] Failed to establish server session');
      return null;
    }
    const data = await res.json();
    // csrfToken también queda en cookie (no httpOnly). Devolvemos por conveniencia
    return data?.csrfToken || null;
  }

  private static mapFirebaseUser(user: User): AuthUser {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  }
}

export default SharedAuthService;
