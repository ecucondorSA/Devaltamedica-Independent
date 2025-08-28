// 🏗️ LAYOUT COMPUESTO MODULAR ALTAMEDICA
// Integra todos los componentes modulares manteniendo compatibilidad total
// CONSERVADOR: Misma API que original, funcionalidad mejorada internamente

'use client';

import React, { useCallback, useState } from 'react';
import { AuthProvider } from '@altamedica/auth';
import type { FooterProps } from './PatientFooterModular';
import PatientFooterModular from './PatientFooterModular';
import PatientHeaderModular from './PatientHeaderModular';
import type { SidebarConfig } from './PatientSidebarModular';
import PatientSidebarModular from './PatientSidebarModular';

import { logger } from '@altamedica/shared';
// 📝 INTERFAZ COMPATIBLE CON LAYOUT ORIGINAL
interface PatientLayoutModularProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  requireAuth?: boolean;
  className?: string;

  // 🔧 Configuraciones opcionales para componentes modulares
  sidebarConfig?: SidebarConfig;
  footerConfig?: Omit<FooterProps, 'className'>;
  showHeader?: boolean;
  showFooter?: boolean;
  onNavigate?: (item: any) => void;
  onError?: (error: Error) => void;
}

// 🏗️ CONTENIDO PRINCIPAL MODULAR
function PatientLayoutModularContent({
  children,
  title,
  subtitle,
  actions,
  className = '',
  sidebarConfig,
  footerConfig,
  showHeader = true,
  showFooter = true,
  onNavigate,
  onError,
}: PatientLayoutModularProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleMenuToggle = useCallback(() => {
    setShowMobileMenu((prev) => !prev);
  }, []);

  const handleNavigate = useCallback(
    (item: any) => {
      setShowMobileMenu(false);
      onNavigate?.(item);
    },
    [onNavigate],
  );

  const handleError = useCallback(
    (error: Error) => {
      logger.error('Layout Error:', error);
      onError?.(error);
    },
    [onError],
  );

  return (
    <div className={`flex h-screen bg-gradient-primary-altamedica ${className}`}>
      {/* 🧭 SIDEBAR MODULAR */}
      <PatientSidebarModular
        config={{
          collapsible: true,
          persistState: true,
          showUserProfile: true,
          ...sidebarConfig,
        }}
        onNavigate={handleNavigate}
        onError={handleError}
      />

      {/* 📱 CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 📋 HEADER MODULAR */}
        {showHeader && (
          <PatientHeaderModular
            title={title}
            subtitle={subtitle}
            actions={actions}
            onMenuToggle={handleMenuToggle}
            showMobileMenu={showMobileMenu}
          />
        )}

        {/* 📄 CONTENIDO */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-conservative">
            {children}
          </div>
        </main>

        {/* 🦶 FOOTER MODULAR */}
        {showFooter && (
          <PatientFooterModular
            {...footerConfig}
            onLinkClick={(link) => {
              logger.info('Footer link clicked:', link);
              footerConfig?.onLinkClick?.(link);
            }}
          />
        )}
      </div>
    </div>
  );
}

// 🏗️ LAYOUT PRINCIPAL EXPORTADO (API COMPATIBLE)
export default function PatientLayoutModular({
  children,
  title,
  subtitle,
  actions,
  requireAuth = true,
  ...props
}: PatientLayoutModularProps) {
  return (
    <AuthProvider>
      {requireAuth ? (
        <ProtectedRoute requiredRole="patient">
          <PatientLayoutModularContent
            title={title}
            subtitle={subtitle}
            actions={actions}
            {...props}
          >
            {children}
          </PatientLayoutModularContent>
        </ProtectedRoute>
      ) : (
        <PatientLayoutModularContent title={title} subtitle={subtitle} actions={actions} {...props}>
          {children}
        </PatientLayoutModularContent>
      )}
    </AuthProvider>
  );
}
