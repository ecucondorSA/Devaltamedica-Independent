'use client'
import React, { Component, ReactNode } from 'react'

import { logger } from '@altamedica/shared/services/logger.service';
interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class FirebaseErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Actualizar el estado para que el siguiente render muestre la UI de fallback
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log del error
    logger.error('Firebase Error Boundary caught an error:', error, errorInfo)
    
    // Aquí podrías enviar el error a un servicio de logging
    // logErrorToService(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // UI de fallback personalizada
      if (this.props.fallback) {
        return this.props.fallback
      }

      // UI de fallback por defecto
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                Error de Conexión
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Ha ocurrido un error al conectar con los servicios. Por favor, intenta recargar la página.
              </p>
              {this.state.error && (
                <details className="mt-4 text-xs text-gray-400">
                  <summary className="cursor-pointer hover:text-gray-600">
                    Ver detalles del error
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-left overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              <div className="mt-6">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  🔄 Recargar Página
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook para manejar errores de Firebase
export const useFirebaseErrorHandler = () => {
  const handleFirebaseError = (error: any, context: string = '') => {
    logger.error(`Firebase error in ${context}:`, error)
    
    // Manejar errores específicos de Firebase
    if (error.code === 'app/duplicate-app') {
      logger.warn('Firebase app already initialized, this is normal in development')
      return
    }
    
    if (error.code === 'permission-denied') {
      logger.error('Firebase permission denied - check security rules')
      return
    }
    
    if (error.code === 'unavailable') {
      logger.error('Firebase service unavailable - check network connection')
      return
    }
    
    // Error genérico
    logger.error('Unexpected Firebase error:', error)
  }

  return { handleFirebaseError }
}

// Componente de carga para Firebase
export const FirebaseLoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-sm text-gray-600">Conectando con Firebase...</span>
  </div>
)

// Componente de estado de Firebase
export const FirebaseStatus: React.FC<{ isLoading: boolean; error: string | null }> = ({ 
  isLoading, 
  error 
}) => {
  if (isLoading) {
    return <FirebaseLoadingSpinner />
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error de Conexión Firebase
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
} 