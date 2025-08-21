/**
 * Custom Hook: Network Status Logic
 * Extracted from HospitalNetworkDashboard.tsx for better separation of concerns
 */

import { useState, useCallback, useEffect } from 'react';

export interface MapHospital {
  id: string;
  name: string;
  location: {
    city: string;
    country: string;
    coordinates: [number, number];
  };
  currentCapacity: number;
  maxCapacity: number;
  criticalStaff: {
    doctors: number;
    nurses: number;
    specialists: number;
    requiredDoctors: number;
    requiredNurses: number;
    requiredSpecialists: number;
  };
  status: 'normal' | 'warning' | 'critical' | 'saturated';
  waitingPatients: number;
  emergencyPatients: number;
  lastUpdated: Date;
}

export interface NetworkMetrics {
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
  criticalPatients: number;
  emergencyWaiting: number;
  totalStaff: {
    doctors: number;
    nurses: number;
    specialists: number;
  };
  requiredStaff: {
    doctors: number;
    nurses: number;
    specialists: number;
  };
  staffDeficit: {
    doctors: number;
    nurses: number;
    specialists: number;
  };
}

export const useNetworkStatusLogic = () => {
  const [mapHospitals, setMapHospitals] = useState<MapHospital[]>([]);
  const [networkMetrics, setNetworkMetrics] = useState<NetworkMetrics | null>(null);

  const loadNetworkData = useCallback(async () => {
    const mockHospitals = [
      {
        id: 'hosp-1',
        name: 'Hospital Central',
        capacity: { current: 285, max: 300, percentage: 95 },
        emergency: { waiting: 15, critical: 3 },
        staff: { doctors: 12, nurses: 45, required: { doctors: 15, nurses: 50 } },
        location: { 
          distance: 0,
          city: 'Buenos Aires',
          country: 'Argentina',
          coordinates: [-34.6037, -58.3816] as [number, number]
        }
      },
      {
        id: 'hosp-2', 
        name: 'Hospital Norte',
        capacity: { current: 180, max: 250, percentage: 72 },
        emergency: { waiting: 5, critical: 1 },
        staff: { doctors: 20, nurses: 35, required: { doctors: 18, nurses: 40 } },
        location: { 
          distance: 15,
          city: 'San Miguel',
          country: 'Argentina',
          coordinates: [-34.5420, -58.7120] as [number, number]
        }
      },
      {
        id: 'hosp-3',
        name: 'Hospital Sul',
        capacity: { current: 220, max: 280, percentage: 79 },
        emergency: { waiting: 8, critical: 2 },
        staff: { doctors: 8, nurses: 25, required: { doctors: 16, nurses: 35 } },
        location: { 
          distance: 22,
          city: 'La Plata',
          country: 'Argentina',
          coordinates: [-34.9214, -57.9544] as [number, number]
        }
      }
    ];

    const mapFormattedHospitals: MapHospital[] = mockHospitals.map(hospital => ({
      id: hospital.id,
      name: hospital.name,
      location: {
        city: hospital.location.city,
        country: hospital.location.country,
        coordinates: hospital.location.coordinates as [number, number]
      },
      currentCapacity: hospital.capacity.current,
      maxCapacity: hospital.capacity.max,
      criticalStaff: {
        doctors: hospital.staff.doctors,
        nurses: hospital.staff.nurses,
        specialists: Math.floor(Math.random() * 5) + 3,
        requiredDoctors: hospital.staff.required.doctors,
        requiredNurses: hospital.staff.required.nurses,
        requiredSpecialists: Math.floor(Math.random() * 3) + 7
      },
      status: hospital.capacity.percentage > 95 ? 'saturated' :
              hospital.capacity.percentage > 85 ? 'critical' :
              hospital.capacity.percentage > 75 ? 'warning' : 'normal',
      waitingPatients: hospital.emergency.waiting,
      emergencyPatients: hospital.emergency.critical,
      lastUpdated: new Date()
    }));

    setMapHospitals(mapFormattedHospitals);

    const metrics: NetworkMetrics = {
      totalBeds: mockHospitals.reduce((sum, h) => sum + h.capacity.max, 0),
      occupiedBeds: mockHospitals.reduce((sum, h) => sum + h.capacity.current, 0),
      availableBeds: mockHospitals.reduce((sum, h) => sum + (h.capacity.max - h.capacity.current), 0),
      occupancyRate: Math.round((mockHospitals.reduce((sum, h) => sum + h.capacity.current, 0) / 
                               mockHospitals.reduce((sum, h) => sum + h.capacity.max, 0)) * 100),
      criticalPatients: mockHospitals.reduce((sum, h) => sum + h.emergency.critical, 0),
      emergencyWaiting: mockHospitals.reduce((sum, h) => sum + h.emergency.waiting, 0),
      totalStaff: {
        doctors: mockHospitals.reduce((sum, h) => sum + h.staff.doctors, 0),
        nurses: mockHospitals.reduce((sum, h) => sum + h.staff.nurses, 0),
        specialists: mockHospitals.reduce((sum, h) => sum + Math.floor(Math.random() * 5) + 3, 0)
      },
      requiredStaff: {
        doctors: mockHospitals.reduce((sum, h) => sum + h.staff.required.doctors, 0),
        nurses: mockHospitals.reduce((sum, h) => sum + h.staff.required.nurses, 0),
        specialists: mockHospitals.reduce((sum, h) => sum + Math.floor(Math.random() * 3) + 7, 0)
      },
      staffDeficit: {
        doctors: mockHospitals.reduce((sum, h) => sum + Math.max(0, h.staff.required.doctors - h.staff.doctors), 0),
        nurses: mockHospitals.reduce((sum, h) => sum + Math.max(0, h.staff.required.nurses - h.staff.nurses), 0),
        specialists: mockHospitals.reduce((sum, h) => sum + Math.max(0, Math.floor(Math.random() * 3) + 7 - Math.floor(Math.random() * 5) + 3), 0)
      }
    };

    setNetworkMetrics(metrics);
  }, []);

  const getNetworkStatus = useCallback(() => {
    if (!networkMetrics) return { healthy: 0, warning: 0, critical: 0, total: 0 };
    
    const healthy = mapHospitals.filter(h => h.status === 'normal').length;
    const warning = mapHospitals.filter(h => h.status === 'warning').length;
    const critical = mapHospitals.filter(h => h.status === 'critical' || h.status === 'saturated').length;
    
    return {
      healthy,
      warning,
      critical,
      total: mapHospitals.length
    };
  }, [mapHospitals, networkMetrics]);

  return {
    // State
    mapHospitals,
    networkMetrics,
    
    // Setters
    setMapHospitals,
    setNetworkMetrics,
    
    // Actions
    loadNetworkData,
    getNetworkStatus,
  };
};