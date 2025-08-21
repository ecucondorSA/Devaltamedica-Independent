'use client';

import React, { useState, useEffect, useRef } from 'react';
import { logger } from '@altamedica/shared/services/logger.service';
import {
  Command,
  Search,
  Ambulance,
  Users,
  AlertTriangle,
  Building2,
  BarChart3,
  Phone,
  FileText,
  Settings,
  Zap,
  Heart,
  Activity
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MedicalCommand {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'emergency' | 'redistribution' | 'staff' | 'analytics' | 'system';
  shortcut?: string;
  action: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: MedicalCommand[] = [
    // Emergency Commands
    {
      id: 'activate-crisis-mode',
      title: 'Activar Modo Crisis',
      description: 'Activar protocolo de emergencia hospitalaria',
      icon: <AlertTriangle className="w-4 h-4 text-vscode-crisis-critical" />,
      category: 'emergency',
      shortcut: 'Ctrl+E',
      action: () => logger.info('Crisis mode activated')
    },
    {
      id: 'call-emergency',
      title: 'Llamada de Emergencia',
      description: 'Iniciar comunicación de emergencia con hospitales',
      icon: <Phone className="w-4 h-4 text-vscode-crisis-critical" />,
      category: 'emergency',
      shortcut: 'Ctrl+Shift+E',
      action: () => logger.info('Emergency call initiated')
    },
    {
      id: 'cardiac-alert',
      title: 'Alerta Cardíaca',
      description: 'Protocolo especializado para emergencias cardíacas',
      icon: <Heart className="w-4 h-4 text-vscode-crisis-critical" />,
      category: 'emergency',
      action: () => logger.info('Cardiac alert protocol')
    },

    // Redistribution Commands
    {
      id: 'auto-redistribute',
      title: 'Auto-Redistribuir Pacientes',
      description: 'Ejecutar redistribución automática inteligente',
      icon: <Ambulance className="w-4 h-4 text-vscode-crisis-warning" />,
      category: 'redistribution',
      shortcut: 'Ctrl+R',
      action: () => logger.info('Auto redistribution started')
    },
    {
      id: 'manual-redistribute',
      title: 'Redistribución Manual',
      description: 'Abrir interface de redistribución manual',
      icon: <Ambulance className="w-4 h-4 text-vscode-crisis-warning" />,
      category: 'redistribution',
      action: () => logger.info('Manual redistribution interface')
    },
    {
      id: 'find-capacity',
      title: 'Buscar Capacidad',
      description: 'Encontrar hospitales con capacidad disponible',
      icon: <Building2 className="w-4 h-4 text-vscode-crisis-info" />,
      category: 'redistribution',
      shortcut: 'Ctrl+F',
      action: () => logger.info('Finding capacity')
    },

    // Staff Commands
    {
      id: 'staff-shortage-alert',
      title: 'Alerta Déficit Personal',
      description: 'Detectar y reportar escasez de personal médico',
      icon: <Users className="w-4 h-4 text-vscode-crisis-warning" />,
      category: 'staff',
      action: () => logger.info('Staff shortage alert')
    },
    {
      id: 'publish-job',
      title: 'Publicar Vacante',
      description: 'Publicar automáticamente en marketplace médico',
      icon: <Users className="w-4 h-4 text-vscode-crisis-success" />,
      category: 'staff',
      shortcut: 'Ctrl+P',
      action: () => logger.info('Job published')
    },
    {
      id: 'staff-analytics',
      title: 'Analíticas de Personal',
      description: 'Ver métricas y tendencias del personal',
      icon: <BarChart3 className="w-4 h-4 text-vscode-crisis-info" />,
      category: 'staff',
      action: () => logger.info('Staff analytics')
    },

    // Analytics Commands
    {
      id: 'real-time-metrics',
      title: 'Métricas Tiempo Real',
      description: 'Dashboard de métricas en tiempo real',
      icon: <Activity className="w-4 h-4 text-vscode-activity-badge" />,
      category: 'analytics',
      shortcut: 'Ctrl+M',
      action: () => logger.info('Real-time metrics')
    },
    {
      id: 'generate-report',
      title: 'Generar Reporte',
      description: 'Generar reporte médico-administrativo',
      icon: <FileText className="w-4 h-4 text-vscode-foreground" />,
      category: 'analytics',
      action: () => logger.info('Generating report')
    },

    // System Commands
    {
      id: 'toggle-zen-mode',
      title: 'Alternar Zen Mode',
      description: 'Activar/desactivar modo de concentración',
      icon: <Zap className="w-4 h-4 text-vscode-activity-badge" />,
      category: 'system',
      shortcut: 'Ctrl+Z',
      action: () => logger.info('Zen mode toggled')
    },
    {
      id: 'system-settings',
      title: 'Configuración Sistema',
      description: 'Abrir panel de configuración avanzada',
      icon: <Settings className="w-4 h-4 text-vscode-foreground" />,
      category: 'system',
      action: () => logger.info('System settings')
    }
  ];

  const filteredCommands = commands.filter(command =>
    command.title.toLowerCase().includes(query.toLowerCase()) ||
    command.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  if (!isOpen) return null;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'emergency': return 'text-vscode-crisis-critical';
      case 'redistribution': return 'text-vscode-crisis-warning';
      case 'staff': return 'text-vscode-crisis-success';
      case 'analytics': return 'text-vscode-crisis-info';
      case 'system': return 'text-vscode-activity-badge';
      default: return 'text-vscode-foreground';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
      <div className="bg-vscode-panel border border-vscode-border rounded-lg shadow-2xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-vscode-border">
          <Command className="w-5 h-5 text-vscode-activity-badge" />
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-vscode-foreground/60" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar comando médico..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-vscode-input border border-vscode-border rounded pl-10 pr-4 py-2 text-vscode-foreground placeholder-vscode-foreground/60 focus:outline-none focus:border-vscode-activity-badge"
            />
          </div>
          <button
            onClick={onClose}
            className="text-vscode-foreground/60 hover:text-vscode-foreground"
          >
            Esc
          </button>
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-vscode-foreground/60">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No se encontraron comandos</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredCommands.map((command, index) => (
                <button
                  key={command.id}
                  onClick={() => {
                    command.action();
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded transition-colors text-left ${
                    index === selectedIndex
                      ? 'bg-vscode-list-active text-white'
                      : 'text-vscode-foreground hover:bg-vscode-list-hover'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {command.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium truncate">{command.title}</h4>
                      {command.shortcut && (
                        <span className="text-xs bg-vscode-input px-2 py-1 rounded text-vscode-foreground/80 ml-2">
                          {command.shortcut}
                        </span>
                      )}
                    </div>
                    <p className="text-sm opacity-80 truncate">{command.description}</p>
                    <div className={`text-xs mt-1 ${getCategoryColor(command.category)}`}>
                      {command.category.toUpperCase()}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-vscode-border text-xs text-vscode-foreground/60">
          <div className="flex items-center gap-4">
            <span>↑↓ navegar</span>
            <span>↵ ejecutar</span>
            <span>esc cerrar</span>
          </div>
          <span>{filteredCommands.length} comandos</span>
        </div>
      </div>
    </div>
  );
}