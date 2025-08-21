/**
 * Custom Hook: Redistribution Logic (Integrated)
 * Extracted from HospitalNetworkDashboard.tsx for better separation of concerns
 * Now integrated with UnifiedNotificationSystem and emergency protocols
 */

import { useState, useCallback, useEffect } from 'react';

// Unified Systems Integration
import { UnifiedNotificationSystem } from '@altamedica/shared/services/notification-service';

export interface RedistributionSuggestion {
  id: string;
  fromHospitalId: string;
  fromHospitalName: string;
  toHospitalId: string;
  toHospitalName: string;
  patientsToTransfer: number;
  estimatedTime: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  createdAt: Date;
}

export interface StaffShortage {
  id: string;
  hospitalId: string;
  hospitalName: string;
  specialty: string;
  currentStaff: number;
  requiredStaff: number;
  shortage: number;
  severity: 'critical' | 'urgent' | 'moderate';
  impactDescription: string;
  estimatedWaitIncrease: number;
  suggestedActions: string[];
  autoJobPostingTriggered: boolean;
  detectedAt: Date;
}

export const useRedistributionLogic = () => {
  const [redistributionSuggestions, setRedistributionSuggestions] = useState<RedistributionSuggestion[]>([]);
  const [staffShortages, setStaffShortages] = useState<StaffShortage[]>([]);
  const [activeRedistributions, setActiveRedistributions] = useState<Set<string>>(new Set());
  const [autoRedistributionEnabled, setAutoRedistributionEnabled] = useState(false);
  const [autoJobPostingEnabled, setAutoJobPostingEnabled] = useState(false);

  // Initialize unified systems
  const notificationSystem = new UnifiedNotificationSystem();

  const generateRedistributionSuggestions = useCallback((hospitals: any[]): RedistributionSuggestion[] => {
    const suggestions: RedistributionSuggestion[] = [];
    
    const oversaturated = hospitals.filter(h => h.capacity.percentage > 90);
    const hasCapacity = hospitals.filter(h => h.capacity.percentage < 80)
      .sort((a, b) => a.location.distance - b.location.distance);
    
    oversaturated.forEach(fromHosp => {
      const patientsToTransfer = Math.min(
        fromHosp.emergency.waiting - fromHosp.emergency.critical,
        Math.floor((fromHosp.capacity.percentage - 85) / 100 * fromHosp.capacity.max)
      );
      
      if (patientsToTransfer > 0 && hasCapacity.length > 0) {
        const toHosp = hasCapacity[0];
        
        suggestions.push({
          id: `redist-${fromHosp.id}-${toHosp.id}-${Date.now()}`,
          fromHospitalId: fromHosp.id,
          fromHospitalName: fromHosp.name,
          toHospitalId: toHosp.id,
          toHospitalName: toHosp.name,
          patientsToTransfer,
          estimatedTime: Math.round(toHosp.location.distance * 2.5 + 15),
          priority: fromHosp.capacity.percentage > 95 ? 'critical' : 
                   fromHosp.capacity.percentage > 90 ? 'high' : 'medium',
          reason: `${fromHosp.name} tiene ${fromHosp.capacity.percentage}% de ocupación y ${fromHosp.emergency.waiting} pacientes en espera`,
          status: 'pending',
          createdAt: new Date()
        });
      }
    });
    
    return suggestions;
  }, []);

  const detectStaffShortagesByHospital = useCallback((hospitals: any[]): StaffShortage[] => {
    const shortages: StaffShortage[] = [];
    
    hospitals.forEach(hospital => {
      // Detectar déficit de doctores
      if (hospital.staff.doctors < hospital.staff.required.doctors) {
        const shortage = hospital.staff.required.doctors - hospital.staff.doctors;
        shortages.push({
          id: `shortage-${hospital.id}-doctors-${Date.now()}`,
          hospitalId: hospital.id,
          hospitalName: hospital.name,
          specialty: 'Médico General',
          currentStaff: hospital.staff.doctors,
          requiredStaff: hospital.staff.required.doctors,
          shortage,
          severity: shortage > 5 ? 'critical' : shortage > 2 ? 'urgent' : 'moderate',
          impactDescription: `Déficit de ${shortage} médicos puede aumentar tiempos de espera en ${shortage * 15}%`,
          estimatedWaitIncrease: shortage * 15,
          suggestedActions: [
            'Publicar vacantes urgentes en marketplace',
            'Contratar médicos temporales',
            'Redistribuir personal de otros hospitales'
          ],
          autoJobPostingTriggered: false,
          detectedAt: new Date()
        });
      }
      
      // Detectar déficit de enfermeros
      if (hospital.staff.nurses < hospital.staff.required.nurses) {
        const shortage = hospital.staff.required.nurses - hospital.staff.nurses;
        shortages.push({
          id: `shortage-${hospital.id}-nurses-${Date.now()}`,
          hospitalId: hospital.id,
          hospitalName: hospital.name,
          specialty: 'Enfermería',
          currentStaff: hospital.staff.nurses,
          requiredStaff: hospital.staff.required.nurses,
          shortage,
          severity: shortage > 10 ? 'critical' : shortage > 5 ? 'urgent' : 'moderate',
          impactDescription: `Déficit de ${shortage} enfermeros puede reducir capacidad de atención en ${shortage * 8}%`,
          estimatedWaitIncrease: shortage * 8,
          suggestedActions: [
            'Contratar enfermeros temporales',
            'Publicar múltiples vacantes',
            'Activar protocolo de horas extras'
          ],
          autoJobPostingTriggered: false,
          detectedAt: new Date()
        });
      }
    });
    
    return shortages;
  }, []);

  const executeRedistribution = useCallback(async (suggestionId: string) => {
    setActiveRedistributions(prev => new Set([...prev, suggestionId]));
    
    const suggestion = redistributionSuggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    setRedistributionSuggestions(prev => 
      prev.map(s => s.id === suggestionId ? { ...s, status: 'executing' as const } : s)
    );

    try {
      // 🔔 INTEGRATED: Notify hospitals and staff about redistribution
      await notificationSystem.sendRedistributionAlert({
        redistributionId: suggestionId,
        fromHospital: {
          id: suggestion.fromHospitalId,
          name: suggestion.fromHospitalName
        },
        toHospital: {
          id: suggestion.toHospitalId,
          name: suggestion.toHospitalName
        },
        patientsCount: suggestion.patientsToTransfer,
        estimatedTime: suggestion.estimatedTime,
        priority: suggestion.priority,
        recipients: ['hospital_staff', 'emergency_coordinators', 'transport_teams'],
        channels: ['push', 'sms', 'radio'],
        urgency: suggestion.priority === 'critical' ? 'immediate' : 'high'
      });

      // Simulate redistribution execution
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setRedistributionSuggestions(prev => 
        prev.map(s => s.id === suggestionId ? { ...s, status: 'completed' as const } : s)
      );

      // 🔔 INTEGRATED: Notify completion
      await notificationSystem.sendRedistributionCompletionAlert({
        redistributionId: suggestionId,
        status: 'completed',
        completedAt: new Date(),
        recipients: ['hospital_admins', 'emergency_coordinators'],
        channels: ['push', 'email']
      });

      console.log(`✅ Redistribution ${suggestionId} completed and notifications sent`);
      
    } catch (error) {
      console.error('❌ Failed to execute redistribution:', error);
      setRedistributionSuggestions(prev => 
        prev.map(s => s.id === suggestionId ? { ...s, status: 'failed' as const } : s)
      );

      // 🔔 INTEGRATED: Notify failure
      await notificationSystem.sendRedistributionErrorAlert({
        redistributionId: suggestionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        recipients: ['emergency_coordinators', 'system_admins'],
        channels: ['push', 'email', 'sms']
      });
    } finally {
      setActiveRedistributions(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestionId);
        return newSet;
      });
    }
  }, [redistributionSuggestions, notificationSystem]);

  const checkCompletedRedistributions = useCallback(() => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    setRedistributionSuggestions(prev => 
      prev.filter(s => 
        s.status !== 'completed' || s.createdAt > fiveMinutesAgo
      )
    );
  }, []);

  const evaluateRedistributionNeeds = useCallback((hospitalMetrics: any) => {
    if (hospitalMetrics.occupancy.beds.percentage > 90 && hospitalMetrics.occupancy.emergency.waiting > 10) {
      const existingSuggestion = redistributionSuggestions.find(
        s => s.fromHospitalId === hospitalMetrics.hospitalId && s.status === 'pending'
      );
      
      if (!existingSuggestion) {
        console.log('Nueva redistribución necesaria para:', hospitalMetrics.hospitalId);
      }
    }
  }, [redistributionSuggestions]);

  return {
    // State
    redistributionSuggestions,
    staffShortages,
    activeRedistributions,
    autoRedistributionEnabled,
    autoJobPostingEnabled,
    
    // Setters
    setRedistributionSuggestions,
    setStaffShortages,
    setAutoRedistributionEnabled,
    setAutoJobPostingEnabled,
    
    // Actions
    generateRedistributionSuggestions,
    detectStaffShortagesByHospital,
    executeRedistribution,
    checkCompletedRedistributions,
    evaluateRedistributionNeeds,
  };
};