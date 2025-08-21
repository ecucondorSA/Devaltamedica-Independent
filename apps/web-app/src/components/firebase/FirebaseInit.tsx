'use client';

import { getFirebaseAuth } from '@altamedica/firebase';
import { useEffect, useState } from 'react';

import { logger } from '@altamedica/shared/services/logger.service';
/**
 * 🚀 OPTIMIZED FIREBASE INIT
 * Inicialización lazy de Firebase para mejor performance
 */
export default function FirebaseInit() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Lazy initialization para evitar bloquear el rendering inicial
    const initFirebase = async () => {
      // Solo inicializar Firebase cuando realmente se necesite
      if (typeof window !== 'undefined' && !isInitialized) {
        try {
          // Usa el inicializador centralizado que garantiza instancia única
          const auth = getFirebaseAuth();

          // Configuraciones de performance
          auth.useDeviceLanguage(); // Optimización automática de idioma

          setIsInitialized(true);

          if (process.env.NODE_ENV === 'development') {
            logger.info('✅ Firebase initialized lazily');
          }
        } catch (error) {
          logger.error('❌ Firebase initialization failed:', error);
        }
      }
    };

    // Delay la inicialización para no bloquear el critical path
    const timer = setTimeout(initFirebase, 500);

    return () => clearTimeout(timer);
  }, [isInitialized]);

  return null;
}
