/**
 * Firebase Admin SDK - Solo para uso en servidor
 * NO DEBE IMPORTARSE EN EL CLIENTE
 */
import { logger } from './utils/logger';

// Variables para almacenar las instancias inicializadas
let adminApp: any = null;
let adminAuth: any = null;
let adminDb: any = null;
let adminStorage: any = null;

/**
 * Inicializa Firebase Admin solo en el servidor
 */
const initializeFirebaseAdmin = async () => {
  if (typeof window !== 'undefined') {
    throw new Error('🚫 Firebase Admin no puede usarse en el cliente');
  }

  try {
    // Importación dinámica para evitar errores en el cliente
    const { default: admin } = await import('firebase-admin');

    if (admin.apps.length === 0) {
      // Verificar variables de entorno
      const projectId = process.env.FIREBASE_PROJECT_ID || 'altamedic-20f69';
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (!clientEmail || !privateKey) {
        logger.warn(
          '⚠️ Firebase Admin: Variables de entorno no configuradas completamente',
          'firebase:admin',
        );
        return null;
      }

      adminApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        databaseURL:
          process.env.FIREBASE_DATABASE_URL || `https://${projectId}-default-rtdb.firebaseio.com`,
        storageBucket:
          process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
      });

      logger.info('✅ Firebase Admin inicializado', 'firebase:admin');
    } else {
      adminApp = admin.apps[0];
    }

    // Inicializar servicios
    const { default: adminImport } = await import('firebase-admin');
    adminAuth = adminImport.auth();
    adminDb = adminImport.firestore();
    adminStorage = adminImport.storage();

    return adminApp;
  } catch (error) {
    logger.error('❌ Error inicializando Firebase Admin:', 'firebase:admin', error);
    return null;
  }
};

/**
 * Obtiene la instancia de Firebase Admin Auth (solo servidor)
 */
export const getAdminAuth = async () => {
  if (typeof window !== 'undefined') {
    throw new Error('🚫 Firebase Admin Auth no puede usarse en el cliente');
  }

  if (!adminAuth) {
    await initializeFirebaseAdmin();
  }
  return adminAuth;
};

/**
 * Obtiene la instancia de Firestore Admin (solo servidor)
 */
export const getAdminDb = async () => {
  if (typeof window !== 'undefined') {
    throw new Error('🚫 Firebase Admin Firestore no puede usarse en el cliente');
  }

  if (!adminDb) {
    await initializeFirebaseAdmin();
  }
  return adminDb;
};

/**
 * Obtiene la instancia de Storage Admin (solo servidor)
 */
export const getAdminStorage = async () => {
  if (typeof window !== 'undefined') {
    throw new Error('🚫 Firebase Admin Storage no puede usarse en el cliente');
  }

  if (!adminStorage) {
    await initializeFirebaseAdmin();
  }
  return adminStorage;
};

/**
 * Verifica un ID Token de Firebase (solo servidor)
 */
export const verifyIdToken = async (idToken: string) => {
  if (typeof window !== 'undefined') {
    throw new Error('🚫 verifyIdToken no puede usarse en el cliente');
  }

  const auth = await getAdminAuth();
  if (!auth) {
    throw new Error('Firebase Admin no está inicializado');
  }

  return auth.verifyIdToken(idToken);
};

// Exportaciones compatibles para casos existentes
export { getAdminAuth as adminAuth, getAdminDb as adminDb, getAdminStorage as adminStorage };

// Función para obtener la app (si existe)
export const getFirebaseAdmin = async () => {
  if (typeof window !== 'undefined') {
    throw new Error('🚫 Firebase Admin App no puede usarse en el cliente');
  }

  if (!adminApp) {
    await initializeFirebaseAdmin();
  }
  return adminApp;
};

export { getFirebaseAdmin as firebaseAdmin };

export default {
  getAdminAuth,
  getAdminDb,
  getAdminStorage,
  verifyIdToken,
  getFirebaseAdmin,
};
