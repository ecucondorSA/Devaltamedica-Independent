// 🃏 CARD CORPORATIVO ALTAMEDICA - COMPONENTE CONTENEDOR ROBUSTO
// Sistema de tarjetas con design system corporativo y estados avanzados
// CONSERVADOR: Funcionalidad esencial, máxima compatibilidad y robustez
// MIGRADO DESDE: apps/patients/src/components/ui/CardCorporate.tsx

'use client';

import React, { ReactNode, HTMLAttributes } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

// 📝 TIPOS ROBUSTOS PARA CARD CORPORATIVO
export type CardVariant = 'default' | 'elevated' | 'medical' | 'warning' | 'success' | 'info' | 'emergency';
export type CardSize = 'sm' | 'md' | 'lg' | 'xl';

export interface CardCorporateProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  size?: CardSize;
  shadow?: boolean;
  border?: boolean;
  hover?: boolean;
  loading?: boolean;
  error?: string | null;
  success?: string | null;
  dismissible?: boolean;
  onDismiss?: () => void;
  medical?: boolean;
  emergency?: boolean;
  children: ReactNode;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  medical?: boolean;
  children?: ReactNode;
}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  padding?: boolean;
  children: ReactNode;
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  actions?: ReactNode;
  align?: 'left' | 'center' | 'right' | 'between';
  children?: ReactNode;
}

// 🎨 CONFIGURACIÓN DE ESTILOS CORPORATIVOS PARA CARDS
const CARD_VARIANTS = {
  default: {
    base: 'bg-white border-gray-200',
    hover: 'hover:shadow-xl hover:border-primary-altamedica',
    gradient: 'bg-gradient-primary-altamedica'
  },
  elevated: {
    base: 'bg-white border-secondary-altamedica',
    hover: 'hover:shadow-2xl hover:border-primary-altamedica hover:bg-gradient-primary-altamedica',
    gradient: 'bg-gradient-primary-altamedica'
  },
  medical: {
    base: 'bg-white border-secondary-altamedica bg-gradient-primary-altamedica',
    hover: 'hover:shadow-xl hover:border-primary-altamedica',
    gradient: 'bg-gradient-primary-altamedica'
  },
  warning: {
    base: 'bg-yellow-50 border-warning',
    hover: 'hover:shadow-lg hover:bg-yellow-100',
    gradient: 'bg-gradient-to-br from-yellow-50 to-orange-50'
  },
  success: {
    base: 'bg-green-50 border-success',
    hover: 'hover:shadow-lg hover:bg-green-100',
    gradient: 'bg-gradient-to-br from-green-50 to-emerald-50'
  },
  info: {
    base: 'bg-blue-50 border-primary-altamedica',
    hover: 'hover:shadow-lg hover:bg-gradient-primary-altamedica',
    gradient: 'bg-gradient-primary-altamedica'
  },
  emergency: {
    base: 'bg-red-50 border-danger animate-pulse',
    hover: 'hover:shadow-xl hover:bg-red-100 hover:animate-none',
    gradient: 'bg-gradient-to-br from-red-50 to-pink-50'
  }
};

const CARD_SIZES = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10'
};

// 🃏 COMPONENTE PRINCIPAL CARD CORPORATIVO
export const CardCorporate: React.FC<CardCorporateProps> = ({
  variant = 'default',
  size = 'md',
  shadow = true,
  border = true,
  hover = true,
  loading = false,
  error = null,
  success = null,
  dismissible = false,
  onDismiss,
  medical = false,
  emergency = false,
  className = '',
  children,
  ...props
}) => {
  // 🛡️ VALIDACIONES ROBUSTAS
  if (medical) variant = 'medical';
  if (emergency) variant = 'emergency';

  const variantConfig = CARD_VARIANTS[variant];
  const sizeClass = CARD_SIZES[size];

  const baseClasses = `
    rounded-2xl transition-all duration-300 ease-in-out
    ${border ? 'border' : 'border-0'}
    ${shadow ? 'shadow-lg' : ''}
    ${hover ? 'hover:shadow-xl transform hover:scale-[1.02]' : ''}
    ${loading ? 'animate-pulse' : ''}
    ${variantConfig.base}
    ${hover && !loading ? variantConfig.hover : ''}
    ${emergency ? 'animate-pulse hover:animate-none' : ''}
  `.replace(/\s+/g, ' ').trim();

  return (
    <div className={`${baseClasses} ${className}`} {...props}>
      {/* 🔄 LOADING OVERLAY */}
      {loading && (
        <div className="absolute inset-0 bg-white/70 rounded-2xl flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-altamedica"></div>
        </div>
      )}

      {/* ⚠️ ERROR STATE */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-danger rounded-xl flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0" />
          <span className="text-sm text-red-700 flex-1">{error}</span>
          {dismissible && (
            <button onClick={onDismiss} className="text-danger hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* ✅ SUCCESS STATE */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-success rounded-xl flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
          <span className="text-sm text-green-700 flex-1">{success}</span>
          {dismissible && (
            <button onClick={onDismiss} className="text-success hover:text-green-700">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* 📄 CONTENIDO PRINCIPAL */}
      <div className={`${sizeClass} relative`}>
        {children}
      </div>
    </div>
  );
};

// 📋 COMPONENTE HEADER PARA CARDS
export const CardHeaderCorporate: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  actions,
  medical = false,
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`border-b border-gray-200 pb-4 mb-6 ${className}`} {...props}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className={`text-lg font-semibold ${medical ? 'text-secondary-altamedica' : 'text-primary-altamedica'} animate-fade-in-conservative`}>
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-600 animate-fade-in-conservative">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-2 ml-4">
            {actions}
          </div>
        )}
      </div>
      {children}
    </div>
  );
};

// 📄 COMPONENTE CONTENT PARA CARDS
export const CardContentCorporate: React.FC<CardContentProps> = ({
  padding = false,
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`${padding ? 'p-4' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
};

// 🦶 COMPONENTE FOOTER PARA CARDS
export const CardFooterCorporate: React.FC<CardFooterProps> = ({
  actions,
  align = 'right',
  className = '',
  children,
  ...props
}) => {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between'
  };

  return (
    <div className={`border-t border-gray-200 pt-4 mt-6 flex items-center ${alignClasses[align]} ${className}`} {...props}>
      {actions || children}
    </div>
  );
};

// 🎯 EXPORTS
export default CardCorporate;