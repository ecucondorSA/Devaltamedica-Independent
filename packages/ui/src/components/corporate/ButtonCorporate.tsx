// 🔘 BUTTON CORPORATIVO ALTAMEDICA - COMPONENTE BASE ROBUSTO
// Implementa design system corporativo con validaciones y estados avanzados
// CONSERVADOR: Base sólida para todos los componentes, máxima robustez
// MIGRADO DESDE: apps/patients/src/components/ui/ButtonCorporate.tsx

'use client';

import React, { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

// Simple logger implementation to avoid circular dependencies
const logger = {
  info: (message, data?) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(message, data);
    }
  },
  warn: (message, data) => {
    if (typeof console !== 'undefined') {
      console.warn(message, data);
    }
  },
  error: (message, data) => {
    if (typeof console !== 'undefined') {
      console.error(message, data);
    }
  },
  debug: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.debug(message, data);
    }
  },
};
// 📝 TIPOS ROBUSTOS PARA BUTTON CORPORATIVO
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'warning'
  | 'medical'
  | 'emergency';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonCorporateProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: boolean;
  shadow?: boolean;
  gradient?: boolean;
  animate?: boolean;
  medical?: boolean;
  emergency?: boolean;
  /**
   * Contenido textual. Opcional para permitir botones icon-only.
   * Si se omite, se debe proporcionar aria-label para accesibilidad.
   */
  children?: ReactNode;
}

// 🎨 CONFIGURACIÓN DE ESTILOS CORPORATIVOS
const BUTTON_VARIANTS = {
  primary: {
    base: 'bg-primary-altamedica text-white border-primary-altamedica',
    hover: 'hover:bg-secondary-altamedica hover:border-secondary-altamedica',
    active: 'active:bg-primary-altamedica active:scale-95',
    disabled: 'disabled:bg-gray-300 disabled:border-gray-300 disabled:cursor-not-allowed',
    gradient: 'bg-gradient-cta-altamedica',
  },
  secondary: {
    base: 'bg-white text-primary-altamedica border-primary-altamedica',
    hover: 'hover:bg-gradient-primary-altamedica hover:text-secondary-altamedica',
    active: 'active:bg-primary-altamedica active:text-white active:scale-95',
    disabled:
      'disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed',
    gradient: 'bg-white hover:bg-gradient-primary-altamedica',
  },
  outline: {
    base: 'bg-transparent text-primary-altamedica border-primary-altamedica',
    hover: 'hover:bg-primary-altamedica hover:text-white',
    active: 'active:bg-secondary-altamedica active:scale-95',
    disabled: 'disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed',
    gradient: 'hover:bg-gradient-cta-altamedica',
  },
  ghost: {
    base: 'bg-transparent text-primary-altamedica border-transparent',
    hover: 'hover:bg-gradient-primary-altamedica hover:border-primary-altamedica',
    active: 'active:bg-primary-altamedica active:text-white active:scale-95',
    disabled: 'disabled:text-gray-400 disabled:cursor-not-allowed',
    gradient: 'hover:bg-gradient-primary-altamedica',
  },
  danger: {
    base: 'bg-danger text-white border-danger',
    hover: 'hover:bg-red-700 hover:border-red-700',
    active: 'active:bg-danger active:scale-95',
    disabled: 'disabled:bg-gray-300 disabled:border-gray-300 disabled:cursor-not-allowed',
    gradient: 'bg-gradient-to-r from-danger to-red-600',
  },
  success: {
    base: 'bg-success text-white border-success',
    hover: 'hover:bg-green-700 hover:border-green-700',
    active: 'active:bg-success active:scale-95',
    disabled: 'disabled:bg-gray-300 disabled:border-gray-300 disabled:cursor-not-allowed',
    gradient: 'bg-gradient-to-r from-success to-green-600',
  },
  warning: {
    base: 'bg-warning text-white border-warning',
    hover: 'hover:bg-orange-700 hover:border-orange-700',
    active: 'active:bg-warning active:scale-95',
    disabled: 'disabled:bg-gray-300 disabled:border-gray-300 disabled:cursor-not-allowed',
    gradient: 'bg-gradient-to-r from-warning to-orange-600',
  },
  medical: {
    base: 'bg-secondary-altamedica text-white border-secondary-altamedica',
    hover: 'hover:bg-primary-altamedica hover:border-primary-altamedica',
    active: 'active:bg-secondary-altamedica active:scale-95',
    disabled: 'disabled:bg-gray-300 disabled:border-gray-300 disabled:cursor-not-allowed',
    gradient: 'bg-gradient-to-r from-secondary-altamedica to-primary-altamedica',
  },
  emergency: {
    base: 'bg-danger text-white border-danger animate-pulse',
    hover: 'hover:bg-red-700 hover:border-red-700 hover:animate-none',
    active: 'active:bg-danger active:scale-95',
    disabled:
      'disabled:bg-gray-300 disabled:border-gray-300 disabled:cursor-not-allowed disabled:animate-none',
    gradient: 'bg-gradient-to-r from-danger to-red-600 animate-pulse',
  },
};

const BUTTON_SIZES = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg',
};

const ICON_SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
};

// 🔘 COMPONENTE PRINCIPAL BUTTON CORPORATIVO
export const ButtonCorporate = forwardRef<HTMLButtonElement, ButtonCorporateProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText = 'Cargando...',
      icon,
      iconPosition = 'left',
      fullWidth = false,
      rounded = true,
      shadow = true,
      gradient = false,
      animate = true,
      medical = false,
      emergency = false,
      disabled = false,
      className = '',
      children,
      'aria-label': ariaLabel,
      ...props
    },
    ref,
  ) => {
    // 🛡️ VALIDACIONES ROBUSTAS
    if (medical) variant = 'medical';
    if (emergency) variant = 'emergency';

    // Accesibilidad: si no hay children y no hay aria-label, advertir en dev
    if (process.env.NODE_ENV !== 'production' && !children && !ariaLabel) {
      // eslint-disable-next-line no-console
      console.warn(
        '[ButtonCorporate] Botón icon-only sin aria-label proporcionado. Añade aria-label para accesibilidad.',
      );
    }

    const actuallyDisabled = disabled || loading;

    // 🎨 CONSTRUCCIÓN DE CLASES CSS CORPORATIVAS
    const variantConfig = BUTTON_VARIANTS[variant];
    const sizeClass = BUTTON_SIZES[size];
    const iconSize = ICON_SIZES[size];

    const baseClasses = `
      inline-flex items-center justify-center
      font-medium border
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-altamedica
      transition-all duration-300 ease-in-out
      ${sizeClass}
      ${rounded ? 'rounded-xl' : 'rounded-md'}
      ${fullWidth ? 'w-full' : ''}
      ${shadow ? 'shadow-input hover:shadow-lg' : ''}
      ${animate ? 'hover:scale-105 active:scale-95' : ''}
      ${gradient ? variantConfig.gradient : variantConfig.base}
      ${!actuallyDisabled ? variantConfig.hover : ''}
      ${!actuallyDisabled ? variantConfig.active : variantConfig.disabled}
      ${emergency ? 'animate-pulse hover:animate-none' : ''}
      ${medical ? 'shadow-md' : ''}
      ${actuallyDisabled ? 'pointer-events-none' : ''}
    `
      .replace(/\s+/g, ' ')
      .trim();

    const finalClassName = `${baseClasses} ${className}`;

    return (
      <button
        ref={ref}
        disabled={actuallyDisabled}
        className={finalClassName}
        aria-label={ariaLabel}
        {...props}
      >
        {/* 🔄 LOADING STATE */}
        {loading && (
          <Loader2
            className={`animate-spin ${iconSize} ${iconPosition === 'right' ? 'ml-2' : 'mr-2'}`}
          />
        )}

        {/* 🎯 ICON LEFT */}
        {!loading && icon && iconPosition === 'left' && (
          <span className={`${iconSize} ${children ? 'mr-2' : ''} flex-shrink-0`}>{icon}</span>
        )}

        {/* 📝 TEXT CONTENT (opcional) */}
        {children && (
          <span className={`${loading ? 'opacity-70' : ''} animate-fade-in-conservative`}>
            {loading ? loadingText : children}
          </span>
        )}

        {/* 🎯 ICON RIGHT */}
        {!loading && icon && iconPosition === 'right' && (
          <span className={`${iconSize} ${children ? 'ml-2' : ''} flex-shrink-0`}>{icon}</span>
        )}
      </button>
    );
  },
);

ButtonCorporate.displayName = 'ButtonCorporate';

// 🎯 EXPORT DEFAULT
export default ButtonCorporate;
