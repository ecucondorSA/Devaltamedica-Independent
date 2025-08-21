'use client';

import { Button, Card, Input } from '@altamedica/ui';
import { useCrisisData } from '@/contexts/CrisisDataContext';
import dynamic from 'next/dynamic';

const HospitalRedistributionMap = dynamic(() => import('../dashboard/HospitalRedistributionMap').then(m => m.default), { ssr: false });

interface CrisisMapPanelProps {
  emergencyMode?: boolean;
}

export function CrisisMapPanel({ emergencyMode = false }: CrisisMapPanelProps) {
  const { hospitals, routes, staffShortages, loading } = useCrisisData();

  if (loading) {
    return (
      <div className="h-[500px] w-full grid place-items-center border border-gray-200 rounded-lg bg-vscode-editor">
        <div className="text-sm text-vscode-foreground">Cargando datos de red…</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden h-full min-h-[360px]">
      <HospitalRedistributionMap
        hospitals={hospitals as any}
        redistributionRoutes={routes as any}
        staffShortages={staffShortages as any}
        showRedistributionRoutes
        showStaffShortages
        emergencyMode={emergencyMode}
        autoRefresh={true}
        heightClass="h-full"
      />
    </div>
  );
}
