/**
 * @fileoverview Form constants
 * @module @altamedica/hooks/forms/constants
 */

export const FORM_VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  MIN_LENGTH: 'Minimum length not met',
  MAX_LENGTH: 'Maximum length exceeded',
} as const;