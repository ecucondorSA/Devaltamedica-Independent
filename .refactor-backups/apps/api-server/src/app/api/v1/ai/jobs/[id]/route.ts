import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { createAuthenticatedRoute } from '@/lib/middleware/UnifiedAuth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';

import { logger } from '@altamedica/shared/services/logger.service';
// GET /api/v1/ai/jobs/[id] - Get job by ID
export const GET = createAuthenticatedRoute(
  async (request: NextRequest, authContext, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      
      if (!id) {
        return NextResponse.json(
          createErrorResponse('MISSING_PARAMETER', 'Job ID is required'),
          { status: 400 }
        );
      }
      
      logger.info(`[AI Jobs] Fetching job ${id}`);
      
      const jobDoc = await adminDb.collection('ai_jobs').doc(id).get();
      
      if (!jobDoc.exists) {
        return NextResponse.json(
          createErrorResponse('JOB_NOT_FOUND', 'AI job not found'),
          { status: 404 }
        );
      }
      
      const jobData = jobDoc.data()!;
      
      logger.info(`[AI Jobs] Retrieved job ${id} successfully`);
      
      return NextResponse.json(
        createSuccessResponse(jobData, 'AI job retrieved successfully')
      );
      
    } catch (error) {
      logger.error('[AI Jobs] Error fetching job:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve AI job'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['doctor', 'admin'],
    auditAction: 'get_ai_job'
  }
);