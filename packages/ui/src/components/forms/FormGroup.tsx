/**
 * 📝 FORM GROUP - ALTAMEDICA UI
 * Contenedor integral para campos de formulario médico
 * Usado por: Patients, Doctors, Companies, Admin Apps
 */

import React from 'react';
import { FormError } from './FormError';

interface FormGroupProps {
  /** Etiqueta del campo */
  label: string;
  /** ID único del campo */
  id: string;
  /** Indica si el campo es obligatorio */
  required?: boolean;
  /** Texto de ayuda descriptivo */
  helpText?: string;
  /** Mensaje de error */
  error?: string;
  /** Lista de múltiples errores */
  errors?: string[];
  /** Tipo de error para clasificación visual */
  errorType?: 'validation' | 'medical' | 'system' | 'security' | 'network';
  /** Indica si el error es crítico */
  criticalError?: boolean;
  /** Tipo de validación médica */
  medicalValidation?: 'patient-id' | 'medical-record' | 'prescription' | 'diagnosis' | 'standard';
  /** Clase CSS adicional para el contenedor */
  className?: string;
  /** Espaciado vertical del grupo */
  spacing?: 'compact' | 'normal' | 'relaxed';
  /** Layout del grupo */
  layout?: 'vertical' | 'horizontal';
  /** Elemento hijo (input, select, textarea, etc.) */
  children: React.ReactNode;
  /** Callback cuando se valida el campo */
  onValidation?: (isValid: boolean, message?: string) => void;
}

/**
 * FormGroup - Contenedor integral para campos de formulario médico
 * Integra automáticamente Label y Error manteniendo consistencia visual
 */
export const FormGroup: React.FC<FormGroupProps> = ({
  label,
  id,
  required = false,
  helpText,
  error,
  errors,
  errorType = 'validation',
  criticalError = false,
  medicalValidation = 'standard',
  className = '',
  spacing = 'normal',
  layout = 'vertical',
  children,
  onValidation
}) => {
  // Configuración de espaciado
  const getSpacingClasses = (): string => {
    switch (spacing) {
      case 'compact':
        return 'space-y-1';
      case 'relaxed':
        return 'space-y-4';
      default: // normal
        return 'space-y-2';
    }
  };

  // Configuración de layout
  const getLayoutClasses = (): string => {
    if (layout === 'horizontal') {
      return 'sm:flex sm:items-start sm:space-x-4 sm:space-y-0';
    }
    return 'flex flex-col';
  };

  // Clases del contenedor principal
  const containerClasses = `
    form-group
    ${getLayoutClasses()}
    ${getSpacingClasses()}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // Determinar estado de validación visual
  const hasErrors = !!(error || (errors && errors.length > 0));

  // Ícono de validación médica
  const getMedicalIcon = (): string => {
    switch (medicalValidation) {
      case 'patient-id':
        return '🆔';
      case 'medical-record':
        return '📋';
      case 'prescription':
        return '💊';
      case 'diagnosis':
        return '🩺';
      default:
        return '';
    }
  };

  return (
    <div className={containerClasses}>
      {/* Contenedor de Label */}
      <div className={layout === 'horizontal' ? 'sm:w-1/3 sm:flex-shrink-0' : ''}>
        <label
          htmlFor={id}
          className={`
            block text-sm font-medium transition-colors duration-200
            ${hasErrors ? 'text-red-700' : 'text-gray-700'}
            ${required ? 'after:content-["*"] after:ml-0.5 after:text-red-500' : ''}
          `}
        >
          <div className="flex items-center space-x-2">
            {/* Ícono de validación médica */}
            {medicalValidation !== 'standard' && (
              <span className="text-base" aria-hidden="true">
                {getMedicalIcon()}
              </span>
            )}
            
            {/* Texto del label */}
            <span>{label}</span>
            
            {/* Indicador médico */}
            {medicalValidation !== 'standard' && (
              <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                MÉDICO
              </span>
            )}
          </div>
          
          {/* Texto de ayuda para layout horizontal */}
          {helpText && layout === 'horizontal' && (
            <div className="mt-1 text-xs text-gray-500">
              {helpText}
            </div>
          )}
        </label>
      </div>

      {/* Contenedor de Input y Error */}
      <div className={layout === 'horizontal' ? 'sm:w-2/3' : 'w-full'}>
        {/* Input - renderizado como children */}
        <div className="relative">
          {children}
        </div>

        {/* Texto de ayuda para layout vertical */}
        {helpText && layout === 'vertical' && (
          <div className="mt-1 text-xs text-gray-500 flex items-center">
            <span className="mr-1">💡</span>
            {helpText}
          </div>
        )}

        {/* Error Display */}
        {hasErrors && (
          <div className="mt-2">
            <FormError
              message={error}
              errors={errors}
              errorType={errorType}
              fieldId={id}
              critical={criticalError}
            />
          </div>
        )}

        {/* Indicador de validación exitosa */}
        {!hasErrors && medicalValidation !== 'standard' && (
          <div className="mt-1 flex items-center text-xs text-green-600">
            <span className="mr-1">✅</span>
            Validación médica correcta
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * FormGroupCompact - Versión compacta del FormGroup para formularios densos
 */
export const FormGroupCompact: React.FC<FormGroupProps> = (props) => {
  return (
    <FormGroup
      {...props}
      spacing="compact"
      className={`form-group-compact ${props.className || ''}`}
    />
  );
};

/**
 * FormGroupHorizontal - Versión horizontal del FormGroup para layouts amplios
 */
export const FormGroupHorizontal: React.FC<FormGroupProps> = (props) => {
  return (
    <FormGroup
      {...props}
      layout="horizontal"
      spacing="normal"
      className={`form-group-horizontal ${props.className || ''}`}
    />
  );
};

export default FormGroup;