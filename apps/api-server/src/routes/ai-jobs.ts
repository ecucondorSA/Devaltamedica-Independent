import { Router, Request, Response } from 'express';
import { adminDb } from '../lib/firebase-admin';

import { logger } from '@altamedica/shared/services/logger.service';
const router = Router();

// Valid job types (manual validation)
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

// Manual validation function
function validateCreateJobRequest(body: any): { valid: boolean; error?: string; data?: any } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be an object' };
  }

  const { type, patientId, context } = body;

  if (!type || !VALID_JOB_TYPES.includes(type)) {
    return { valid: false, error: `Invalid job type. Valid types: ${VALID_JOB_TYPES.join(', ')}` };
  }

  if (!patientId || typeof patientId !== 'string' || patientId.trim().length === 0) {
    return { valid: false, error: 'patientId must be a non-empty string' };
  }

  if (context && typeof context !== 'object') {
    return { valid: false, error: 'context must be an object if provided' };
  }

  return {
    valid: true,
    data: {
      type,
      patientId: patientId.trim(),
      context: context || {}
    }
  };
}

// POST /api/ai/jobs - Create a new AI job
router.post('/jobs', async (req: Request, res: Response) => {
  try {
    logger.info('[AI Jobs] Received request:', req.body);
    
    // Manual validation
    const validation = validateCreateJobRequest(req.body);
    
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid request body',
        message: validation.error,
      });
    }
    
    const { type, patientId, context } = validation.data!;
    
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
      error: null
    };
    
    // Save to Firestore (no Zod validation needed)
    await newJobRef.set(newJob);
    
    logger.info(`[AI Jobs] Created job ${newJob.id} of type ${type} for patient ${patientId}`);
    
    // Return created job
    return res.status(201).json(newJob);
    
  } catch (error) {
    logger.error('[AI Jobs] Error creating job:', undefined, error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/ai/jobs/:id - Get job status
router.get('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const jobDoc = await adminDb.collection('ai_jobs').doc(id).get();
    
    if (!jobDoc.exists) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }
    
    return res.json(jobDoc.data());
    
  } catch (error) {
    logger.error('[AI Jobs] Error fetching job:', undefined, error);
    return res.status(500).json({
      error: 'Internal Server Error'
    });
  }
});

// GET /api/ai/jobs - List jobs
router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const { patientId, status } = req.query;
    
    let query = adminDb.collection('ai_jobs').limit(50);
    
    if (patientId) {
      query = query.where('patientId', '==', patientId);
    }
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    const snapshot = await query.get();
    const jobs = snapshot.docs.map(doc => doc.data());
    
    return res.json(jobs);
    
  } catch (error) {
    logger.error('[AI Jobs] Error listing jobs:', undefined, error);
    return res.status(500).json({
      error: 'Internal Server Error'
    });
  }
});

export default router;