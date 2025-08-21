'use client';

/**
 * Archivo unificado de wrappers cliente para componentes que requieren 'use client'
 * Consolida todos los wrappers pequeños en un solo lugar para mejor mantenimiento
 */

import { EmergencyBanner } from '@altamedica/ui';
import NotificationsCard from '@/components/notifications/NotificationsMVP';
import { useState, useEffect } from 'react';
import { useEmergencyBanner } from '../hooks/useEmergency';
import { emergencyService } from '../services/emergency-service';


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
          autoHideDelay: 10000
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [emergency]);

  if (!emergency) return null;

  return (
    <EmergencyBanner
      emergency={emergency}
      onDismiss={dismiss}
      onActionClick={(action) => {
        if (executeAction && action.id) {
          executeAction(action.id);
        }
      }}
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