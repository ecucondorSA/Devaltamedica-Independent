/**
 * Cloud Function para asignar Custom Claims automáticamente
 * Se ejecuta cuando se crea un documento en la colección 'users'
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { UserType } from '../../packages/shared/src/types/user';

// Importar matriz de permisos (copiada aquí para evitar problemas de path en Cloud Functions)
const PERMISSIONS_MATRIX: Record<UserType, string[]> = {
  patient: [
    'read:own_profile',
    'update:own_profile',
    'read:own_appointments',
    'create:appointment',
    'read:own_medical_records',
    'telemedicine:patient'
  ],
  doctor: [
    'read:patients',
    'read:appointments',
    'update:appointments',
    'create:medical_record',
    'read:medical_records',
    'update:medical_records',
    'create:prescription',
    'telemedicine:doctor'
  ],
  company: [
    'read:company_patients',
    'read:company_reports',
    'manage:company_users',
    'billing:access'
  ],
  admin: ['*']
};

function getAppAccess(userType: UserType): string[] {
  switch (userType) {
    case 'patient': return ['patients'];
    case 'doctor': return ['doctors'];
    case 'company': return ['companies'];
    case 'admin': return ['*'];
    default: return [];
  }
}

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

export const setCustomClaims = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    try {
      const userData = snap.data();
      const userId = context.params.userId;
      
      if (!userData || !userData.userType) {
        functions.logger.error(`No userType found for user ${userId}`);
        return;
      }

      const userType = userData.userType as UserType;
      
      if (!PERMISSIONS_MATRIX[userType]) {
        functions.logger.error(`Invalid userType: ${userType} for user ${userId}`);
        return;
      }

      const customClaims = {
        userType,
        permissions: PERMISSIONS_MATRIX[userType],
        roles: [userType],
        appAccess: getAppAccess(userType),
        ...(userData.companyId && { companyId: userData.companyId }),
        ...(userData.departmentId && { departmentId: userData.departmentId })
      };

      // Validar tamaño de claims (límite de 1000 bytes)
      const claimsSize = JSON.stringify(customClaims).length;
      if (claimsSize > 1000) {
        functions.logger.error(`Custom claims size exceeds limit: ${claimsSize} bytes for user ${userId}`);
        throw new Error(`Custom claims size (${claimsSize} bytes) exceeds Firebase limit of 1000 bytes`);
      }

      await admin.auth().setCustomUserClaims(userId, customClaims);
      
      // Actualizar el documento con timestamp de claims
      await snap.ref.update({
        customClaimsSet: admin.firestore.FieldValue.serverTimestamp(),
        customClaimsVersion: '1.0.0'
      });

      functions.logger.info(`Custom claims set for user ${userId}`, {
        userType,
        permissions: customClaims.permissions,
        userId
      });
      
    } catch (error) {
      functions.logger.error(`Error setting custom claims for user ${context.params.userId}:`, error);
      throw error;
    }
  });

/**
 * Cloud Function para actualizar Custom Claims cuando se actualiza un usuario
 */
export const updateCustomClaims = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();
      const userId = context.params.userId;

      // Solo actualizar si cambió userType, companyId o departmentId
      if (
        beforeData.userType === afterData.userType &&
        beforeData.companyId === afterData.companyId &&
        beforeData.departmentId === afterData.departmentId
      ) {
        return;
      }

      const userType = afterData.userType as UserType;
      
      if (!PERMISSIONS_MATRIX[userType]) {
        functions.logger.error(`Invalid userType: ${userType} for user ${userId}`);
        return;
      }

      const customClaims = {
        userType,
        permissions: PERMISSIONS_MATRIX[userType],
        roles: [userType],
        appAccess: getAppAccess(userType),
        ...(afterData.companyId && { companyId: afterData.companyId }),
        ...(afterData.departmentId && { departmentId: afterData.departmentId })
      };

      await admin.auth().setCustomUserClaims(userId, customClaims);
      
      // Actualizar el documento con timestamp de claims
      await change.after.ref.update({
        customClaimsUpdated: admin.firestore.FieldValue.serverTimestamp(),
        customClaimsVersion: '1.0.0'
      });

      functions.logger.info(`Custom claims updated for user ${userId}`, {
        userType,
        permissions: customClaims.permissions,
        userId
      });
      
    } catch (error) {
      functions.logger.error(`Error updating custom claims for user ${context.params.userId}:`, error);
      throw error;
    }
  });
