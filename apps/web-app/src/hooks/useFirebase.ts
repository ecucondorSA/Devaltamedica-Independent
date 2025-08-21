// hooks/useFirebase.ts
import { useState, useEffect } from 'react';
import { 
  getFirebaseAuth, 
  getFirebaseFirestore, 
  getFirebaseStorage,
  initializeFirebase 
} from '@altamedica/firebase';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';

import { logger } from '@altamedica/shared/services/logger.service';
interface FirebaseServices {
  db: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
  isLoading: boolean;
  error: string | null;
}

export const useFirebase = (): FirebaseServices => {
  const [services, setServices] = useState<FirebaseServices>({
    db: null,
    auth: null,
    storage: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const initServices = async () => {
      try {
        // Initialize Firebase using the centralized package
        if (typeof window !== 'undefined') {
          initializeFirebase();
          
          const auth = getFirebaseAuth();
          const db = getFirebaseFirestore();
          const storage = getFirebaseStorage();
          
          setServices({
            db,
            auth,
            storage,
            isLoading: false,
            error: null
          });
        } else {
          // SSR - no Firebase services available
          setServices(prev => ({
            ...prev,
            isLoading: false
          }));
        }
      } catch (error) {
        logger.error('Error initializing Firebase:', error);
        setServices(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    };

    initServices();
  }, []);

  return services;
};

// Hook específico para obtener solo la base de datos
export const useFirestore = () => {
  const { db, isLoading, error } = useFirebase();
  return { db, isLoading, error };
};

// Hook específico para obtener solo la autenticación
export const useFirebaseAuth = () => {
  const { auth, isLoading, error } = useFirebase();
  return { auth, isLoading, error };
};

// Hook específico para obtener solo el storage
export const useFirebaseStorage = () => {
  const { storage, isLoading, error } = useFirebase();
  return { storage, isLoading, error };
};