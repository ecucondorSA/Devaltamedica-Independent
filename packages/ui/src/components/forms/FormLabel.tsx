/**
 * 🏷️ FORM LABEL - ALTAMEDICA UI
 * Etiqueta estandarizada para formularios médicos
 * Usado por: Patients, Doctors, Companies, Admin Apps
 */

import React from 'react';

interface FormLabelProps {
  /** Texto de la etiqueta */
  children: React.ReactNode;
  /** ID del campo asociado (obligatorio para accesibilidad) */
  htmlFor: string;
  /** Indica si el campo es obligatorio */
  required?: boolean;
  /** Clase CSS adicional */
  className?: string;
  /** Tipo de validación médica aplicada */
  medicalValidation?: 'patient-id' | 'medical-record' | 'prescription' | 'diagnosis' | 'standard';
  /** Descripción de ayuda para el usuario */
  helpText?: string;
  /** Tamaño del label */
  size?: 'sm' | 'md' | 'lg';
  /** Estado visual del campo asociado */
  state?: 'normal' | 'error' | 'success' | 'warning';
}

/**
 * FormLabel - Etiqueta estandarizada para formularios médicos
 * Cumple con estándares de accesibilidad WCAG 2.1 AA y normativas sanitarias
 */
export const FormLabel: React.FC<FormLabelProps> = ({
  children,
  htmlFor,
  required = false,
  className = '',
  medicalValidation = 'standard',
  helpText,
  size = 'md',
  state = 'normal'
}) => {
  // Configuración de validación médica específica
  const getMedicalStyling = (): string => {
    switch (medicalValidation) {
      case 'patient-id':
        return 'text-red-700 font-bold';
      case 'medical-record':
        return 'text-blue-700 font-semibold';
      case 'prescription':
        return 'text-purple-700 font-semibold';
      case 'diagnosis':
        return 'text-orange-700 font-semibold';
      default:
        return 'text-gray-700';
    }
  };

  // Configuración de estado visual
  const getStateStyling = (): string => {
    switch (state) {
      case 'error':
        return 'text-red-700';
      case 'success':
        return 'text-green-700';
      case 'warning':
        return 'text-yellow-700';
      default:
        return getMedicalStyling();
    }
  };

  // Configuración de tamaño
  const getSizeClasses = (): string => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-base';
      default:
        return 'text-sm';
    }
  };

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

  const baseClasses = `
    block font-medium mb-2
    transition-colors duration-200
    ${getSizeClasses()}
    ${getStateStyling()}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className="form-label-container">
      <label 
        htmlFor={htmlFor}
        className={baseClasses}
        aria-required={required}
      >
        <div className="flex items-center space-x-2">
          {/* Ícono de validación médica */}
          {medicalValidation !== 'standard' && (
            <span className="text-base" aria-hidden="true">
              {getMedicalIcon()}
            </span>
          )}
          
          {/* Texto del label */}
          <span>{children}</span>
          
          {/* Asterisco de campo obligatorio */}
          {required && (
            <span 
              className="text-red-500 ml-1 font-bold" 
              aria-label="Campo obligatorio"
              title="Este campo es obligatorio"
            >
              *
            </span>
          )}
          
          {/* Badge de validación médica */}
          {medicalValidation !== 'standard' && (
            <span 
              className={`
                text-xs px-2 py-0.5 rounded-full font-semibold
                ${medicalValidation === 'patient-id' ? 'bg-red-100 text-red-800' :
                  medicalValidation === 'medical-record' ? 'bg-blue-100 text-blue-800' :
                  medicalValidation === 'prescription' ? 'bg-purple-100 text-purple-800' :
                  medicalValidation === 'diagnosis' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'}
              `}
              title={`Campo médico: ${medicalValidation.replace('-', ' ')}`}
            >
              {medicalValidation === 'patient-id' ? 'PACIENTE' :
               medicalValidation === 'medical-record' ? 'HISTORIAL' :
               medicalValidation === 'prescription' ? 'RECETA' :
               medicalValidation === 'diagnosis' ? 'DIAGNÓSTICO' :
               'MÉDICO'}
            </span>
          )}
        </div>
      </label>
      
      {/* Texto de ayuda */}
      {helpText && (
        <p 
          className={`
            text-xs mt-1 mb-2 flex items-start space-x-1
            ${state === 'error' ? 'text-red-600' :
              state === 'success' ? 'text-green-600' :
              state === 'warning' ? 'text-yellow-600' :
              'text-gray-500'}
          `}
          id={`${htmlFor}-help`}
          role="note"
        >
          <span className="mt-0.5">💡</span>
          <span>{helpText}</span>
        </p>
      )}
    </div>
  );
};

/**
 * FormLabelCompact - Versión compacta del FormLabel para formularios densos
 */
export const FormLabelCompact: React.FC<FormLabelProps> = (props) => {
  return (
    <FormLabel
      {...props}
      size="sm"
      className={`form-label-compact ${props.className || ''}`}
    />
  );
};

/**
 * FormLabelLarge - Versión ampliada del FormLabel para formularios principales
 */
export const FormLabelLarge: React.FC<FormLabelProps> = (props) => {
  return (
    <FormLabel
      {...props}
      size="lg"
      className={`form-label-large ${props.className || ''}`}
    />
  );
};

export default FormLabel;