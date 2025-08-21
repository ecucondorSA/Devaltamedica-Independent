import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

import { logger } from '@altamedica/shared/services/logger.service';
let app: App;
let mockMode = false;

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    try {
      // Use environment variables for production
      if (process.env.FIREBASE_ADMIN_PROJECT_ID && 
          process.env.FIREBASE_ADMIN_CLIENT_EMAIL && 
          process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
        app = initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        });
        logger.info('[Firebase Admin] Initialized with credentials');
      } else {
        // Development mode without credentials
        logger.warn('[Firebase Admin] Running in mock mode - no credentials provided');
        mockMode = true;
        app = initializeApp({
          projectId: 'altamedica-dev',
        });
      }
    } catch (error) {
      logger.error('[Firebase Admin] Initialization error:', error);
      mockMode = true;
      app = initializeApp({
        projectId: 'altamedica-dev',
      });
    }
  } else {
    app = getApps()[0];
  }
  return app;
}

// Initialize on module load
initializeFirebaseAdmin();

// Export getAuth function that ensures Firebase Admin is initialized
export function getAuth() {
  if (!app) {
    initializeFirebaseAdmin();
  }
  
  if (mockMode) {
    // Return a mock auth object for development
    return {
      getUser: async (uid: string) => ({
        uid,
        email: `${uid}@altamedica.dev`,
        customClaims: {
          role: 'patient',
          userType: 'patient',
          roles: ['patient'],
          permissions: []
        }
      }),
      verifyIdToken: async (token: string) => ({
        uid: 'test-user-123',
        email: 'test@altamedica.dev'
      }),
      createCustomToken: async (uid: string, claims?: any) => {
        // Create a mock JWT-like token
        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
        const payload = Buffer.from(JSON.stringify({ 
          uid, 
          ...claims,
          iat: Date.now() / 1000,
          exp: (Date.now() / 1000) + 3600 
        })).toString('base64');
        const signature = 'mock-signature';
        return `${header}.${payload}.${signature}`;
      }
    } as any;
  }
  
  return getAdminAuth(app);
}

export function isInMockMode() {
  return mockMode;
}

// Export auth functions for server.ts
export async function verifyIdToken(token: string) {
  const auth = getAuth();
  return auth.verifyIdToken(token);
}

export async function createCustomToken(uid: string, claims?: any) {
  const auth = getAuth();
  return auth.createCustomToken(uid, claims);
}

export async function setCustomUserClaims(uid: string, claims: any) {
  const auth = getAuth();
  return auth.setCustomUserClaims(uid, claims);
}

export async function getUser(uid: string) {
  const auth = getAuth();
  return auth.getUser(uid);
}

export async function deleteUser(uid: string) {
  const auth = getAuth();
  return auth.deleteUser(uid);
}

export async function listUsers(maxResults?: number, pageToken?: string) {
  const auth = getAuth();
  return auth.listUsers(maxResults, pageToken);
}

export async function updateUser(uid: string, properties: any) {
  const auth = getAuth();
  return auth.updateUser(uid, properties);
}

export async function createUser(properties: any) {
  const auth = getAuth();
  return auth.createUser(properties);
}

export async function revokeRefreshTokens(uid: string) {
  const auth = getAuth();
  return auth.revokeRefreshTokens(uid);
}