/**
 * 🏥 HOOK PERSONALIZADO PARA DASHBOARD HOSPITALARIO
 * Maneja el estado y la lógica del dashboard de red hospitalaria
 */

import { logger } from '@altamedica/shared/services/logger.service';
import { useCallback, useEffect, useState } from 'react';
import { HospitalMetrics } from '../../../services/HospitalDataIntegrationService';
import {
    DashboardState
} from '../types/HospitalDashboardTypes';

export function useHospitalDashboard(hospitalId: string) {
  const [state, setState] = useState<DashboardState>({
    metrics: null,
    networkStatus: {
      healthy: 78, warning: 15, critical: 7, total: 100
    },
    loading: true,
    lastUpdate: new Date(),
    dataSource: 'mixed',
    redistributionSuggestions: [],
    activeRedistributions: new Set(),
    staffShortages: [],
    jobPostings: [],
    autoRedistributionEnabled: true,
    autoJobPostingEnabled: true,
    emergencyMode: false,
    showMapView: false,
    mapHospitals: [],
    selectedHospitalOnMap: null,
    expandedSections: {
      redistribution: true,
      staffShortages: true,
      jobPostings: true,
      metrics: true,
      controls: true
    },
    isDarkMode: false,
    isCompactView: false
  });

  // Cargar datos del hospital
  const loadHospitalData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Datos mock mientras se soluciona el servicio
      const mockData: HospitalMetrics = {
        hospitalId: hospitalId,
        timestamp: new Date(),
        occupancy: {
          beds: {
            total: 300,
            occupied: 285,
            available: 15,
            percentage: 95
          },
          emergency: {
            waiting: 15,
            averageWaitTime: 45,
            critical: 3
          },
          specialties: [
            {
              name: 'Cardiología',
              doctors: 5,
              patients: 50,
              saturation: 85
            },
            {
              name: 'Neurología',
              doctors: 3,
              patients: 25,
              saturation: 92
            },
            {
              name: 'Pediatría',
              doctors: 8,
              patients: 75,
              saturation: 78
            }
          ]
        },
        staff: {
          total: 150,
          active: 135,
          bySpecialty: new Map()
        },
        dataQuality: {
          source: 'mixed' as any,
          confidence: 87,
          lastUpdate: new Date()
        }
      };

      setState(prev => ({
        ...prev,
        metrics: mockData,
        lastUpdate: new Date(),
        loading: false
      }));

      updateNetworkStatus(mockData);
    } catch (error) {
      logger.error('Error loading hospital data:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [hospitalId]);

  // Actualizar estado de la red
  const updateNetworkStatus = useCallback((metrics: HospitalMetrics) => {
    const totalHospitals = 100;
    const healthy = Math.floor(Math.random() * 80) + 20;
    const warning = Math.floor(Math.random() * 20) + 5;
    const critical = totalHospitals - healthy - warning;

    setState(prev => ({
      ...prev,
      networkStatus: { healthy, warning, critical, total: totalHospitals }
    }));
  }, []);

  // Toggle de secciones expandibles
  const toggleSection = useCallback((section: keyof DashboardState['expandedSections']) => {
    setState(prev => ({
      ...prev,
      expandedSections: {
        ...prev.expandedSections,
        [section]: !prev.expandedSections[section]
      }
    }));
  }, []);

  // Toggle de modo oscuro
  const toggleDarkMode = useCallback(() => {
    setState(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }));
  }, []);

  // Toggle de vista compacta
  const toggleCompactView = useCallback(() => {
    setState(prev => ({ ...prev, isCompactView: !prev.isCompactView }));
  }, []);

  // Toggle de modo emergencia
  const toggleEmergencyMode = useCallback(() => {
    setState(prev => ({ ...prev, emergencyMode: !prev.emergencyMode }));
  }, []);

  // Toggle de vista de mapa
  const toggleMapView = useCallback(() => {
    setState(prev => ({ ...prev, showMapView: !prev.showMapView }));
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadHospitalData();
  }, [loadHospitalData]);

  return {
    state,
    loadHospitalData,
    updateNetworkStatus,
    toggleSection,
    toggleDarkMode,
    toggleCompactView,
    toggleEmergencyMode,
    toggleMapView
  };
}
