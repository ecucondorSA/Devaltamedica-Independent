import { initializePerformance } from 'firebase/performance';
import {
  getFirebaseApp,
  getFirebaseAuth,
  getFirebaseFirestore,
  getFirebaseStorage,
} from './client';

// Reutiliza la inicialización centralizada para evitar duplicados
export const app = getFirebaseApp();
export const auth = getFirebaseAuth();
export const db = getFirebaseFirestore();
export const storage = getFirebaseStorage();

// Desactivar Firebase Performance por defecto para evitar errores con atributos inválidos
// Se puede habilitar explícitamente con NEXT_PUBLIC_FIREBASE_PERF_ENABLED=true
let performance: any = null;
if (typeof window !== 'undefined') {
  const perfEnabled = process.env.NEXT_PUBLIC_FIREBASE_PERF_ENABLED === 'true';
  if (perfEnabled) {
    try {
      performance = initializePerformance(app, {
        // Evita instrumentación automática que adjunta atributos no válidos
        instrumentationEnabled: false,
        dataCollectionEnabled: true,
      });
    } catch (error) {
      console.warn('Failed to initialize Firebase Performance:', error);
    }
  }
}

export { performance };
export default app;
