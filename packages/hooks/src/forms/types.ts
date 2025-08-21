/**
 * @fileoverview Form types
 * @module @altamedica/hooks/forms/types
 */

export interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

export interface FormConfig {
  initialValues: Record<string, any>;
  validationSchema?: any;
  onSubmit: (values: Record<string, any>) => Promise<void> | void;
}