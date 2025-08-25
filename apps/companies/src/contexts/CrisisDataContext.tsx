'use client';

import { QueryProvider, apiClient } from '@altamedica/api-client';
import { services } from '@altamedica/api-client';

import type { LatLngTuple } from 'leaflet';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { HospitalDataIntegrationService, type HospitalMetrics } from '../services';

// Tipos compatibles con el mapa de redistribución
export type MapHospital = {
  id: string;
  name: string;
  location: {
    city: string;
    country: string;
    coordinates: LatLngTuple;
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
};

export type RedistributionRoute = {
  id: string;
  fromHospital: MapHospital;
  toHospital: MapHospital;
  patientsToTransfer: number;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedTime: number;
  progress?: number;
};

export type StaffShortage = {
  hospitalId: string;
  hospitalName: string;
  role: string;
  shortage: number;
  severity: 'critical' | 'urgent' | 'moderate';
  autoJobPostingTriggered: boolean;
};

export type CrisisNetworkStats = {
  activeUsers: number;
  alerts: number;
  systemLoad: number; // porcentaje 0-100
  networkConnected: boolean;
};

export type CrisisHospitalSeed = {
  id: string;
  name: string;
  city: string;
  country: string;
  coordinates: LatLngTuple;
};

type CrisisDataContextValue = {
  hospitals: MapHospital[];
  routes: RedistributionRoute[];
  staffShortages: StaffShortage[];
  networkStats: CrisisNetworkStats;
  loading: boolean;
  refresh: () => Promise<void>;
};

const CrisisDataContext = createContext<CrisisDataContextValue | undefined>(undefined);

export type CrisisDataProviderProps = {
  children: React.ReactNode;
  hospitalSeeds?: CrisisHospitalSeed[];
  refreshIntervalMs?: number;
  // Si true, no llama servicios externos y genera datos simulados
  useMock?: boolean;
};

// Semillas por defecto (coinciden con el mock visual actual)
const DEFAULT_SEEDS: CrisisHospitalSeed[] = [
  {
    id: 'h1',
    name: 'Hospital Central',
    city: 'Centro',
    country: 'AR',
    coordinates: [-34.6037, -58.3816],
  },
  {
    id: 'h2',
    name: 'Clínica Norte',
    city: 'Zona Norte',
    country: 'AR',
    coordinates: [-34.55, -58.45],
  },
  { id: 'h3', name: 'Hospital Sur', city: 'Zona Sur', country: 'AR', coordinates: [-34.7, -58.4] },
  {
    id: 'h4',
    name: 'Centro Médico Este',
    city: 'Zona Este',
    country: 'AR',
    coordinates: [-34.6, -58.25],
  },
  {
    id: 'h5',
    name: 'Hospital Universitario',
    city: 'Universidad',
    country: 'AR',
    coordinates: [-34.6, -58.5],
  },
  {
    id: 'h6',
    name: 'Clínica Oeste',
    city: 'Zona Oeste',
    country: 'AR',
    coordinates: [-34.62, -58.6],
  },
];

export function CrisisDataProvider({
  children,
  hospitalSeeds = DEFAULT_SEEDS,
  refreshIntervalMs = 30000,
  useMock = true,
}: CrisisDataProviderProps) {
  const [hospitals, setHospitals] = useState<MapHospital[]>([]);
  const [routes, setRoutes] = useState<RedistributionRoute[]>([]);
  const [staffShortages, setStaffShortages] = useState<StaffShortage[]>([]);
  const [networkStats, setNetworkStats] = useState<CrisisNetworkStats>({
    activeUsers: 0,
    alerts: 0,
    systemLoad: 0,
    networkConnected: true,
  });
  const [loading, setLoading] = useState(true);

  const serviceRef = useRef<HospitalDataIntegrationService | null>(null);

  // Lazy init service con config segura por defecto
  if (!serviceRef.current) {
    serviceRef.current = new HospitalDataIntegrationService({
      whatsapp: { enabled: false, phoneNumber: '', apiKey: '' },
      api: { enabled: false, endpoint: '', apiKey: '' },
      iot: { enabled: false, devices: [] },
    });
  }

  const toMapHospital = useCallback(
    (seed: CrisisHospitalSeed, metrics: HospitalMetrics): MapHospital => {
      const percentage = metrics.occupancy.beds.percentage || 0;
      const status: MapHospital['status'] =
        percentage > 95
          ? 'saturated'
          : percentage > 85
            ? 'critical'
            : percentage > 75
              ? 'warning'
              : 'normal';
      return {
        id: seed.id,
        name: seed.name,
        location: {
          city: seed.city,
          country: seed.country,
          coordinates: seed.coordinates,
        },
        currentCapacity: metrics.occupancy.beds.occupied,
        maxCapacity: metrics.occupancy.beds.total,
        criticalStaff: {
          doctors: Math.max(10, Math.round((metrics.staff.active || 40) * 0.4)),
          nurses: Math.max(20, Math.round((metrics.staff.active || 40) * 0.6)),
          specialists: Math.max(3, Math.round((metrics.staff.active || 40) * 0.15)),
          requiredDoctors: Math.max(12, Math.round((metrics.staff.total || 50) * 0.45)),
          requiredNurses: Math.max(25, Math.round((metrics.staff.total || 50) * 0.65)),
          requiredSpecialists: Math.max(5, 7),
        },
        status,
        waitingPatients: metrics.occupancy.emergency.waiting,
        emergencyPatients: metrics.occupancy.emergency.critical,
        lastUpdated: new Date(),
      };
    },
    [],
  );

  const buildMockMetrics = useCallback((seed: CrisisHospitalSeed): HospitalMetrics => {
    const occ = Math.floor(60 + Math.random() * 50);
    const totalBeds = seed.id === 'h1' || seed.id === 'h5' ? 400 : 200;
    const occupied = Math.min(totalBeds, Math.round((occ / 100) * totalBeds));
    const waiting = Math.max(0, Math.round((occ - 70) * 0.8));
    const critical = Math.max(0, Math.round(waiting * 0.2));
    return {
      hospitalId: seed.id,
      timestamp: new Date(),
      occupancy: {
        beds: {
          total: totalBeds,
          occupied,
          available: Math.max(0, totalBeds - occupied),
          percentage: Math.min(100, occ),
        },
        emergency: { waiting, averageWaitTime: Math.max(5, Math.round(occ)), critical },
        specialties: [],
      },
      staff: { total: 80, active: Math.round(60 + Math.random() * 20), bySpecialty: new Map() },
      dataQuality: { source: 'default' as any, confidence: 70, lastUpdate: new Date() },
    };
  }, []);

  const computeRoutes = useCallback((h: MapHospital[]): RedistributionRoute[] => {
    const overs = h.filter((x) => x.currentCapacity / Math.max(1, x.maxCapacity) > 0.9);
    const capacity = h.filter((x) => x.currentCapacity / Math.max(1, x.maxCapacity) < 0.75);
    const out: RedistributionRoute[] = [];
    overs.forEach((from, idx) => {
      const to = capacity[idx % Math.max(1, capacity.length)];
      if (!to) return;
      out.push({
        id: `${from.id}-${to.id}`,
        fromHospital: from,
        toHospital: to,
        patientsToTransfer: Math.max(
          3,
          Math.round((from.currentCapacity - from.maxCapacity * 0.85) * 0.2),
        ),
        status: Math.random() > 0.7 ? 'executing' : 'pending',
        priority: 'high',
        estimatedTime: Math.round(10 + Math.random() * 40),
        progress: Math.random() > 0.5 ? Math.round(Math.random() * 80) : undefined,
      });
    });
    return out;
  }, []);

  const computeShortages = useCallback((h: MapHospital[]): StaffShortage[] => {
    const shortages: StaffShortage[] = [];
    h.forEach((hos) => {
      const needNurses = hos.criticalStaff.requiredNurses - hos.criticalStaff.nurses;
      const needDocs = hos.criticalStaff.requiredDoctors - hos.criticalStaff.doctors;
      if (needNurses > 0)
        shortages.push({
          hospitalId: hos.id,
          hospitalName: hos.name,
          role: 'Enfermería',
          shortage: needNurses,
          severity: needNurses > 10 ? 'critical' : 'urgent',
          autoJobPostingTriggered: needNurses > 5,
        });
      if (needDocs > 0)
        shortages.push({
          hospitalId: hos.id,
          hospitalName: hos.name,
          role: 'Médicos',
          shortage: needDocs,
          severity: needDocs > 5 ? 'urgent' : 'moderate',
          autoJobPostingTriggered: needDocs > 3,
        });
    });
    return shortages;
  }, []);

  // Estabilizar referencias para evitar recrear refresh en cada render
  const seedsRef = useRef(hospitalSeeds);
  const useMockRef = useRef(useMock);
  const refreshIntervalRef = useRef(refreshIntervalMs);
  useEffect(() => {
    seedsRef.current = hospitalSeeds;
  }, [hospitalSeeds]);
  useEffect(() => {
    useMockRef.current = useMock;
  }, [useMock]);
  useEffect(() => {
    refreshIntervalRef.current = refreshIntervalMs;
  }, [refreshIntervalMs]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const svc = serviceRef.current!;
      const metricsList: HospitalMetrics[] = [];
      const seeds = seedsRef.current;
      const mock = useMockRef.current;
      for (const seed of seeds) {
        if (mock) {
          metricsList.push(buildMockMetrics(seed));
        } else {
          try {
            const m = await svc.collectHospitalData(seed.id);
            metricsList.push(m as HospitalMetrics);
          } catch (e) {
            // fallback a mock si falla
            metricsList.push(buildMockMetrics(seed));
          }
        }
      }

      const mapped = seeds.map((seed, idx) => toMapHospital(seed, metricsList[idx]!));
      setHospitals(mapped);
      setRoutes(computeRoutes(mapped));
      setStaffShortages(computeShortages(mapped));
      setNetworkStats({
        activeUsers: Math.round(20 + Math.random() * 30),
        alerts: Math.round(
          mapped.filter((h) => h.status === 'critical' || h.status === 'saturated').length * 2 +
            Math.random() * 5,
        ),
        systemLoad: Math.round(50 + Math.random() * 40),
        networkConnected: true,
      });
    } finally {
      setLoading(false);
    }
  }, [buildMockMetrics, computeRoutes, computeShortages, toMapHospital]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await refresh();
    })();
    const id = setInterval(() => {
      // usar el callback estable sin cerrar sobre props mutables
      refresh();
    }, refreshIntervalRef.current);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [refresh]);

  const value = useMemo<CrisisDataContextValue>(
    () => ({ hospitals, routes, staffShortages, networkStats, loading, refresh }),
    [hospitals, routes, staffShortages, networkStats, loading, refresh],
  );

  return <CrisisDataContext.Provider value={value}>{children}</CrisisDataContext.Provider>;
}

export function useCrisisData() {
  const ctx = useContext(CrisisDataContext);
  if (!ctx) throw new Error('useCrisisData debe usarse dentro de CrisisDataProvider');
  return ctx;
}
