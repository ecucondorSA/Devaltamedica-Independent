/**
 * 🔄 FIREBASE CONFIGURATION - COMPANIES APP
 * Migrado a wrapper centralizado para evitar duplicaciones
 */

import {
  getFirebaseApp,
  getFirebaseAuth,
  getFirebaseFirestore,
  getFirebaseStorage,
} from '@altamedica/firebase';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';

// Instancias únicas vía wrapper centralizado
export const app: FirebaseApp = getFirebaseApp();
export const auth: Auth = getFirebaseAuth();
export const db: Firestore = getFirebaseFirestore();
export const storage: FirebaseStorage = getFirebaseStorage();

export default app;

// Export types for compatibility
export type { Auth, FirebaseApp, FirebaseStorage, Firestore };

// Utility functions placeholder
export const firebaseUtils = {
  // Add utility functions as needed
};
