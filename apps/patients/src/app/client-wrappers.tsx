'use client';

import { logger } from '@altamedica/shared/services/logger.service';

/**
 * Archivo unificado de wrappers cliente para componentes que requieren 'use client'
 * Consolida todos los wrappers pequeños en un solo lugar para mejor mantenimiento
 */

import { EmergencyBanner } from '@altamedica/ui';
import NotificationsCard from '../components/notifications/NotificationsMVP';
import { useState, useEffect } from 'react';
import { useEmergencyBanner } from '../hooks/useEmergency';
import { emergencyService } from '../services/emergency-service';
import { AuthProvider as AuthProviderClient } from '@altamedica/auth';

/**
 * Wrapper para EmergencyBanner usando el sistema unificado de emergencias
 */
export function EmergencyBannerWrapper() {
  const { emergency, dismiss, executeAction } = useEmergencyBanner();

  useEffect(() => {
    // En desarrollo, mostrar una emergencia de prueba
    if (process.env.NODE_ENV === 'development' && !emergency) {
      const timer = setTimeout(() => {
        emergencyService.triggerEmergency({
          type: 'medical',
          severity: 'high',
          message: 'Sistema de emergencias médicas activo y funcionando',
          actions: [],
          autoHide: true,
          autoHideDelay: 10000,
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [emergency]);

  if (!emergency) return null;

  return (
    <EmergencyBanner
      type={
        emergency.severity === 'critical'
          ? 'critical'
          : emergency.severity === 'high'
            ? 'urgent'
            : 'warning'
      }
      title={`Emergencia ${emergency.type}`}
      message={emergency.message}
      onDismiss={dismiss}
      onEmergencyCall={() => {
        // Lógica para llamada de emergencia
        logger.info('Llamada de emergencia iniciada');
      }}
      autoHide={emergency.autoHide}
      autoHideDelay={emergency.autoHideDelay}
      className="w-full"
    />
  );
}

/**
 * Wrapper para NotificationsCard
 * Exportado como default para compatibilidad con importación existente
 */
export default function ClientSidebarWidgets() {
  return <NotificationsCard />;
}

/**
 * Re-export individual para uso específico
 */
export { NotificationsCard as ClientNotifications };

/**
 * Wrapper para AuthProvider que necesita 'use client'
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthProviderClient>{children}</AuthProviderClient>;
}
