'use client';

import { Button, Card, Input } from '@altamedica/ui';
import {
    AlertTriangle,
    Ambulance,
    BarChart3,
    Building2,
    Command,
    RotateCw,
    Settings,
    Users
} from 'lucide-react';
import React from 'react';

interface ActivityBarProps {
  onCommandPalette: () => void;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

interface ActivityItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  color?: string;
  active?: boolean;
  onClick?: () => void;
}

export function ActivityBar({ onCommandPalette, onToggleSidebar, sidebarOpen }: ActivityBarProps) {
  const activityItems: ActivityItem[] = [
    {
      id: 'hospitals',
      icon: <Building2 className="w-5 h-5" />,
      label: 'Hospitales',
      badge: 12,
      color: 'text-vscode-activity-badge',
      active: !!sidebarOpen,
      onClick: onToggleSidebar
    },
    {
      id: 'ambulances',
      icon: <Ambulance className="w-5 h-5" />,
      label: 'Ambulancias',
      badge: 3,
      color: 'text-vscode-crisis-critical'
    },
    {
      id: 'redistribution',
      icon: <RotateCw className="w-5 h-5" />,
      label: 'Redistribución',
      badge: 7,
      color: 'text-vscode-crisis-warning'
    },
    {
      id: 'staff',
      icon: <Users className="w-5 h-5" />,
      label: 'Personal',
      badge: 15,
      color: 'text-vscode-crisis-success'
    },
    {
      id: 'analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      label: 'Analíticas',
      color: 'text-vscode-crisis-info'
    },
    {
      id: 'alerts',
      icon: <AlertTriangle className="w-5 h-5" />,
      label: 'Alertas',
      badge: 2,
      color: 'text-vscode-crisis-critical'
    },
  ];

  return (
    <div className="w-12 bg-vscode-activity-bar flex flex-col items-center py-2 border-r border-vscode-border">
      {/* Activity Items */}
      <div className="flex flex-col gap-2">
        {activityItems.map((item) => (
          <div
            key={item.id}
            className="relative group cursor-pointer"
            onClick={item.onClick}
          >
            {/* Activity Button */}
            <div
              className={`w-10 h-10 flex items-center justify-center rounded transition-colors relative ${
                item.active 
                  ? 'bg-vscode-list-active text-white' 
                  : 'text-vscode-foreground hover:bg-vscode-list-hover hover:text-white'
              }`}
            >
              <div className={item.color || 'text-vscode-foreground'}>
                {item.icon}
              </div>

              {/* Badge */}
              {item.badge && (
                <div className="absolute -top-1 -right-1 bg-vscode-activity-badge text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                  {item.badge}
                </div>
              )}
            </div>

            {/* Active Indicator */}
            {item.active && (
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-0.5 h-6 bg-white rounded-r"></div>
            )}

            {/* Tooltip */}
            <div className="absolute left-12 top-1/2 transform -translate-y-1/2 bg-vscode-panel text-vscode-foreground px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-vscode-border">
              {item.label}
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-vscode-panel border-l border-b border-vscode-border rotate-45"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Separator */}
      <div className="w-8 h-px bg-vscode-border my-4"></div>

      {/* Command Palette */}
      <div className="relative group cursor-pointer" onClick={onCommandPalette}>
        <div className="w-10 h-10 flex items-center justify-center rounded transition-colors text-vscode-foreground hover:bg-vscode-list-hover hover:text-white">
          <Command className="w-5 h-5" />
        </div>
        
        {/* Tooltip */}
        <div className="absolute left-12 top-1/2 transform -translate-y-1/2 bg-vscode-panel text-vscode-foreground px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-vscode-border">
          Comando (Ctrl+Shift+P)
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-vscode-panel border-l border-b border-vscode-border rotate-45"></div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Settings at bottom */}
      <div className="relative group cursor-pointer">
        <div className="w-10 h-10 flex items-center justify-center rounded transition-colors text-vscode-foreground hover:bg-vscode-list-hover hover:text-white">
          <Settings className="w-5 h-5" />
        </div>
        
        {/* Tooltip */}
        <div className="absolute left-12 top-1/2 transform -translate-y-1/2 bg-vscode-panel text-vscode-foreground px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-vscode-border">
          Configuración
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-vscode-panel border-l border-b border-vscode-border rotate-45"></div>
        </div>
      </div>
    </div>
  );
}