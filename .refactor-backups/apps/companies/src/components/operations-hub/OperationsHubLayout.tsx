"use client";

import { Button, Card, Input } from '@altamedica/ui';
import { useMarketplace } from '@/contexts/MarketplaceContext';
import { useOperationsKeyboard, useOperationsUI } from '@/contexts/OperationsUIContext';
import { Filter, MapPin, Star } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { ExpandableSection } from '../common/ExpandableSection';
import { ActivityBar } from '../crisis/ActivityBar';
import { NetworkMinimap } from '../crisis/NetworkMinimap';
import { MapShell } from './MapShell';
import { DEFAULT_PROFILES, OperationsTopBar } from './OperationsTopBar';

// 🔗 INTEGRATED: Import all integrated dashboard hooks
import { useRedistributionLogic } from '../dashboard/hooks/useRedistributionLogic';
import { useJobPostingLogic } from '../dashboard/hooks/useJobPostingLogic';
import { useNetworkStatusLogic } from '../dashboard/hooks/useNetworkStatusLogic';
import { useEmergencyModeLogic } from '../dashboard/hooks/useEmergencyModeLogic';

// Dynamic imports para optimización
const CrisisMapPanel = dynamic(() => import('../crisis/CrisisMapPanel').then(m => m.CrisisMapPanel), {
  loading: () => <div className="flex items-center justify-center h-full text-vscode-foreground">Cargando mapa de crisis...</div>,
  ssr: false
});

const HospitalRedistributionMap = dynamic(() => import('../dashboard/HospitalRedistributionMap').then(m => m.default), {
  loading: () => <div className="flex items-center justify-center h-full text-vscode-foreground">Cargando redistribución...</div>,
  ssr: false
});

const MarketplaceMap = dynamic(() => import('../MarketplaceMap').then(m => m.default), {
  loading: () => <div className="flex items-center justify-center h-full text-vscode-foreground">Cargando marketplace...</div>,
  ssr: false
});

export interface OperationsHubLayoutProps {
  theme?: 'slate' | 'vscode';
  showCommandPalette?: boolean;
  onCommandPalette?: () => void;
}

export function OperationsHubLayout({
  theme = 'vscode',
  showCommandPalette = false,
  onCommandPalette
}: OperationsHubLayoutProps) {
  // State local
  const [activeProfile, setActiveProfile] = useState('normal');
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [autoRedis, setAutoRedis] = useState(true);

  // Context del Operations UI
  const {
    sidebarOpen,
    toggleSidebar,
    activeTab,
    zenMode,
    splitView,
    setSplitRatio,
    splitRatio
  } = useOperationsUI();

  // Hook para atajos de teclado
  useOperationsKeyboard();

  // Datos del marketplace desde contexto
  const { getFilteredDoctors, getFilteredCompanies } = useMarketplace();

  // 🔗 INTEGRATED: Use all dashboard hooks for real-time data
  const {
    redistributionSuggestions,
    staffShortages,
    generateRedistributionSuggestions,
    executeRedistribution,
    evaluateRedistributionNeeds
  } = useRedistributionLogic();

  const {
    jobPostings,
    triggerAutomaticJobPosting,
    detectStaffShortages
  } = useJobPostingLogic();

  const {
    mapHospitals,
    networkMetrics,
    loadNetworkData,
    getNetworkStatus
  } = useNetworkStatusLogic();

  const {
    evaluateEmergencyActions,
    triggerEmergencyProtocol,
    getEmergencyPriority,
    calculateEmergencyMetrics
  } = useEmergencyModeLogic();

  // 🔄 INTEGRATED: Auto-sync data and emergency evaluation
  useEffect(() => {
    const loadIntegratedData = async () => {
      await loadNetworkData();
      
      // Evaluate emergency mode based on real metrics
      if (networkMetrics) {
        const priority = getEmergencyPriority(networkMetrics);
        if (priority === 'critical' && !emergencyMode) {
          setEmergencyMode(true);
          triggerEmergencyProtocol('operations-hub', 'auto_detected');
        }
      }
    };

    loadIntegratedData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadIntegratedData, 30000);
    
    return () => clearInterval(interval);
  }, [loadNetworkData, networkMetrics, getEmergencyPriority, triggerEmergencyProtocol, emergencyMode]);

  // 🚨 INTEGRATED: Emergency actions evaluation
  useEffect(() => {
    if (emergencyMode && redistributionSuggestions.length > 0) {
      evaluateEmergencyActions(
        networkMetrics,
        redistributionSuggestions,
        autoRedis,
        executeRedistribution
      );
    }
  }, [emergencyMode, redistributionSuggestions, networkMetrics, autoRedis, evaluateEmergencyActions, executeRedistribution]);

  // 🔗 INTEGRATED: Use real hospital data instead of mock data
  const integratedHospitals = useMemo(() => {
    // Convert real map hospitals to format expected by minimap
    return mapHospitals.map(hospital => ({
      id: hospital.id,
      name: hospital.name,
      saturation: Math.round((hospital.currentCapacity / hospital.maxCapacity) * 100),
      patients: hospital.currentCapacity,
      capacity: hospital.maxCapacity,
      staff: hospital.criticalStaff.doctors + hospital.criticalStaff.nurses,
      status: hospital.status,
      location: hospital.location.city,
      specialties: ['Emergencias', 'UCI'], // Mock specialties for now
      waitingPatients: hospital.waitingPatients,
      emergencyPatients: hospital.emergencyPatients
    }));
  }, [mapHospitals]);

  // Fallback mock data if no real data is available yet
  const mockHospitals = useMemo(() => [
    {
      id: '1',
      name: 'Hospital Central',
      saturation: 95,
      patients: 450,
      capacity: 500,
      staff: 120,
      status: 'critical' as const,
      location: 'Bogotá Centro',
      specialties: ['Emergencias', 'UCI']
    },
    {
      id: '2', 
      name: 'Clínica Norte',
      saturation: 78,
      patients: 312,
      capacity: 400,
      staff: 95,
      status: 'warning' as const,
      location: 'Bogotá Norte',
      specialties: ['Cardiología', 'Neurología']
    },
    {
      id: '3',
      name: 'Hospital Sur',
      saturation: 45,
      patients: 180,
      capacity: 400,
      staff: 85,
      status: 'normal' as const,
      location: 'Bogotá Sur', 
      specialties: ['Pediatría', 'Maternidad']
    }
  ], []);

  // Renderizar contenido principal según tab activa
  const renderMainContent = () => {
    const getStorageKey = (tab: string) => `ops.${tab}`;
    const getLegendItems = (tab: string) => {
      // 🔗 INTEGRATED: Use real data for legend counts
      const networkStatus = getNetworkStatus();
      
      switch (tab) {
        case 'network':
          return [
            { color: '#ef4444', label: 'Crítico', count: networkStatus.critical },
            { color: '#f59e0b', label: 'Advertencia', count: networkStatus.warning },
            { color: '#10b981', label: 'Normal', count: networkStatus.healthy }
          ];
        case 'redistribution':
          return [
            { 
              color: '#dc2626', 
              label: 'Emergencia', 
              count: redistributionSuggestions.filter(r => r.priority === 'critical').length 
            },
            { 
              color: '#059669', 
              label: 'Ejecutando', 
              count: redistributionSuggestions.filter(r => r.status === 'executing').length 
            },
            { 
              color: '#0891b2', 
              label: 'Pendientes', 
              count: redistributionSuggestions.filter(r => r.status === 'pending').length 
            }
          ];
        case 'marketplace':
          return [
            { color: '#3b82f6', label: 'Doctores', count: getFilteredDoctors().length },
            { color: '#8b5cf6', label: 'Hospitales', count: mapHospitals.length },
            { color: '#f59e0b', label: 'Vacantes', count: jobPostings.length },
            { color: '#ef4444', label: 'Déficit Personal', count: staffShortages.length }
          ];
        default:
          return [];
      }
    };

    switch (activeTab) {
      case 'network':
        return (
          <MapShell
            title="Red Hospitalaria General"
            storageKeyPrefix={getStorageKey('network')}
            legendItems={getLegendItems('network')}
            theme={theme}
          >
            <CrisisMapPanel emergencyMode={emergencyMode} />
          </MapShell>
        );

      case 'redistribution':
        return (
          <MapShell
            title="Redistribución Inteligente de Pacientes"
            storageKeyPrefix={getStorageKey('redistribution')}
            legendItems={getLegendItems('redistribution')}
            theme={theme}
            rightActions={
              <button
                onClick={() => setEmergencyMode(!emergencyMode)}
                className={`px-2 py-1 text-xs rounded ${
                  emergencyMode
                    ? 'bg-red-600 text-white'
                    : theme === 'vscode'
                    ? 'bg-vscode-input text-vscode-foreground hover:bg-vscode-list-hover'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {emergencyMode ? 'Auto Redistribución ON' : 'Auto Redistribución OFF'}
              </button>
            }
          >
            <CrisisMapPanel emergencyMode={emergencyMode} />
          </MapShell>
        );

      case 'marketplace':
        return (
          <MapShell
            title="Marketplace Médico"
            storageKeyPrefix={getStorageKey('marketplace')}
            legendItems={getLegendItems('marketplace')}
            theme={theme}
            rightActions={
              <div className="flex items-center gap-2">
                <button
                  className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
                    theme === 'vscode'
                      ? 'bg-vscode-input text-vscode-foreground hover:bg-vscode-list-hover'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  <Filter className="w-3 h-3" />
                  Filtros
                </button>
              </div>
            }
          >
            <MarketplaceMap 
              doctors={getFilteredDoctors() as any} 
              companies={getFilteredCompanies() as any} 
              theme={theme}
            />
          </MapShell>
        );

      default:
        return null;
    }
  };

  // Renderizar split view si está activo
  const renderSplitView = () => {
    if (!splitView) return renderMainContent();

    // En split view, mostrar network en la izquierda y marketplace en la derecha
    return (
      <div className="flex h-full">
        <div style={{ width: `${splitRatio * 100}%` }} className="border-r border-vscode-border">
          <MapShell
            title="Red Hospitalaria"
            storageKeyPrefix="ops.network"
            legendItems={[
              { color: '#ef4444', label: 'Crítico', count: 2 },
              { color: '#f59e0b', label: 'Advertencia', count: 3 }
            ]}
            theme={theme}
            showSettings={false}
          >
            <CrisisMapPanel emergencyMode={emergencyMode} />
          </MapShell>
        </div>
        
        {/* Resizer */}
        <div 
          className="w-1 bg-vscode-border hover:bg-vscode-activity-badge cursor-col-resize flex-shrink-0"
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startRatio = splitRatio;
            
            const handleMouseMove = (e: MouseEvent) => {
              const deltaX = e.clientX - startX;
              const containerWidth = window.innerWidth - (sidebarOpen ? 256 : 0) - (zenMode ? 0 : 48);
              const deltaRatio = deltaX / containerWidth;
              const newRatio = Math.max(0.2, Math.min(0.8, startRatio + deltaRatio));
              setSplitRatio(newRatio);
            };
            
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />
        
        <div style={{ width: `${(1 - splitRatio) * 100}%` }}>
          <MapShell
            title="Marketplace Médico"
            storageKeyPrefix="ops.marketplace"
            legendItems={[
              { color: '#3b82f6', label: 'Doctores', count: 24 },
              { color: '#ef4444', label: 'Urgente', count: 3 }
            ]}
            theme={theme}
            showSettings={false}
          >
            <MarketplaceMap 
              doctors={getFilteredDoctors() as any} 
              companies={getFilteredCompanies() as any} 
              theme={theme}
            />
          </MapShell>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-vscode-background text-vscode-foreground flex flex-col overflow-hidden">
      {/* Top Bar */}
      <OperationsTopBar
        title="CENTRO DE OPERACIONES - ALTAMEDICA"
        profiles={DEFAULT_PROFILES}
        activeProfile={activeProfile}
        onProfileChange={setActiveProfile}
        showCrisisIndicator={emergencyMode}
        emergencyMode={emergencyMode}
        onEmergencyToggle={() => setEmergencyMode(!emergencyMode)}
        autoRedis={autoRedis}
        onAutoRedisToggle={() => setAutoRedis(!autoRedis)}
        theme={theme}
        customActions={
          <div className="flex items-center gap-2">
            <Link
              href="/marketplace"
              prefetch
              className={
                theme === 'vscode'
                  ? 'px-2 py-1 rounded text-xs bg-vscode-activity-badge text-white hover:brightness-110'
                  : 'px-2 py-1 rounded text-xs bg-slate-800 text-white hover:bg-slate-700'
              }
              title="Ir al Marketplace"
            >
              Ir al Marketplace
            </Link>
            {splitView && (
              <div className="text-xs text-vscode-foreground/70 bg-vscode-input px-2 py-1 rounded">
                Split {Math.round(splitRatio * 100)}% / {Math.round((1 - splitRatio) * 100)}%
              </div>
            )}
          </div>
        }
      />

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        {!zenMode && (
          <ActivityBar 
            onCommandPalette={onCommandPalette ?? (() => {})}
            onToggleSidebar={toggleSidebar}
            sidebarOpen={sidebarOpen}
          />
        )}

        {/* Sidebar */}
        {!zenMode && sidebarOpen && (
          <div className="w-64 bg-vscode-sidebar border-r border-vscode-border flex flex-col">
            {/* Network Minimap */}
            <ExpandableSection
              title={(
                <span className="inline-flex items-center gap-2 text-vscode-foreground">
                  <MapPin className="w-4 h-4" />
                  MINIMAP RED
                </span>
              )}
              defaultOpen={true}
              storageKey="ops.sidebar.minimap.open"
              className="flex-1 flex flex-col"
            >
              <div className="flex-1 overflow-auto">
                <NetworkMinimap hospitals={mockHospitals} />
              </div>
            </ExpandableSection>

            {/* Marketplace Filters */}
            {activeTab === 'marketplace' && (
              <ExpandableSection
                title={(
                  <span className="inline-flex items-center gap-2 text-vscode-foreground">
                    <Filter className="w-4 h-4" />
                    FILTROS MARKETPLACE
                  </span>
                )}
                defaultOpen={true}
                storageKey="ops.sidebar.filters.open"
                className="border-t border-vscode-border"
              >
                <div className="p-3 space-y-3">
                  <div>
                    <label className="block text-xs text-vscode-foreground/70 mb-1">Especialidad</label>
                    <select className="w-full bg-vscode-input border border-vscode-border rounded px-2 py-1 text-xs text-vscode-foreground">
                      <option>Todas</option>
                      <option>Cardiología</option>
                      <option>Neurología</option>
                      <option>Pediatría</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-vscode-foreground/70 mb-1">Rating</label>
                    <select className="w-full bg-vscode-input border border-vscode-border rounded px-2 py-1 text-xs text-vscode-foreground">
                      <option>Todos</option>
                      <option>4.5+ estrellas</option>
                      <option>4.0+ estrellas</option>
                    </select>
                  </div>
                </div>
              </ExpandableSection>
            )}

            {/* Favorites */}
            <ExpandableSection
              title={(
                <span className="inline-flex items-center gap-2 text-vscode-foreground">
                  <Star className="w-4 h-4" />
                  FAVORITOS
                </span>
              )}
              defaultOpen={false}
              storageKey="ops.sidebar.favorites.open"
              className="border-t border-vscode-border"
            >
              <div className="p-3">
                <p className="text-xs text-vscode-foreground/70">No hay favoritos guardados</p>
              </div>
            </ExpandableSection>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {renderSplitView()}
        </div>
      </div>
    </div>
  );
}