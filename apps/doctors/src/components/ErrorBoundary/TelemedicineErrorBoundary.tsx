'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Phone } from 'lucide-react';

import { logger } from '@altamedica/shared/services/logger.service';
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class TelemedicineErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Actualizar el estado para mostrar la UI de error
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('🚨 Error en componente de telemedicina:', error);
    
    // Solo logs detallados en desarrollo (HIPAA compliance)
    if (process.env.NODE_ENV === 'development') {
      logger.error('ErrorInfo:', errorInfo);
    } else {
      // En producción, solo el tipo de error
      logger.error('Telemedicine error type:', error.name);
    }

    this.setState({
      error,
      errorInfo,
    });

    // Callback opcional para logging externo
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleEmergencyCall = () => {
    // En caso de emergencia médica, proporcionar número de emergencia
    window.open('tel:112', '_self');
  };

  public render() {
    if (this.state.hasError) {
      // UI de error personalizada para telemedicina
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-monokai-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-monokai-surface rounded-lg border border-monokai-border p-6 text-center">
            <div className="mb-6">
              <AlertTriangle className="w-16 h-16 text-monokai-accent-orange mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-monokai-text-primary mb-2">
                Error en la Videollamada
              </h2>
              <p className="text-monokai-text-secondary text-sm">
                Ha ocurrido un error técnico durante la consulta médica.
                Su seguridad y atención médica son nuestra prioridad.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={this.handleRetry}
                className="w-full bg-monokai-accent-blue hover:bg-monokai-accent-green text-monokai-background font-semibold py-2 px-4 rounded-md transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reintentar Conexión</span>
              </button>

              <button
                onClick={this.handleEmergencyCall}
                className="w-full bg-monokai-accent-pink hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md transition-colors flex items-center justify-center space-x-2"
              >
                <Phone className="w-4 h-4" />
                <span>Llamada de Emergencia (112)</span>
              </button>
            </div>

            <div className="text-xs text-monokai-text-muted">
              <p className="mb-2">Si el problema persiste:</p>
              <ul className="list-disc list-inside space-y-1 text-left">
                <li>Verifique su conexión a internet</li>
                <li>Actualice la página del navegador</li>
                <li>Contacte al soporte técnico</li>
                <li>En emergencias médicas, llame al 112</li>
              </ul>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-3 bg-monokai-background rounded border text-left">
                <summary className="text-monokai-accent-orange text-sm cursor-pointer">
                  Detalles técnicos (solo en desarrollo)
                </summary>
                <pre className="text-xs text-monokai-text-muted mt-2 overflow-auto">
                  {this.state.error.stack}
                </pre>
                {this.state.errorInfo && (
                  <pre className="text-xs text-monokai-text-muted mt-2 overflow-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook para usar el Error Boundary de forma funcional
export const withTelemedicineErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorFallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <TelemedicineErrorBoundary fallback={errorFallback}>
      <Component {...props} />
    </TelemedicineErrorBoundary>
  );

  WrappedComponent.displayName = `withTelemedicineErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default TelemedicineErrorBoundary;