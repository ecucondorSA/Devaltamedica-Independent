// 🏗️ LAYOUT PRINCIPAL ALTAMEDICA
// Layout responsivo con sidebar y header
// PROACTIVO: <350 líneas, responsive, accesible

'use client';

import React from 'react';
import PatientSidebar from './PatientSidebar';
import { AuthProvider } from "@altamedica/auth';
import { Bell, Search, User } from 'lucide-react';

import { logger } from '@altamedica/shared/services/logger.service';
interface PatientLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  requireAuth?: boolean;
}

function PatientHeader({ title, subtitle, actions }: {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex-1">
            {title && (
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
          
          {/* 🔍 BARRA DE BÚSQUEDA */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar en el portal..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
            
            {/* 🔔 NOTIFICACIONES */}
            <button className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                3
              </span>
            </button>
            
            {/* 👤 PERFIL RÁPIDO */}
            <button className="flex items-center space-x-2 p-2 text-gray-600 hover:text-blue-600 transition-colors">
              <User className="w-5 h-5" />
              <span className="hidden lg:block text-sm font-medium">Mi Perfil</span>
            </button>
          </div>
          
          {/* 🎯 ACCIONES PERSONALIZADAS */}
          {actions && (
            <div className="flex items-center space-x-2 ml-4">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function PatientLayoutContent({ 
  children, 
  title, 
  subtitle, 
  actions 
}: PatientLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* 🧭 SIDEBAR */}
      <PatientSidebar />
      
      {/* 📱 CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* 📋 HEADER */}
        <PatientHeader title={title} subtitle={subtitle} actions={actions} />
        
        {/* 📄 CONTENIDO */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
        
        {/* 🦶 FOOTER */}
        <footer className="bg-white border-t border-gray-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <p className="text-sm text-gray-600">
              © 2025 AltaMedica. Todos los derechos reservados.
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <a href="/privacy" className="hover:text-blue-600 transition-colors">
                Privacidad
              </a>
              <a href="/terms" className="hover:text-blue-600 transition-colors">
                Términos
              </a>
              <a href="/support" className="hover:text-blue-600 transition-colors">
                Soporte
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// 🏗️ LAYOUT PRINCIPAL EXPORTADO
export default function PatientLayout({ 
  children, 
  title, 
  subtitle, 
  actions, 
  requireAuth = true 
}: PatientLayoutProps) {
  return (
    <AuthProvider>
      {requireAuth ? (
        <ProtectedRoute requiredRole="patient">
          <PatientLayoutContent 
            title={title} 
            subtitle={subtitle} 
            actions={actions}
          >
            {children}
          </PatientLayoutContent>
        </ProtectedRoute>
      ) : (
        <PatientLayoutContent 
          title={title} 
          subtitle={subtitle} 
          actions={actions}
        >
          {children}
        </PatientLayoutContent>
      )}
    </AuthProvider>
  );
}

// 🎯 COMPONENTES DE UTILIDAD PARA LAYOUTS
export function PageHeader({ 
  title, 
  subtitle, 
  actions 
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-lg text-gray-600">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export function ContentCard({ 
  children, 
  className = "" 
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ 
  title, 
  subtitle, 
  actions 
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export function CardContent({ 
  children, 
  className = "" 
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}

// 🚨 COMPONENTE DE ERROR BOUNDARY
export class PatientLayoutErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('PatientLayout Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              ¡Oops! Algo salió mal
            </h2>
            <p className="text-gray-600 mb-6">
              Ha ocurrido un error inesperado. Por favor, recarga la página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
