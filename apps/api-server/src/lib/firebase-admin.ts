import { logger } from '@altamedica/shared';
import {
  App,
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  ServiceAccount,
} from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';
// Removed 'server-only' import - not compatible with Express server

// Singleton instances
let app: App | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: Storage | undefined;

/**
 * Obtiene las credenciales de Firebase Admin desde las variables de entorno
 * Soporta tanto JSON completo como variables individuales
 */
function getFirebaseCredentials(): ServiceAccount | null {
  // Primero intenta usar el JSON completo de la cuenta de servicio
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      return {
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
      };
    } catch (error) {
      logger.error('Error parsing FIREBASE_SERVICE_ACCOUNT:', undefined, error);
    }
  }

  // Fallback a variables individuales
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  return null;
}

/**
 * Valida que las credenciales de Firebase estén disponibles
 * P0 Security: Fail fast if credentials are missing
 */
function validateFirebaseCredentials(): void {
  // Check GOOGLE_APPLICATION_CREDENTIALS path
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    const resolvedPath = path.resolve(credPath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`[FATAL] Firebase credentials file not found at: ${resolvedPath}`);
    }
    if (!fs.statSync(resolvedPath).isFile()) {
      throw new Error(`[FATAL] Firebase credentials path is not a file: ${resolvedPath}`);
    }
    logger.info(`✅ [Firebase] Credentials file found at: ${resolvedPath}`);
    return;
  }

  // Check individual env vars as fallback
  const credentials = getFirebaseCredentials();
  if (!credentials) {
    throw new Error(
      '[FATAL] Firebase credentials not configured. Set either:\n' +
        '  - GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json\n' +
        '  - Or individual: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY',
    );
  }

  logger.info('✅ [Firebase] Credentials validated from environment variables');
}

/**
 * Inicializa Firebase Admin SDK de manera optimizada para serverless
 * Esta función es idempotente y thread-safe
 */
function initializeFirebaseAdmin(): App | null {
  // Si ya está inicializado, retornar la instancia existente
  if (app) return app;

  // Verificar si ya hay una app inicializada
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
    return app;
  }

  // P0 Security: Validate credentials before initialization
  validateFirebaseCredentials();

  try {
    // Prioridad 1: GOOGLE_APPLICATION_CREDENTIALS (archivo JSON)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const credPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      const raw = fs.readFileSync(credPath, 'utf-8');
      const json = JSON.parse(raw);
      app = initializeApp({
        credential: cert(json),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    } else {
      // Prioridad 2: Variables FIREBASE_*
      const credentials = getFirebaseCredentials();
      if (credentials) {
        app = initializeApp({
          credential: cert({
            projectId: credentials.projectId,
            clientEmail: credentials.clientEmail,
            privateKey: credentials.privateKey,
          } as ServiceAccount),
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        });
      } else {
        // Prioridad 3: Application Default Credentials
        app = initializeApp({
          credential: applicationDefault(),
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        });
      }
    }
    logger.info('✅ [Firebase] Admin SDK initialized successfully');
    return app;
  } catch (error) {
    logger.error('❌ [Firebase] Admin initialization failed:', undefined, error);
    throw error; // P0: Fail fast instead of returning null
  }
}

/**
 * Obtiene la instancia de Firebase Admin Auth
 * @returns Firebase Auth instance o null si falla la inicialización
 */
export function getAuthAdmin(): Auth | null {
  if (auth) return auth;

  const firebaseApp = initializeFirebaseAdmin();
  if (!firebaseApp) return null;

  auth = getAuth(firebaseApp);
  return auth;
}

/**
 * Obtiene la instancia de Firestore Admin
 * @returns Firestore instance o null si falla la inicialización
 */
export function getFirestoreAdmin(): Firestore | null {
  if (db) return db;

  const firebaseApp = initializeFirebaseAdmin();
  if (!firebaseApp) return null;

  db = getFirestore(firebaseApp);

  // Configurar ajustes de Firestore solo si no han sido configurados antes
  try {
    db.settings({
      ignoreUndefinedProperties: true,
      // Forzar REST para evitar problemas de gRPC en entornos locales
      preferRest: true,
    });
  } catch (error) {
    // Los settings ya fueron configurados, ignorar el error
    logger.info('Firestore settings already configured');
  }

  return db;
}

/**
 * Obtiene la instancia de Firebase Storage Admin
 * @returns Storage instance o null si falla la inicialización
 */
export function getStorageAdmin(): Storage | null {
  if (storage) return storage;

  const firebaseApp = initializeFirebaseAdmin();
  if (!firebaseApp) return null;

  storage = getStorage(firebaseApp);
  return storage;
}

/**
 * Alias convenientes para mantener compatibilidad con código existente
 */
export const adminAuth = getAuthAdmin();
export const adminDb = getFirestoreAdmin();
export const adminStorage = getStorageAdmin();

/**
 * Verifica si Firebase Admin está correctamente inicializado
 */
export function isFirebaseAdminInitialized(): boolean {
  return !!initializeFirebaseAdmin();
}

/**
 * Limpia las instancias de Firebase Admin (útil para tests)
 */
export function cleanupFirebaseAdmin(): void {
  app = undefined;
  auth = undefined;
  db = undefined;
  storage = undefined;
}
