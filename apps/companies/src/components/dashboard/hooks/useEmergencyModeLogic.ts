import { logger } from '@altamedica/shared/services/logger.service';
/**
 * Custom Hook: Emergency Mode Logic
 * Extracted from HospitalNetworkDashboard.tsx for better separation of concerns
 */

import { useCallback, useEffect } from 'react';
import type { RedistributionSuggestion } from './useRedistributionLogic';

export interface EmergencyActions {
  autoRedistribution: boolean;
  priorityAlerts: boolean;
  staffReallocation: boolean;
  externalSupport: boolean;
}

export interface EmergencyMetrics {
  totalAlerts: number;
  criticalHospitals: number;
  activeRedistributions: number;
  estimatedResolutionTime: number;
}

export const useEmergencyModeLogic = () => {
  const evaluateEmergencyActions = useCallback((
    metrics: any,
    redistributionSuggestions: RedistributionSuggestion[],
    autoRedistributionEnabled: boolean,
    executeRedistribution: (id: string) => void
  ) => {
    if (metrics && metrics.occupancy?.beds?.percentage > 95) {
      const criticalSuggestions = redistributionSuggestions.filter(
        s => s.priority === 'critical' && s.status === 'pending'
      );
      
      criticalSuggestions.forEach(suggestion => {
        if (autoRedistributionEnabled) {
          executeRedistribution(suggestion.id);
        }
      });
    }
  }, []);

  const triggerEmergencyProtocol = useCallback((hospitalId: string, emergencyType: string) => {
    const actions: EmergencyActions = {
      autoRedistribution: true,
      priorityAlerts: true,
      staffReallocation: true,
      externalSupport: emergencyType === 'mass_casualty'
    };

    logger.info(`🚨 Emergency protocol activated for ${hospitalId}:`, actions);
    
    return actions;
  }, []);

  const calculateEmergencyMetrics = useCallback((
    redistributionSuggestions: RedistributionSuggestion[],
    networkStatus: any
  ): EmergencyMetrics => {
    const criticalSuggestions = redistributionSuggestions.filter(s => s.priority === 'critical');
    const activeSuggestions = redistributionSuggestions.filter(s => s.status === 'executing');
    
    return {
      totalAlerts: criticalSuggestions.length,
      criticalHospitals: networkStatus?.critical || 0,
      activeRedistributions: activeSuggestions.length,
      estimatedResolutionTime: Math.max(
        ...activeSuggestions.map(s => s.estimatedTime)
      ) || 0
    };
  }, []);

  const getEmergencyPriority = useCallback((metrics: any): 'low' | 'medium' | 'high' | 'critical' => {
    if (!metrics) return 'low';
    
    const occupancyRate = metrics.occupancy?.beds?.percentage || 0;
    const waitingPatients = metrics.occupancy?.emergency?.waiting || 0;
    
    if (occupancyRate > 95 && waitingPatients > 20) return 'critical';
    if (occupancyRate > 90 || waitingPatients > 15) return 'high';
    if (occupancyRate > 80 || waitingPatients > 10) return 'medium';
    return 'low';
  }, []);

  const activateEmergencyResponse = useCallback((
    hospitalId: string,
    priority: 'low' | 'medium' | 'high' | 'critical'
  ) => {
    const responseActions = {
      low: ['monitor_closely'],
      medium: ['increase_staff', 'prepare_redistribution'],
      high: ['activate_overflow_protocols', 'contact_nearby_hospitals'],
      critical: ['full_emergency_mode', 'external_assistance', 'media_alert']
    };

    const actions = responseActions[priority] || [];
    logger.info(`🚨 Emergency response activated for ${hospitalId} (${priority}):`, actions);
    
    return actions;
  }, []);

  return {
    // Actions
    evaluateEmergencyActions,
    triggerEmergencyProtocol,
    calculateEmergencyMetrics,
    getEmergencyPriority,
    activateEmergencyResponse,
  };
};