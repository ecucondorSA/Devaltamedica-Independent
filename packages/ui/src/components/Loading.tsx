import React from 'react';
import { cn } from '../utils/cn';

// ==================== LOADING TYPES ====================

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'medical';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  className?: string;
}

// ==================== LOADING COMPONENT ====================

export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'spinner',
  color = 'primary',
  text,
  fullScreen = false,
  overlay = false,
  className,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    gray: 'text-gray-400',
  };

  const renderSpinner = () => (
    <div className={cn('animate-spin', sizeClasses[size], colorClasses[color], className)}>
      <svg fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );

  const renderDots = () => (
    <div className={cn('flex space-x-1', sizeClasses[size], className)}>
      <div
        className={cn('animate-bounce bg-current rounded-full', colorClasses[color])}
        style={{ animationDelay: '0ms' }}
      />
      <div
        className={cn('animate-bounce bg-current rounded-full', colorClasses[color])}
        style={{ animationDelay: '150ms' }}
      />
      <div
        className={cn('animate-bounce bg-current rounded-full', colorClasses[color])}
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );

  const renderPulse = () => (
    <div
      className={cn(
        'animate-pulse bg-current rounded',
        sizeClasses[size],
        colorClasses[color],
        className,
      )}
    />
  );

  const renderBars = () => (
    <div className={`flex space-x-1 ${sizeClasses[size]}`}>
      <div
        className={`w-1 bg-current animate-pulse ${colorClasses[color]}`}
        style={{ animationDelay: '0ms' }}
      />
      <div
        className={`w-1 bg-current animate-pulse ${colorClasses[color]}`}
        style={{ animationDelay: '150ms' }}
      />
      <div
        className={`w-1 bg-current animate-pulse ${colorClasses[color]}`}
        style={{ animationDelay: '300ms' }}
      />
      <div
        className={`w-1 bg-current animate-pulse ${colorClasses[color]}`}
        style={{ animationDelay: '450ms' }}
      />
    </div>
  );

  const renderMedical = () => (
    <div className={`relative ${sizeClasses[size]}`}>
      <div
        className={`absolute inset-0 border-2 border-current rounded-full animate-ping opacity-75 ${colorClasses[color]}`}
      />
      <div
        className={`absolute inset-0 border-2 border-current rounded-full ${colorClasses[color]}`}
      />
      <div
        className={`absolute inset-2 bg-current rounded-full animate-pulse ${colorClasses[color]}`}
      />
    </div>
  );

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'bars':
        return renderBars();
      case 'medical':
        return renderMedical();
      default:
        return renderSpinner();
    }
  };

  const content = (
    <div className="flex flex-col items-center justify-center space-y-2">
      {renderLoader()}
      {text && <p className={`text-sm font-medium ${colorClasses[color]}`}>{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
        {content}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-75">
        {content}
      </div>
    );
  }

  return content;
};

// ==================== SPECIALIZED LOADING COMPONENTS ====================

export const MedicalLoading: React.FC<LoadingProps> = (props) => {
  return <Loading variant="medical" color="primary" text="Cargando datos médicos..." {...props} />;
};

export const PatientLoading: React.FC<LoadingProps> = (props) => {
  return (
    <Loading
      variant="spinner"
      color="primary"
      text="Cargando información del paciente..."
      {...props}
    />
  );
};

export const AppointmentLoading: React.FC<LoadingProps> = (props) => {
  return <Loading variant="dots" color="primary" text="Cargando citas..." {...props} />;
};

export const PrescriptionLoading: React.FC<LoadingProps> = (props) => {
  return <Loading variant="medical" color="primary" text="Cargando prescripciones..." {...props} />;
};

export const LabResultLoading: React.FC<LoadingProps> = (props) => {
  return <Loading variant="bars" color="primary" text="Cargando resultados..." {...props} />;
};

// ==================== LOADING STATES ====================

export const LoadingState: React.FC<{
  loading: boolean;
  children: React.ReactNode;
}> = ({ loading, children }) => {
  if (loading) {
    return <Loading />;
  }
  return <>{children}</>;
};

export const LoadingOverlay: React.FC<{
  loading: boolean;
  children: React.ReactNode;
}> = ({ loading, children }) => {
  return (
    <div className="relative">
      {children}
      {loading && <Loading overlay />}
    </div>
  );
};

// ==================== SKELETON LOADING ====================

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 1,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4" />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <SkeletonText lines={3} />
      <div className="flex space-x-2 mt-4">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
};

// ==================== EXPORT ====================

export default Loading;

export const LoadingSpinner = Loading;
export const LoadingDots = (props: Omit<LoadingProps, 'variant'>) => (
  <Loading {...props} variant="dots" />
);
export const LoadingPulse = (props: Omit<LoadingProps, 'variant'>) => (
  <Loading {...props} variant="pulse" />
);
