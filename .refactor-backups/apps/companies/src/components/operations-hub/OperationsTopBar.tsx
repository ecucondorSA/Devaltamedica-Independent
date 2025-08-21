"use client";

import { Button, Card, Input } from '@altamedica/ui';
import { TabType, useOperationsUI } from '@/contexts/OperationsUIContext';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Eye,
  Monitor,
  RotateCw
} from 'lucide-react';
import React from 'react';

export interface Profile {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

export const DEFAULT_PROFILES: Profile[] = [
  {
    id: 'emergency',
    name: 'Emergencias',
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'bg-red-600'
  },
  {
    id: 'normal',
    name: 'Normal',
    icon: <Monitor className="w-4 h-4" />,
    color: 'bg-slate-700'
  },
  {
    id: 'analysis',
    name: 'Análisis',
    icon: <BarChart3 className="w-4 h-4" />,
    color: 'bg-blue-600'
  }
];

export interface OperationsTopBarProps {
  title?: string;
  profiles?: Profile[];
  activeProfile?: string;
  onProfileChange?: (profileId: string) => void;
  showCrisisIndicator?: boolean;
  emergencyMode?: boolean;
  onEmergencyToggle?: () => void;
  autoRedis?: boolean;
  onAutoRedisToggle?: () => void;
  customActions?: React.ReactNode;
  theme?: 'slate' | 'vscode';
  persistProfile?: boolean;
}

export function OperationsTopBar({
  title = 'OPERATIONS HUB',
  profiles = DEFAULT_PROFILES,
  activeProfile = 'normal',
  onProfileChange,
  showCrisisIndicator = false,
  emergencyMode = false,
  onEmergencyToggle,
  autoRedis = true,
  onAutoRedisToggle,
  customActions,
  theme = 'slate',
  persistProfile = true
}: OperationsTopBarProps) {
  const {
    activeTab,
    setActiveTab,
    zenMode,
    toggleZenMode,
  } = useOperationsUI();

  // Persistir perfil activo si está habilitado
  const appliedFromStorageRef = React.useRef(false);
  React.useEffect(() => {
    // Solo intentar sincronizar una vez al montar (o si se habilita persistencia)
    if (!persistProfile || appliedFromStorageRef.current) return;
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('ops.profile.id');
      if (stored && profiles.find(p => p.id === stored) && stored !== activeProfile) {
        appliedFromStorageRef.current = true;
        onProfileChange?.(stored);
      } else {
        appliedFromStorageRef.current = true;
      }
    } catch {
      // no-op
    }
  }, [persistProfile]);

  React.useEffect(() => {
    if (persistProfile && typeof window !== 'undefined') {
      localStorage.setItem('ops.profile.id', activeProfile);
    }
  }, [persistProfile, activeProfile]);

  // Sistema de temas
  const getThemeClasses = () => {
    if (theme === 'vscode') {
      return {
        header: 'bg-vscode-activity-bar border-b border-vscode-border text-vscode-foreground',
        title: 'text-white',
        profileActive: 'text-white shadow-lg',
        profileInactive: 'bg-vscode-input text-vscode-foreground hover:bg-vscode-list-hover',
        profileLabel: 'text-vscode-foreground/70',
        crisisIndicator: 'text-vscode-crisis-critical',
        crisisDot: 'bg-vscode-crisis-critical',
        tabGroup: 'bg-vscode-input',
        tabActive: 'bg-vscode-activity-badge text-white',
        tabInactive: 'text-vscode-foreground hover:bg-vscode-list-hover',
        buttonActive: 'text-white',
        buttonInactive: 'bg-vscode-input text-vscode-foreground hover:bg-vscode-list-hover'
      };
    } else {
      return {
        header: 'bg-slate-900 border-b border-slate-700 text-white',
        title: 'text-white',
        profileActive: 'text-white shadow-lg',
        profileInactive: 'bg-slate-700 text-slate-300 hover:bg-slate-600',
        profileLabel: 'text-slate-300',
        crisisIndicator: 'text-red-400',
        crisisDot: 'bg-red-500',
        tabGroup: 'bg-slate-800',
        tabActive: 'bg-blue-600 text-white',
        tabInactive: 'text-slate-300 hover:bg-slate-700',
        buttonActive: 'text-white',
        buttonInactive: 'bg-slate-700 text-slate-300 hover:bg-slate-600'
      };
    }
  };

  const themeClasses = getThemeClasses();

  const tabButtons: { id: TabType; label: string }[] = [
    { id: 'network', label: 'Red Hospitalaria' },
    { id: 'redistribution', label: 'Redistribución' },
    { id: 'marketplace', label: 'Marketplace' },
  ];

  return (
    <header className={`${themeClasses.header} px-4 py-2 flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-vscode-activity-badge" />
          <h1 className={`text-lg font-semibold ${themeClasses.title}`}>{title}</h1>
        </div>

        {/* Profile Selector */}
        {profiles.length > 0 && (
          <div className="flex items-center gap-1 ml-6">
            <span className={`text-sm mr-2 ${themeClasses.profileLabel}`}>Perfil:</span>
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => onProfileChange?.(profile.id)}
                data-onboarding={`profile-${profile.id}`}
                className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
                  activeProfile === profile.id
                    ? `${theme === 'vscode' ? 'bg-vscode-activity-badge' : profile.color} ${themeClasses.profileActive}`
                    : themeClasses.profileInactive
                }`}
                aria-pressed={activeProfile === profile.id}
              >
                {profile.icon}
                {profile.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Crisis Indicator */}
        {showCrisisIndicator && (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${themeClasses.crisisDot}`}></div>
            <span className={`text-sm font-medium ${themeClasses.crisisIndicator}`}>CRISIS ON</span>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          {/* Tab Navigation */}
          <div className={`hidden md:flex items-center rounded ${themeClasses.tabGroup}`}>
            {tabButtons.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                data-onboarding={`tab-${tab.id}`}
                className={`px-3 py-1 text-xs font-medium ${
                  index === 0 ? 'rounded-l' : index === tabButtons.length - 1 ? 'rounded-r' : ''
                } ${activeTab === tab.id ? themeClasses.tabActive : themeClasses.tabInactive}`}
                aria-pressed={activeTab === tab.id}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Emergency Toggle */}
          {onEmergencyToggle && (
            <button
              onClick={onEmergencyToggle}
              className={`px-3 py-1 rounded text-xs font-medium ${
                emergencyMode ? 'bg-red-600 text-white' : themeClasses.buttonInactive
              }`}
              aria-pressed={emergencyMode}
            >
              {emergencyMode ? 'Emergencia ON' : 'Emergencia OFF'}
            </button>
          )}

          {/* Zen Mode */}
          <button
            onClick={toggleZenMode}
            data-onboarding="zen-toggle"
            className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 ${
              zenMode ? 'bg-amber-600 text-white' : themeClasses.buttonInactive
            }`}
            aria-pressed={zenMode}
          >
            <Eye className="w-3 h-3" />
            Zen Mode
          </button>

          {/* Auto Redis */}
          {onAutoRedisToggle && (
            <button
              onClick={onAutoRedisToggle}
              data-onboarding="auto-redis-toggle"
              className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                autoRedis ? 'bg-green-600 text-white' : themeClasses.buttonInactive
              }`}
              aria-pressed={autoRedis}
            >
              <RotateCw className="w-3 h-3" />
              Auto-Redis: {autoRedis ? 'ON' : 'OFF'}
            </button>
          )}

          {/* Custom Actions */}
          {customActions}
        </div>
      </div>
    </header>
  );
}
