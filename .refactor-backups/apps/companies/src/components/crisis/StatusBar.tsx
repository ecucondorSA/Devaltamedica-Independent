'use client';

import { Button, Card, Input } from '@altamedica/ui';
import { useCrisisData } from '@/contexts/CrisisDataContext';
import {
    Activity,
    AlertCircle,
    Clock,
    Database,
    Eye,
    RotateCw,
    Users,
    Wifi
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface StatusBarProps {
  zenMode: boolean;
  autoRedis: boolean;
  activeProfile?: string;
}

export function StatusBar({ zenMode, autoRedis, activeProfile }: StatusBarProps) {
  const [currentTime, setCurrentTime] = useState('--:--:--');
  const { networkStats } = useCrisisData();

  useEffect(() => {
    // Solo ejecutar en el cliente para evitar problemas de hidratación
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit' 
      }));
    };

    // Establecer la hora inicial inmediatamente
    updateTime();
    
    // Actualizar cada segundo
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const statusItems = [
    {
      id: 'network',
      icon: <Wifi className="w-3 h-3" />,
      label: 'Red',
      value: networkStats.networkConnected ? 'Conectado' : 'Desconectado',
      status: networkStats.networkConnected ? 'good' : 'critical'
    },
    {
      id: 'database',
      icon: <Database className="w-3 h-3" />,
      label: 'Base de Datos',
      value: 'Sincronizado',
      status: 'good'
    },
    {
      id: 'active-users',
      icon: <Users className="w-3 h-3" />,
      label: 'Usuarios Activos',
      value: String(networkStats.activeUsers ?? 0),
      status: (networkStats.activeUsers ?? 0) > 50 ? 'warning' : 'normal'
    },
    {
      id: 'alerts',
      icon: <AlertCircle className="w-3 h-3" />,
      label: 'Alertas',
      value: String(networkStats.alerts ?? 0),
      status: (networkStats.alerts ?? 0) > 5 ? 'warning' : 'normal'
    },
    {
      id: 'system-load',
      icon: <Activity className="w-3 h-3" />,
      label: 'Carga Sistema',
      value: `${networkStats.systemLoad ?? 0}%`,
      status: (networkStats.systemLoad ?? 0) > 80 ? 'warning' : 'normal'
    }
  ];

  // Solarized color palette
  const solarized = {
    base03: '#002b36',
    base02: '#073642',
    base01: '#586e75',
    base00: '#657b83',
    base0: '#839496',
    base1: '#93a1a1',
    base2: '#eee8d5',
    base3: '#fdf6e3',
    yellow: '#b58900',
    orange: '#cb4b16',
    red: '#dc322f',
    magenta: '#d33682',
    violet: '#6c71c4',
    blue: '#268bd2',
    cyan: '#2aa198',
    green: '#859900'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return { color: solarized.green };
      case 'warning': return { color: solarized.orange };
      case 'critical': return { color: solarized.red };
      default: return { color: solarized.base0 };
    }
  };

  const statusBarStyle: React.CSSProperties = {
    backgroundColor: solarized.base02,
    color: solarized.base0,
    padding: '0.25rem 1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    borderTop: `1px solid ${solarized.base01}`,
    fontFamily: '"JetBrains Mono", "Fira Code", monospace'
  };

  return (
    <div style={statusBarStyle}>
      {/* Left Section - Mode & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Eye style={{ width: '0.75rem', height: '0.75rem', color: solarized.cyan }} />
          <span style={{ color: solarized.base1, fontWeight: '500' }}>
            {zenMode ? 'Zen Mode' : 'Layout: Crisis'}
          </span>
        </div>
        
        {activeProfile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: solarized.yellow, fontWeight: '500' }}>
              Perfil: {activeProfile}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RotateCw style={{ width: '0.75rem', height: '0.75rem', color: solarized.blue }} />
          <span style={{ color: solarized.base1 }}>
            Auto-Redis: <span style={{ 
              color: autoRedis ? solarized.green : solarized.red,
              fontWeight: '600'
            }}>{autoRedis ? 'ON' : 'OFF'}</span>
          </span>
        </div>
      </div>

      {/* Center Section - Status Items */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {statusItems.map((item, index) => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {index > 0 && (
              <span style={{ 
                color: `${solarized.base01}66`,
                margin: '0 0.25rem'
              }}>|</span>
            )}
            <div style={getStatusColor(item.status)}>
              {React.cloneElement(item.icon, {
                style: { width: '0.75rem', height: '0.75rem' }
              })}
            </div>
            <span style={{ color: `${solarized.base0}CC` }}>{item.label}:</span>
            <span style={{
              fontWeight: '600',
              ...getStatusColor(item.status)
            }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Right Section - Time & System */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock style={{ width: '0.75rem', height: '0.75rem', color: solarized.violet }} />
          <span style={{ 
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            color: solarized.base1,
            fontWeight: '600'
          }}>
            {currentTime}
          </span>
        </div>
        
        <div style={{ 
          color: `${solarized.base01}99`,
          fontSize: '0.7rem',
          fontWeight: '500'
        }}>
          AltaMedica Control v2.0
        </div>
      </div>
    </div>
  );
}