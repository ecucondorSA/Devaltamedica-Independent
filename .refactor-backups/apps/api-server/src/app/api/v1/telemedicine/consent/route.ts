import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthenticatedRoute } from '@/lib/middleware/UnifiedAuth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import TelemedicineService from '@/services/telemedicine.service';

import { logger } from '@altamedica/shared/services/logger.service';
// Schemas
const CreateConsentSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  sessionId: z.string().min(1, 'Session ID is required').optional(),
  consentType: z.enum(['telemedicine', 'recording', 'data_sharing', 'emergency_contact'], {
    errorMap: () => ({ message: 'Invalid consent type' })
  }),
  consentText: z.string().min(1, 'Consent text is required'),
  agreed: z.boolean(),
  signatureData: z.object({
    signature: z.string().optional(), // Base64 encoded signature image
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
    timestamp: z.string().datetime()
  }).optional(),
  witnessInfo: z.object({
    witnessName: z.string().optional(),
    witnessRole: z.string().optional(),
    witnessId: z.string().optional()
  }).optional()
});

const QueryConsentSchema = z.object({
  patientId: z.string().optional(),
  sessionId: z.string().optional(),
  consentType: z.string().optional()
});

// POST /api/v1/telemedicine/consent - Create or update consent
export const POST = createAuthenticatedRoute(
  async (request: NextRequest, authContext) => {
    try {
      logger.info('[Telemedicine Consent] Creating consent record');
      
      const body = await request.json();
      const validation = CreateConsentSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          createErrorResponse('INVALID_REQUEST_BODY', 'Invalid request body', {
            errors: validation.error.flatten().fieldErrors
          }),
          { status: 400 }
        );
      }
      
      const { 
        patientId, 
        sessionId, 
        consentType, 
        consentText, 
        agreed, 
        signatureData, 
        witnessInfo 
      } = validation.data;
      
      const userId = authContext.user?.uid;
      const userRole = authContext.user?.role;
      
      // Authorization: patients can only manage their own consent
      if (userRole === 'patient' && patientId !== userId) {
        return NextResponse.json(
          createErrorResponse('FORBIDDEN', 'Patients can only manage their own consent'),
          { status: 403 }
        );
      }
      
      // Create consent record with HIPAA compliance
      const consent = await TelemedicineService.createConsent({
        patientId,
        sessionId,
        consentType,
        consentText,
        agreed,
        signatureData: {
          ...signatureData,
          ipAddress: request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          timestamp: new Date().toISOString()
        },
        witnessInfo,
        createdBy: userId,
        createdAt: new Date()
      });
      
      logger.info(`[Telemedicine Consent] Consent created: ${consent.id}, Type: ${consentType}, Agreed: ${agreed}`);
      
      return NextResponse.json(
        createSuccessResponse(consent, 'Consent record created successfully'),
        { status: 201 }
      );
      
    } catch (error) {
      logger.error('[Telemedicine Consent] Error creating consent:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to create consent record'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['patient', 'doctor', 'admin'],
    auditAction: 'create_telemedicine_consent'
  }
);

// GET /api/v1/telemedicine/consent - Get consent records
export const GET = createAuthenticatedRoute(
  async (request: NextRequest, authContext) => {
    try {
      const url = new URL(request.url);
      const queryParams = {
        patientId: url.searchParams.get('patientId') || undefined,
        sessionId: url.searchParams.get('sessionId') || undefined,
        consentType: url.searchParams.get('consentType') || undefined
      };
      
      const validation = QueryConsentSchema.safeParse(queryParams);
      if (!validation.success) {
        return NextResponse.json(
          createErrorResponse('INVALID_QUERY', 'Invalid query parameters', {
            errors: validation.error.flatten().fieldErrors
          }),
          { status: 400 }
        );
      }
      
      const { patientId, sessionId, consentType } = validation.data;
      const userId = authContext.user?.uid;
      const userRole = authContext.user?.role;
      
      // Default to current user if not specified and user is patient
      const targetPatientId = patientId || (userRole === 'patient' ? userId : undefined);
      
      // Authorization: users can only see consents they're authorized to view
      if (userRole === 'patient' && targetPatientId && targetPatientId !== userId) {
        return NextResponse.json(
          createErrorResponse('FORBIDDEN', 'You can only access your own consent records'),
          { status: 403 }
        );
      }
      
      if (!targetPatientId) {
        return NextResponse.json(
          createErrorResponse('MISSING_PARAMETERS', 'Patient ID is required'),
          { status: 400 }
        );
      }
      
      logger.info(`[Telemedicine Consent] Getting consent records for patient: ${targetPatientId}`);
      
      const consents = await TelemedicineService.getConsents({
        patientId: targetPatientId,
        sessionId,
        consentType
      });
      
      return NextResponse.json(
        createSuccessResponse({
          consents,
          count: consents.length,
          patientId: targetPatientId
        }, 'Consent records retrieved successfully')
      );
      
    } catch (error) {
      logger.error('[Telemedicine Consent] Error getting consent records:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve consent records'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['patient', 'doctor', 'admin'],
    auditAction: 'get_telemedicine_consent'
  }
);