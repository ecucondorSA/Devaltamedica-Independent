import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { mfaService } from '@altamedica/shared/services/mfa.service';
import { getFirebaseFirestore } from '@altamedica/firebase/client';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { jwtService } from '@altamedica/shared';
import { auditService } from '@/services/audit.service';
import { cookies } from 'next/headers';

import { logger } from '@altamedica/shared/services/logger.service';
/**
 * Endpoint de verificación MFA/TOTP
 * Segunda fase de autenticación para usuarios con MFA habilitado
 */

// Schema de validación
const MFAVerifySchema = z.object({
  userId: z.string().min(1),
  token: z.string().min(6).max(6),
  rememberDevice: z.boolean().optional(),
  useBackupCode: z.boolean().optional()
});

/**
 * POST /api/v1/auth/mfa/verify
 * Verifica el código TOTP o código de respaldo
 */
export async function POST(request: NextRequest) {
  try {
    // Parsear y validar body
    const body = await request.json();
    const validatedData = MFAVerifySchema.parse(body);

    const { userId, token, rememberDevice, useBackupCode } = validatedData;

    // Obtener información del usuario desde Firestore
    const db = getFirebaseFirestore();
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Auditar intento fallido
      await auditService.logAction({
        action: 'mfa_verify_failed',
        userId: 'unknown',
        resource: 'auth/mfa',
        metadata: {
          reason: 'user_not_found',
          userId
        },
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      });

      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // Verificar que MFA esté habilitado
    if (!userData.mfaEnabled || !userData.mfaSecret) {
      return NextResponse.json(
        { success: false, error: 'MFA no está habilitado para este usuario' },
        { status: 400 }
      );
    }

    let verified = false;
    let verificationMethod = 'totp';

    if (useBackupCode && userData.mfaBackupCodes) {
      // Verificar código de respaldo
      verified = mfaService.verifyBackupCode(token, userData.mfaBackupCodes);
      verificationMethod = 'backup_code';

      if (verified) {
        // Actualizar códigos usados en la base de datos
        await updateDoc(userRef, {
          mfaBackupCodes: userData.mfaBackupCodes,
          lastMfaVerification: new Date()
        });
      }
    } else {
      // Verificar código TOTP
      const result = mfaService.verifyToken(token, userData.mfaSecret, userId);
      verified = result.verified;

      if (!verified) {
        // Auditar intento fallido
        await auditService.logAction({
          action: 'mfa_verify_failed',
          userId,
          resource: 'auth/mfa',
          metadata: {
            reason: 'invalid_token',
            errorMessage: result.errorMessage,
            method: verificationMethod
          },
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        });

        return NextResponse.json(
          { 
            success: false, 
            error: result.errorMessage || 'Código incorrecto',
            remainingAttempts: mfaService.getUserMFAStats(userId).remainingAttempts
          },
          { status: 401 }
        );
      }
    }

    if (verified) {
      // Actualizar última verificación MFA
      await updateDoc(userRef, {
        lastMfaVerification: new Date(),
        mfaVerificationCount: (userData.mfaVerificationCount || 0) + 1
      });

      // Generar tokens de sesión completos
      const accessToken = await jwtService.generateAccessToken({
        uid: userId,
        email: userData.email,
        role: userData.role,
        mfaVerified: true
      });

      const refreshToken = await jwtService.generateRefreshToken({
        uid: userId,
        mfaVerified: true
      });

      // Configurar cookies seguras
      const cookieStore = cookies();
      
      cookieStore.set('altamedica_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60, // 1 hora
        path: '/'
      });

      cookieStore.set('altamedica_refresh', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: '/'
      });

      // Si el usuario quiere recordar el dispositivo
      if (rememberDevice) {
        const deviceToken = crypto.randomBytes(32).toString('hex');
        
        cookieStore.set('altamedica_device', deviceToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 días
          path: '/'
        });

        // Guardar dispositivo confiable en la base de datos
        const trustedDevices = userData.trustedDevices || [];
        trustedDevices.push({
          token: deviceToken,
          addedAt: new Date(),
          userAgent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        });

        await updateDoc(userRef, {
          trustedDevices: trustedDevices.slice(-5) // Mantener máximo 5 dispositivos
        });
      }

      // Auditar verificación exitosa
      await auditService.logAction({
        action: 'mfa_verify_success',
        userId,
        resource: 'auth/mfa',
        metadata: {
          method: verificationMethod,
          rememberDevice: !!rememberDevice
        },
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      });

      return NextResponse.json({
        success: true,
        message: 'Verificación MFA exitosa',
        user: {
          id: userId,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          mfaVerified: true
        },
        redirectUrl: userData.role === 'doctor' ? '/doctors' : 
                     userData.role === 'patient' ? '/patients' :
                     userData.role === 'admin' ? '/admin' : '/dashboard'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Verificación fallida' },
      { status: 401 }
    );

  } catch (error: any) {
    logger.error('[MFA Verify] Error:', undefined, error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error al verificar MFA' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/auth/mfa/verify
 * Obtiene el estado de MFA para el usuario actual
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener userId de la cookie de sesión parcial
    const cookieStore = cookies();
    const partialToken = cookieStore.get('altamedica_partial_token');

    if (!partialToken) {
      return NextResponse.json(
        { success: false, error: 'No hay sesión parcial activa' },
        { status: 401 }
      );
    }

    // Decodificar token parcial
    const decoded = await jwtService.verifyToken(partialToken.value);
    
    if (!decoded || !decoded.userId || !decoded.requiresMFA) {
      return NextResponse.json(
        { success: false, error: 'Token parcial inválido' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Obtener estadísticas de MFA
    const stats = mfaService.getUserMFAStats(userId);

    return NextResponse.json({
      success: true,
      userId,
      mfaRequired: true,
      isLocked: stats.isLocked,
      remainingAttempts: stats.remainingAttempts,
      lastAttempt: stats.lastAttempt
    });

  } catch (error) {
    logger.error('[MFA Status] Error:', undefined, error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener estado de MFA' },
      { status: 500 }
    );
  }
}