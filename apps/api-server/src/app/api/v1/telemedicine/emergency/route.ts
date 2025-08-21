import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthenticatedRoute } from '@/lib/middleware/UnifiedAuth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import TelemedicineService from '@/services/telemedicine.service';

import { logger } from '@altamedica/shared/services/logger.service';
// Schemas
const CreateEmergencySessionSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  emergencyType: z.enum(['critical', 'urgent', 'moderate'], {
    errorMap: () => ({ message: 'Emergency type must be critical, urgent, or moderate' })
  }),
  symptoms: z.string().min(1, 'Symptoms description is required'),
  vitalSigns: z.object({
    heartRate: z.number().min(30).max(300).optional(),
    bloodPressure: z.object({
      systolic: z.number().min(60).max(300),
      diastolic: z.number().min(30).max(200)
    }).optional(),
    temperature: z.number().min(30).max(45).optional(),
    oxygenSaturation: z.number().min(70).max(100).optional()
  }).optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    address: z.string().optional()
  }).optional()
});

// POST /api/v1/telemedicine/emergency - Create emergency telemedicine session
export const POST = createAuthenticatedRoute(
  async (request: NextRequest, authContext) => {
    try {
      logger.info('[Telemedicine Emergency] Creating emergency session');
      
      const body = await request.json();
      const validation = CreateEmergencySessionSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          createErrorResponse('INVALID_REQUEST_BODY', 'Invalid request body', {
            errors: validation.error.flatten().fieldErrors
          }),
          { status: 400 }
        );
      }
      
      const { patientId, emergencyType, symptoms, vitalSigns, location } = validation.data;
      const userId = authContext.user?.uid;
      const userRole = authContext.user?.role;
      
      // Authorization: patients can only create emergency sessions for themselves
      if (userRole === 'patient' && patientId !== userId) {
        return NextResponse.json(
          createErrorResponse('FORBIDDEN', 'Patients can only create emergency sessions for themselves'),
          { status: 403 }
        );
      }
      
      // Create emergency session with high priority
      const emergencySession = await TelemedicineService.createEmergencySession({
        patientId,
        emergencyType,
        symptoms,
        vitalSigns,
        location,
        createdBy: userId,
        priority: emergencyType === 'critical' ? 1 : emergencyType === 'urgent' ? 2 : 3,
        scheduledAt: new Date(), // Immediate scheduling
        status: 'waiting'
      });
      
      // TODO: Send emergency notifications to available doctors
      // TODO: Integrate with emergency services if critical
      
      logger.info(`[Telemedicine Emergency] Emergency session created: ${emergencySession.id}, Priority: ${emergencyType}`);
      
      return NextResponse.json(
        createSuccessResponse(emergencySession, 'Emergency telemedicine session created successfully'),
        { status: 201 }
      );
      
    } catch (error) {
      logger.error('[Telemedicine Emergency] Error creating emergency session:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to create emergency session'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['patient', 'doctor', 'admin'],
    auditAction: 'create_emergency_telemedicine_session'
  }
);