'use client';

import { Button, Card, Input } from '@altamedica/ui';
import { useCrisisData } from '@/contexts/CrisisDataContext';
import {
    Activity,
    AlertTriangle,
    Ambulance,
    BarChart3,
    Building2,
    Eye,
    MapPin,
    Monitor,
    RotateCw,
    Users,
    Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { ExpandableSection } from '../common/ExpandableSection';
import { ActivityBar } from './ActivityBar';
import { CommandPalette } from './CommandPalette';
import { CrisisMapPanel } from './CrisisMapPanel';
import { CrisisMetrics } from './CrisisMetrics';
import { MainMap } from './MainMap';
import { NetworkMinimap } from './NetworkMinimap';
import { StatusBar } from './StatusBar';

export interface Profile {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const PROFILES: Profile[] = [
  {
    id: 'emergency',
    name: 'Emergencias',
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'bg-vscode-crisis-critical'
  },
  {
    id: 'normal',
    name: 'Normal',
    icon: <Monitor className="w-4 h-4" />,
    color: 'bg-vscode-status-bar'
  },
  {
    id: 'analysis',
    name: 'Análisis',
    icon: <BarChart3 className="w-4 h-4" />,
    color: 'bg-vscode-crisis-info'
  }
];

export function CrisisControlCenter() {
  const [zenMode, setZenMode] = useState(false);
  const [activeProfile, setActiveProfile] = useState<string>('emergency');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [autoRedis, setAutoRedis] = useState(true);
  const [view, setView] = useState<'overview' | 'redistribution'>('overview');
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { hospitals: ctxHospitals, networkStats } = useCrisisData();
  
  const currentProfile = PROFILES.find(p => p.id === activeProfile);

  // Ctrl+B para ocultar/mostrar sidebar, similar a VS Code
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'b')) {
        e.preventDefault();
        setSidebarOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Persistir estado del sidebar
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('crisis.sidebar.open');
      if (stored === 'true' || stored === 'false') {
        setSidebarOpen(stored === 'true');
      }
    } catch {
      // localStorage can throw in sandboxed environments
    }
    // solo al montar
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('crisis.sidebar.open', String(sidebarOpen));
    } catch {
      // localStorage can throw in sandboxed environments
    }
  }, [sidebarOpen]);

  // Avisar a los mapas que el layout cambió (para invalidateSize de Leaflet)
  useEffect(() => {
    const triggerLayoutChange = () => {
      try {
        const evt = new Event('crisis:layout-changed');
        window.dispatchEvent(evt);
      } catch {
        // dispatchEvent can fail in some environments
      }
    };
    // rAF + pequeño delay para post-transiciones
    requestAnimationFrame(() => {
      triggerLayoutChange();
      setTimeout(triggerLayoutChange, 120);
    });
  }, [sidebarOpen, view, zenMode]);

  return (
    <div className="h-screen bg-vscode-background text-vscode-foreground flex flex-col overflow-hidden">
      {/* Header - Centro de Control */}
      <header className="bg-vscode-activity-bar border-b border-vscode-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-vscode-activity-badge" />
            <h1 className="text-lg font-semibold text-white">CENTRO DE CONTROL HOSPITALARIO</h1>
          </div>
          
          {/* Profile Selector */}
          <div className="flex items-center gap-1 ml-6">
            <span className="text-sm text-vscode-foreground mr-2">Perfil:</span>
            {PROFILES.map((profile) => (
              <button
                key={profile.id}
                onClick={() => setActiveProfile(profile.id)}
                className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
                  activeProfile === profile.id 
                    ? `${profile.color} text-white` 
                    : 'bg-vscode-input text-vscode-foreground hover:bg-vscode-list-hover'
                }`}
              >
                {profile.icon}
                {profile.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Crisis Indicator */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-vscode-crisis-critical rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-vscode-crisis-critical">CRISIS ON</span>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-2">
            {/* Vista: Mapa principal vs Redistribución */}
            <div className="hidden md:flex items-center bg-vscode-input rounded">
              <button
                onClick={() => setView('overview')}
                className={`px-3 py-1 text-xs font-medium rounded-l ${view === 'overview' ? 'bg-vscode-activity-badge text-white' : 'text-vscode-foreground hover:bg-vscode-list-hover'}`}
              >
                Mapa General
              </button>
              <button
                onClick={() => setView('redistribution')}
                className={`px-3 py-1 text-xs font-medium rounded-r ${view === 'redistribution' ? 'bg-vscode-activity-badge text-white' : 'text-vscode-foreground hover:bg-vscode-list-hover'}`}
              >
                Redistribución
              </button>
            </div>

            {/* Toggle emergencia */}
            <button
              onClick={() => setEmergencyMode(!emergencyMode)}
              className={`px-3 py-1 rounded text-xs font-medium ${
                emergencyMode ? 'bg-vscode-crisis-critical text-white' : 'bg-vscode-input text-vscode-foreground hover:bg-vscode-list-hover'
              }`}
            >
              {emergencyMode ? 'Emergencia ON' : 'Emergencia OFF'}
            </button>

            <button
              onClick={() => setZenMode(!zenMode)}
              className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                zenMode 
                  ? 'bg-vscode-crisis-warning text-white' 
                  : 'bg-vscode-input text-vscode-foreground hover:bg-vscode-list-hover'
              }`}
            >
              <Eye className="w-3 h-3" />
              Zen Mode
            </button>
            
            <button
              onClick={() => setAutoRedis(!autoRedis)}
              className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                autoRedis 
                  ? 'bg-vscode-crisis-success text-white' 
                  : 'bg-vscode-input text-vscode-foreground hover:bg-vscode-list-hover'
              }`}
            >
              <RotateCw className="w-3 h-3" />
              Auto-Redis: {autoRedis ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar - Solo iconos médicos */}
  {!zenMode && (
          <ActivityBar 
            onCommandPalette={() => setShowCommandPalette(true)}
            onToggleSidebar={() => setSidebarOpen((v) => !v)}
            sidebarOpen={sidebarOpen}
          />
        )}

        {/* Sidebar - Minimap */}
  {!zenMode && sidebarOpen && (
          <div className="w-64 bg-vscode-sidebar border-r border-vscode-border flex flex-col">
            <ExpandableSection
              title={(
                <span className="inline-flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  MINIMAP RED
                </span>
              )}
              defaultOpen={true}
              storageKey="crisis.sidebar.minimap.open"
              className="flex-1 flex flex-col"
            >
              <div className="flex-1 overflow-auto">
                <NetworkMinimap hospitals={ctxHospitals.map(h => ({
                id: h.id,
                name: h.name,
                saturation: Math.round((h.currentCapacity / Math.max(1, h.maxCapacity)) * 100),
                patients: h.currentCapacity,
                capacity: h.maxCapacity,
                staff: h.criticalStaff.doctors + h.criticalStaff.nurses + h.criticalStaff.specialists,
                status: (h.currentCapacity / Math.max(1, h.maxCapacity)) > 0.95 ? 'critical' : (h.currentCapacity / Math.max(1, h.maxCapacity)) > 0.85 ? 'warning' : (h.currentCapacity / Math.max(1, h.maxCapacity)) > 0.7 ? 'normal' : 'good',
                location: `${h.location.city}`,
                specialties: ['Emergencias','UCI']
                }))} />
              </div>
            </ExpandableSection>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Main Map Area - ocupa el espacio restante */}
      <div className={`bg-vscode-editor border-b border-vscode-border flex-1`}>
            {view === 'overview' ? (
              <MainMap 
                zenMode={zenMode}
                profile={currentProfile}
              />
            ) : (
              <div className="h-full p-3">
        <CrisisMapPanel emergencyMode={emergencyMode} />
              </div>
            )}
          </div>

          {/* Bottom Panel - Metrics & Actions */}
          {!zenMode && (
            <div className="bg-vscode-panel flex flex-none">
              {/* Critical Metrics (40%) */}
        <div className="w-2/5 p-4 border-r border-vscode-border">
                <ExpandableSection
                  title={(<span className="flex items-center gap-2"><Activity className="w-4 h-4 text-vscode-crisis-critical" /> MÉTRICAS CRÍTICAS</span>)}
                  defaultOpen={true}
          storageKey="crisis.bottom.metrics.open"
                  className="h-full flex flex-col"
                >
                  <div className="overflow-auto">
                    <CrisisMetrics />
                  </div>
                </ExpandableSection>
              </div>

              {/* Quick Actions (60%) */}
        <div className="flex-1 p-4">
                <ExpandableSection
                  title={(<span className="flex items-center gap-2"><Zap className="w-4 h-4 text-vscode-activity-badge" /> ACCIONES RÁPIDAS</span>)}
                  defaultOpen={true}
          storageKey="crisis.bottom.actions.open"
                  className="h-full flex flex-col"
                >
                  {/* KPIs del contexto */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 text-xs">
                    <div className="bg-vscode-panel border border-vscode-border rounded p-2">
                      <div className="text-vscode-foreground/70">Usuarios Activos</div>
                      <div className="text-white font-semibold text-lg">{networkStats.activeUsers}</div>
                    </div>
                    <div className="bg-vscode-panel border border-vscode-border rounded p-2">
                      <div className="text-vscode-foreground/70">Alertas</div>
                      <div className={`font-semibold text-lg ${networkStats.alerts > 5 ? 'text-vscode-crisis-warning' : 'text-white'}`}>{networkStats.alerts}</div>
                    </div>
                    <div className="bg-vscode-panel border border-vscode-border rounded p-2">
                      <div className="text-vscode-foreground/70">Carga</div>
                      <div className={`font-semibold text-lg ${networkStats.systemLoad > 80 ? 'text-vscode-crisis-warning' : 'text-white'}`}>{networkStats.systemLoad}%</div>
                    </div>
                    <div className="bg-vscode-panel border border-vscode-border rounded p-2">
                      <div className="text-vscode-foreground/70">Hospitales</div>
                      <div className="text-white font-semibold text-lg">{ctxHospitals.length}</div>
                    </div>
                  </div>
                  
                  {/* Quick Action Buttons */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    <button className="bg-vscode-button hover:bg-vscode-button-hover text-white p-3 rounded flex flex-col items-center gap-1 text-xs font-medium transition-colors">
                      <Ambulance className="w-5 h-5" />
                      Redistribuir
                    </button>
                    <button className="bg-vscode-input hover:bg-vscode-list-hover text-vscode-foreground p-3 rounded flex flex-col items-center gap-1 text-xs font-medium transition-colors">
                      <Users className="w-5 h-5" />
                      Personal
                    </button>
                    <button className="bg-vscode-input hover:bg-vscode-list-hover text-vscode-foreground p-3 rounded flex flex-col items-center gap-1 text-xs font-medium transition-colors">
                      <BarChart3 className="w-5 h-5" />
                      Reportes
                    </button>
                    <button className="bg-vscode-input hover:bg-vscode-list-hover text-vscode-foreground p-3 rounded flex flex-col items-center gap-1 text-xs font-medium transition-colors">
                      <Monitor className="w-5 h-5" />
                      Dashboard
                    </button>
                  </div>

                  {/* Command Palette Trigger */}
                  <div className="mt-4">
                    <button
                      onClick={() => setShowCommandPalette(true)}
                      className="w-full bg-vscode-input hover:bg-vscode-list-hover text-vscode-foreground p-2 rounded text-sm flex items-center gap-2 border border-vscode-border"
                    >
                      <span className="text-vscode-foreground/60">Ctrl+Shift+P</span>
                      <span className="text-vscode-foreground/80">Comando médico...</span>
                    </button>
                  </div>
                </ExpandableSection>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar 
        zenMode={zenMode}
        autoRedis={autoRedis}
        activeProfile={currentProfile?.name}
      />

      {/* Command Palette */}
      <CommandPalette 
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />
    </div>
  );
}