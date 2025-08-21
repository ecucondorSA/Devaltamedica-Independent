/**
 * @fileoverview Constantes para hooks de API
 */

export const API_DEFAULTS = {
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const QUERY_KEYS = {
  PATIENTS: ['patients'],
  DOCTORS: ['doctors'],
  APPOINTMENTS: ['appointments'],
  MEDICAL_RECORDS: ['medical-records'],
} as const;