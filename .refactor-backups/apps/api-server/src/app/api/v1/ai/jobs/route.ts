
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import { createAuthenticatedRoute } from '@/lib/middleware/UnifiedAuth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';

import { logger } from '@altamedica/shared/services/logger.service';
// Valid job types and statuses
const VALID_JOB_TYPES = [
  'summarize_medical_record',
  'analyze_symptoms',
  'generate_prescription',
  'analyze_lab_results',
  'generate_treatment_plan',
  'medical_risk_assessment',
  'drug_interaction_check',
  'diagnostic_assistance'
] as const;

const VALID_JOB_STATUSES = [
  'queued',
  'processing',
  'completed',
  'failed',
  'cancelled'
] as const;

// Schemas
const AIJobTypeSchema = z.enum(VALID_JOB_TYPES);
const AIJobStatusSchema = z.enum(VALID_JOB_STATUSES);

const CreateAIJobSchema = z.object({
  type: AIJobTypeSchema,
  patientId: z.string().min(1, 'patientId must be a non-empty string'),
  context: z.record(z.any()).optional().default({})
});

const QueryJobsSchema = z.object({
  patientId: z.string().optional(),
  status: AIJobStatusSchema.optional()
});

// POST /api/v1/ai/jobs - Create a new AI job
export const POST = createAuthenticatedRoute(
  async (request: NextRequest, authContext) => {
    try {
      logger.info('[AI Jobs] Received create job request');
      
      const body = await request.json();
      const validation = CreateAIJobSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          createErrorResponse('INVALID_REQUEST_BODY', 'Invalid request body', {
            errors: validation.error.flatten().fieldErrors
          }),
          { status: 400 }
        );
      }
      
      const { type, patientId, context } = validation.data;
      
      // Create job document
      const jobsCollection = adminDb.collection('ai_jobs');
      const newJobRef = jobsCollection.doc();
      
      const newJob = {
        id: newJobRef.id,
        type,
        patientId,
        status: 'queued',
        context,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        result: null,
        error: null,
        createdBy: authContext.user?.uid
      };
      
      // Save to Firestore
      await newJobRef.set(newJob);
      
      logger.info(`[AI Jobs] Created job ${newJob.id} of type ${type} for patient ${patientId}`);
      
      return NextResponse.json(
        createSuccessResponse(newJob, 'AI job created successfully'),
        { status: 201 }
      );
      
    } catch (error) {
      logger.error('[AI Jobs] Error creating job:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to create AI job'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['doctor', 'admin'],
    auditAction: 'create_ai_job'
  }
);

// GET /api/v1/ai/jobs - List jobs with query parameters
export const GET = createAuthenticatedRoute(
  async (request: NextRequest, authContext) => {
    try {
      const url = new URL(request.url);
      const queryParams = {
        patientId: url.searchParams.get('patientId') || undefined,
        status: url.searchParams.get('status') || undefined
      };
      
      const validation = QueryJobsSchema.safeParse(queryParams);
      if (!validation.success) {
        return NextResponse.json(
          createErrorResponse('INVALID_QUERY', 'Invalid query parameters', {
            errors: validation.error.flatten().fieldErrors
          }),
          { status: 400 }
        );
      }
      
      const { patientId, status } = validation.data;
      
      let query = adminDb.collection('ai_jobs').limit(50);
      
      // Apply filters
      if (patientId) {
        query = query.where('patientId', '==', patientId);
      }
      
      if (status) {
        query = query.where('status', '==', status);
      }
      
      // Order by creation date (most recent first)
      query = query.orderBy('createdAt', 'desc');
      
      const snapshot = await query.get();
      const jobs = snapshot.docs.map(doc => doc.data());
      
      logger.info(`[AI Jobs] Retrieved ${jobs.length} jobs`);
      
      return NextResponse.json(
        createSuccessResponse({ jobs, count: jobs.length }, 'AI jobs retrieved successfully')
      );
      
    } catch (error) {
      logger.error('[AI Jobs] Error listing jobs:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve AI jobs'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['doctor', 'admin'],
    auditAction: 'list_ai_jobs'
  }
);
