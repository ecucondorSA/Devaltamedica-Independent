'use client';

import { useState, useEffect, useCallback } from 'react';
import { emergencyService, Emergency, EmergencyAction } from '../services/emergency-service';

export function useEmergency() {
  const [activeEmergencies, setActiveEmergencies] = useState<Emergency[]>([]);
  const [emergencyHistory, setEmergencyHistory] = useState<Emergency[]>([]);

  useEffect(() => {
    // Cargar emergencias activas iniciales
    setActiveEmergencies(emergencyService.getActiveEmergencies());
    setEmergencyHistory(emergencyService.getEmergencyHistory());

    // Escuchar nuevas emergencias
    const handleEmergency = (emergency: Emergency) => {
      setActiveEmergencies(prev => [...prev, emergency]);
      setEmergencyHistory(prev => [...prev, emergency]);
    };

    const handleEmergencyDismissed = (emergency: Emergency) => {
      setActiveEmergencies(prev => prev.filter(e => e.id !== emergency.id));
    };

    emergencyService.on('emergency', handleEmergency);
    emergencyService.on('emergency-dismissed', handleEmergencyDismissed);

    return () => {
      emergencyService.off('emergency', handleEmergency);
      emergencyService.off('emergency-dismissed', handleEmergencyDismissed);
    };
  }, []);

  const triggerEmergency = useCallback((emergency: Omit<Emergency, 'id' | 'timestamp'>) => {
    return emergencyService.triggerEmergency(emergency);
  }, []);

  const dismissEmergency = useCallback((id: string) => {
    emergencyService.dismissEmergency(id);
  }, []);

  const executeAction = useCallback((emergencyId: string, actionId: string) => {
    emergencyService.executeEmergencyAction(emergencyId, actionId);
  }, []);

  const notifyContacts = useCallback(async (patientId: string, emergencyId: string, contacts: any[]) => {
    return emergencyService.notifyEmergencyContacts(patientId, emergencyId, contacts);
  }, []);

  return {
    activeEmergencies,
    emergencyHistory,
    triggerEmergency,
    dismissEmergency,
    executeAction,
    notifyContacts,
    hasActiveEmergencies: activeEmergencies.length > 0,
    criticalEmergencyCount: activeEmergencies.filter(e => e.severity === 'critical').length
  };
}

// Hook para escuchar solo emergencias críticas
export function useCriticalEmergencies() {
  const { activeEmergencies } = useEmergency();
  return activeEmergencies.filter(e => e.severity === 'critical');
}

// Hook para el banner de emergencias
export function useEmergencyBanner() {
  const { activeEmergencies, dismissEmergency, executeAction } = useEmergency();
  
  // Mostrar solo la emergencia más reciente y crítica
  const currentEmergency = activeEmergencies
    .filter(e => e.severity === 'high' || e.severity === 'critical')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  return {
    emergency: currentEmergency,
    dismiss: currentEmergency ? () => dismissEmergency(currentEmergency.id) : undefined,
    executeAction: currentEmergency ? (actionId: string) => executeAction(currentEmergency.id, actionId) : undefined
  };
}