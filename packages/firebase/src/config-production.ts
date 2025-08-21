import { getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

import { logger } from './utils/logger';
// Configuración Firebase desde variables de entorno
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAkzR3fZjtwsGu4wJ6jNnbjcSLGu3rWoGs',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'altamedic-20f69.firebaseapp.com',
  databaseURL:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    'https://altamedic-20f69-default-rtdb.firebaseio.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'altamedic-20f69',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'altamedic-20f69.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '131880235210',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:131880235210:web:35d867452b6488c245c433',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-X3FJNH06PN',
};

let app: any;
let auth: any;
let db: any;
let storage: any;
let initialized = false;

// Inicializar Firebase solo una vez y solo en el cliente
function initializeFirebaseApp() {
  // Solo inicializar en el cliente
  if (typeof window === 'undefined') {
    return null;
  }

  if (initialized) {
    return app;
  }

  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  // Inicializar servicios
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Solo conectar emuladores si está explícitamente habilitado
  const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

  if (useEmulator) {
    logger.info('🔧 Conectando a emuladores Firebase...');

    try {
      // Verificar si ya están conectados antes de intentar
      if (!auth._delegate._config.emulator) {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      }
    } catch (error) {
      logger.info('⚠️ Auth emulator ya conectado o no disponible');
    }

    try {
      if (!db._delegate._databaseId.database.includes('(default)')) {
        connectFirestoreEmulator(db, 'localhost', 8080);
      }
    } catch (error) {
      logger.info('⚠️ Firestore emulator ya conectado o no disponible');
    }

    try {
      connectStorageEmulator(storage, 'localhost', 9199);
    } catch (error) {
      logger.info('⚠️ Storage emulator ya conectado o no disponible');
    }
  } else {
    logger.info('🚀 Usando Firebase en producción');
  }

  initialized = true;
  return app;
}

// Función para obtener instancias de Firebase de manera lazy
function getFirebaseAuth() {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!initialized) {
    initializeFirebaseApp();
  }
  return auth;
}

function getFirebaseDb() {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!initialized) {
    initializeFirebaseApp();
  }
  return db;
}

function getFirebaseStorage() {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!initialized) {
    initializeFirebaseApp();
  }
  return storage;
}

// Inicializar automáticamente solo en el cliente
if (typeof window !== 'undefined') {
  initializeFirebaseApp();
}

// Exportar las instancias usando getters para lazy loading
export { getFirebaseAuth as auth, getFirebaseDb as db, getFirebaseStorage as storage };
export default app;
