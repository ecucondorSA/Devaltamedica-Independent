import { getFirebaseAuth } from '@altamedica/firebase';
import { GoogleAuthProvider } from 'firebase/auth';
import { NextResponse } from 'next/server';

import { logger } from '@altamedica/shared/services/logger.service';
export async function GET() {
  try {
    const auth = getFirebaseAuth();
    // Check if Firebase is initialized
    const firebaseStatus = {
      authInitialized: !!auth,
      appName: auth?.app?.name || 'not initialized',
      authDomain: auth?.app?.options?.authDomain || 'not configured',
      apiKey: auth?.app?.options?.apiKey ? 'configured' : 'missing',
      projectId: auth?.app?.options?.projectId || 'not configured',
    };

    // Check Google provider
    const googleProvider = new GoogleAuthProvider();
    const providerStatus = {
      providerId: googleProvider.providerId,
      scopes: ['profile', 'email'],
    };

    // Get current auth settings
    const authSettings = {
      currentUser: auth?.currentUser
        ? {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
          }
        : null,
      languageCode: auth?.languageCode || 'default',
    };

    return NextResponse.json({
      success: true,
      firebase: firebaseStatus,
      googleProvider: providerStatus,
      auth: authSettings,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Firebase test error:', undefined, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
