import { z } from 'zod';

/**
 * Defines the possible types of AI jobs that can be requested.
 * Using a Zod enum ensures that only valid job types are processed.
 */
export const AIJobType = z.enum([
  'summarize_medical_record',
  'analyze_symptoms',
  'generate_patient_report',
  'transcribe_audio_consultation',
]);

/**
 * Defines the possible statuses of an AI job.
 */
export const AIJobStatus = z.enum([
  'queued',     // Job has been created and is waiting to be processed.
  'processing', // Job is actively being worked on by a worker.
  'completed',  // Job finished successfully.
  'failed',     // Job terminated with an error.
  'cancelled',  // Job was cancelled by a user.
]);

/**
 * The main schema for an AI Job. This is the single source of truth for the
 * structure of a job object, stored in Firestore and used by both the
 * api-server (TypeScript) and the Python workers.
 */
export const AIJobSchema = z.object({
  id: z.string().min(1),
  type: AIJobType,
  patientId: z.string().min(1),
  status: AIJobStatus,
  context: z.record(z.any()).optional().default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
  result: z.record(z.any()).nullable().default(null),
  error: z.string().nullable().default(null),
});

// We export the Zod schema itself, not just the inferred type.
// This allows other packages to use the schema for validation.
export type AIJob = z.infer<typeof AIJobSchema>;
