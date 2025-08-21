import { adminDb } from '../lib/firebase-admin';
import { auditEvent } from '../middleware/audit.middleware';
import type { UserRole } from '@altamedica/types';

import { logger } from '@altamedica/shared/services/logger.service';
/**
 * RBAC Service - Role-Based Access Control for Medical Data
 * Production-ready implementation for HIPAA compliance
 * 
 * ❌ ELIMINATED: Mock implementations and placeholders
 * ✅ PRODUCTION: Real Firestore queries and audit logging
 */

export interface RBACContext {
  userId: string;
  userRole: UserRole;
  ip?: string;
  userAgent?: string;
}

export interface AccessRequest {
  resource: 'patient' | 'medical-record' | 'prescription' | 'appointment' | 'lab-result';
  resourceId: string;
  action: 'read' | 'write' | 'delete';
  patientId?: string; // Required for all medical resources
}

export interface AccessResult {
  granted: boolean;
  reason: string;
  requiresConsent?: boolean;
  auditTrail: {
    actor: string;
    resource: string;
    action: string;
    result: 'granted' | 'denied';
    reason: string;
  };
}

export class RBACService {
  /**
   * Verify if a doctor has legitimate access to a patient's data
   * PRODUCTION: Real relationship verification
   */
  async verifyDoctorPatientRelationship(
    doctorId: string, 
    patientId: string,
    context: Pick<RBACContext, 'ip' | 'userAgent'>
  ): Promise<boolean> {
    try {
      const relationships = adminDb
        .collection('doctor_patient_relationships')
        .where('doctorId', '==', doctorId)
        .where('patientId', '==', patientId)
        .where('status', '==', 'active');

      const snapshot = await relationships.get();
      
      const hasActiveRelationship = !snapshot.empty;
      
      // Audit the relationship check
      await auditEvent(
        doctorId,
        'verify_doctor_patient_relationship',
        `doctor_patient_relationships/${doctorId}/${patientId}`,
        {
          ...context,
          role: 'doctor',
          result: hasActiveRelationship ? 'found' : 'not_found',
          patientId
        }
      );

      return hasActiveRelationship;
      
    } catch (error) {
      logger.error('[RBAC] Error verifying doctor-patient relationship:', undefined, error);
      
      // Audit the failure
      await auditEvent(
        doctorId,
        'verify_doctor_patient_relationship_error',
        `doctor_patient_relationships/${doctorId}/${patientId}`,
        {
          ...context,
          role: 'doctor',
          error: error instanceof Error ? error.message : 'Unknown error',
          patientId
        }
      );
      
      return false;
    }
  }

  /**
   * Verify if a patient has consent for data sharing
   * PRODUCTION: Real consent verification
   */
  async verifyPatientConsent(
    patientId: string,
    consentType: 'telemedicine' | 'data_sharing' | 'prescription_access' | 'lab_results',
    context: RBACContext
  ): Promise<boolean> {
    try {
      const consentDoc = await adminDb
        .collection('patient_consents')
        .doc(patientId)
        .get();

      if (!consentDoc.exists) {
        return false;
      }

      const consents = consentDoc.data()?.consents || {};
      const hasConsent = consents[consentType]?.granted === true && 
                        consents[consentType]?.active === true &&
                        (!consents[consentType]?.expiresAt || 
                         consents[consentType].expiresAt > new Date());

      // Audit consent check
      await auditEvent(
        context.userId,
        'verify_patient_consent',
        `patient_consents/${patientId}`,
        {
          ...context,
          consentType,
          result: hasConsent ? 'granted' : 'denied',
          patientId
        }
      );

      return hasConsent;
      
    } catch (error) {
      logger.error('[RBAC] Error verifying patient consent:', undefined, error);
      return false;
    }
  }

  /**
   * Check access to medical resources
   * PRODUCTION: Complete RBAC implementation
   */
  async checkAccess(
    context: RBACContext,
    request: AccessRequest
  ): Promise<AccessResult> {
    const auditTrail = {
      actor: context.userId,
      resource: `${request.resource}:${request.resourceId}`,
      action: request.action,
      result: 'denied' as 'granted' | 'denied',
      reason: ''
    };

    try {
      // ✅ ADMIN: Full access to all resources
      if (context.userRole === 'admin') {
        auditTrail.result = 'granted';
        auditTrail.reason = 'Administrative privileges';
        
        await this.auditAccess(context, request, auditTrail);
        
        return {
          granted: true,
          reason: 'Administrative access granted',
          auditTrail
        };
      }

      // ✅ PATIENT: Can only access their own data
      if (context.userRole === 'patient') {
        if (!request.patientId) {
          auditTrail.reason = 'Patient ID required for medical resource access';
          await this.auditAccess(context, request, auditTrail);
          return { granted: false, reason: auditTrail.reason, auditTrail };
        }

        if (context.userId !== request.patientId) {
          auditTrail.reason = 'Patients can only access their own medical data';
          await this.auditAccess(context, request, auditTrail);
          return { granted: false, reason: auditTrail.reason, auditTrail };
        }

        auditTrail.result = 'granted';
        auditTrail.reason = 'Patient accessing own data';
        await this.auditAccess(context, request, auditTrail);
        
        return {
          granted: true,
          reason: 'Patient self-access granted',
          auditTrail
        };
      }

      // ✅ DOCTOR: Must have active relationship with patient
      if (context.userRole === 'doctor') {
        if (!request.patientId) {
          auditTrail.reason = 'Patient ID required for medical resource access';
          await this.auditAccess(context, request, auditTrail);
          return { granted: false, reason: auditTrail.reason, auditTrail };
        }

        // Verify doctor-patient relationship
        const hasRelationship = await this.verifyDoctorPatientRelationship(
          context.userId,
          request.patientId,
          { ip: context.ip, userAgent: context.userAgent }
        );

        if (!hasRelationship) {
          auditTrail.reason = 'No active doctor-patient relationship found';
          await this.auditAccess(context, request, auditTrail);
          return { granted: false, reason: auditTrail.reason, auditTrail };
        }

        // Check specific resource permissions
        const resourceAccess = await this.checkResourceSpecificAccess(
          context,
          request
        );

        if (!resourceAccess.granted) {
          auditTrail.reason = resourceAccess.reason;
          await this.auditAccess(context, request, auditTrail);
          return { granted: false, reason: resourceAccess.reason, auditTrail };
        }

        auditTrail.result = 'granted';
        auditTrail.reason = 'Doctor with verified patient relationship';
        await this.auditAccess(context, request, auditTrail);
        
        return {
          granted: true,
          reason: 'Doctor access granted with verified relationship',
          auditTrail
        };
      }

      // ✅ COMPANY: Limited access to aggregated data only
      if (context.userRole === 'company') {
        // Companies can only access aggregated, anonymized data
        if (request.action !== 'read') {
          auditTrail.reason = 'Companies have read-only access';
          await this.auditAccess(context, request, auditTrail);
          return { granted: false, reason: auditTrail.reason, auditTrail };
        }

        // Only allow access to anonymized reports
        if (!request.resource.includes('report') && !request.resource.includes('analytics')) {
          auditTrail.reason = 'Companies can only access reports and analytics';
          await this.auditAccess(context, request, auditTrail);
          return { granted: false, reason: auditTrail.reason, auditTrail };
        }

        auditTrail.result = 'granted';
        auditTrail.reason = 'Company access to anonymized reports';
        await this.auditAccess(context, request, auditTrail);
        
        return {
          granted: true,
          reason: 'Company access to reports granted',
          auditTrail
        };
      }

      // Default deny
      auditTrail.reason = `Unknown user role: ${context.userRole}`;
      await this.auditAccess(context, request, auditTrail);
      return { granted: false, reason: auditTrail.reason, auditTrail };

    } catch (error) {
      auditTrail.reason = `RBAC check failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      await this.auditAccess(context, request, auditTrail);
      
      logger.error('[RBAC] Access check error:', undefined, error);
      return {
        granted: false,
        reason: 'Access check failed due to system error',
        auditTrail
      };
    }
  }

  /**
   * Check resource-specific access permissions
   */
  private async checkResourceSpecificAccess(
    context: RBACContext,
    request: AccessRequest
  ): Promise<{ granted: boolean; reason: string }> {
    switch (request.resource) {
      case 'prescription':
        if (request.action === 'write' && context.userRole !== 'doctor') {
          return { granted: false, reason: 'Only doctors can create prescriptions' };
        }
        break;

      case 'lab-result':
        if (request.action === 'write' && context.userRole !== 'doctor') {
          return { granted: false, reason: 'Only doctors can create lab results' };
        }
        break;

      case 'medical-record':
        if (request.action === 'delete') {
          return { granted: false, reason: 'Medical records cannot be deleted (HIPAA compliance)' };
        }
        break;
    }

    return { granted: true, reason: 'Resource-specific checks passed' };
  }

  /**
   * Audit access decisions
   */
  private async auditAccess(
    context: RBACContext,
    request: AccessRequest,
    result: { result: 'granted' | 'denied'; reason: string }
  ): Promise<void> {
    try {
      await auditEvent(
        context.userId,
        `rbac_${request.action}_${request.resource}`,
        request.resourceId,
        {
          ...context,
          role: context.userRole,
          patientId: request.patientId,
          accessResult: result.result,
          accessReason: result.reason,
          timestamp: new Date().toISOString()
        }
      );
    } catch (error) {
      logger.error('[RBAC] Failed to audit access:', undefined, error);
    }
  }

  /**
   * Batch access check for multiple resources
   * Optimized for performance with single database queries
   */
  async checkBatchAccess(
    context: RBACContext,
    requests: AccessRequest[]
  ): Promise<AccessResult[]> {
    // Group requests by patient for efficient relationship checking
    const patientGroups = new Map<string, AccessRequest[]>();
    
    for (const request of requests) {
      if (request.patientId) {
        if (!patientGroups.has(request.patientId)) {
          patientGroups.set(request.patientId, []);
        }
        patientGroups.get(request.patientId)!.push(request);
      }
    }

    // Pre-verify relationships for doctors
    const relationshipCache = new Map<string, boolean>();
    if (context.userRole === 'doctor') {
      for (const patientId of patientGroups.keys()) {
        const hasRelationship = await this.verifyDoctorPatientRelationship(
          context.userId,
          patientId,
          { ip: context.ip, userAgent: context.userAgent }
        );
        relationshipCache.set(patientId, hasRelationship);
      }
    }

    // Process each request with cached relationship data
    const results: AccessResult[] = [];
    for (const request of requests) {
      if (context.userRole === 'doctor' && request.patientId) {
        // Use cached relationship result
        const hasRelationship = relationshipCache.get(request.patientId) || false;
        if (hasRelationship) {
          const resourceCheck = await this.checkResourceSpecificAccess(context, request);
          if (resourceCheck.granted) {
            results.push({
              granted: true,
              reason: 'Doctor access with cached relationship verification',
              auditTrail: {
                actor: context.userId,
                resource: `${request.resource}:${request.resourceId}`,
                action: request.action,
                result: 'granted',
                reason: 'Batch verification with cached relationship'
              }
            });
            continue;
          }
        }
      }

      // Fallback to individual access check
      results.push(await this.checkAccess(context, request));
    }

    return results;
  }

  /**
   * Emergency access override (with enhanced auditing)
   * Only for critical medical situations
   */
  async grantEmergencyAccess(
    context: RBACContext,
    request: AccessRequest,
    emergencyReason: string,
    approvedBy?: string
  ): Promise<AccessResult> {
    const auditTrail = {
      actor: context.userId,
      resource: `${request.resource}:${request.resourceId}`,
      action: `emergency_${request.action}`,
      result: 'granted' as const,
      reason: `Emergency access: ${emergencyReason}`
    };

    // Enhanced audit for emergency access
    await auditEvent(
      context.userId,
      'emergency_access_granted',
      request.resourceId,
      {
        ...context,
        role: context.userRole,
        patientId: request.patientId,
        emergencyReason,
        approvedBy,
        requiresReview: true,
        timestamp: new Date().toISOString()
      }
    );

    return {
      granted: true,
      reason: `Emergency access granted: ${emergencyReason}`,
      requiresConsent: true,
      auditTrail
    };
  }
}

// Export singleton instance
export const rbacService = new RBACService();