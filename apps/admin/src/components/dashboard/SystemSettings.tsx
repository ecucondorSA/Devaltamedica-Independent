/**
 * @fileoverview SystemSettings - Configuración del sistema con arquitectura 3 capas
 * @description Componente para gestionar configuración global usando tipos simples + adaptadores
 */

'use client';

import React, { useEffect, useState } from 'react';
import { logger } from '@altamedica/shared';
import {
  AlertCircle,
  Bell,
  Database,
  RefreshCw,
  RotateCcw,
  Save,
  Settings,
  Shield,
  Zap,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@altamedica/ui';

import { AdapterUtils } from '../../adapters/admin-adapters';
import { LoadingState, SystemSettings as SystemSettingsType } from '../../types';

// ==================== INTERFACES ====================

interface SystemSettingsProps {
  className?: string;
}

// ==================== MOCK DATA ====================

const createMockSystemSettings = (): SystemSettingsType => ({
  maintenanceMode: false,
  allowRegistration: true,
  enableNotifications: true,
  maxSessionDuration: 3600,
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true,
    expirationDays: 90,
  },
  hipaaCompliance: {
    auditLogsRetentionDays: 365,
    encryptionEnabled: true,
    accessLogsEnabled: true,
    dataBackupFrequency: 'daily',
  },
  // Propiedades que faltaban en el tipo pero se usaban en el JSX
  general: {
    siteName: 'AltaMedica Admin',
    siteUrl: 'https://admin.altamedica.com',
    timezone: 'America/Bogota',
    language: 'es-ES',
    debugMode: false,
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
});

// ==================== COMPONENTE PRINCIPAL ====================

const SystemSettings: React.FC<SystemSettingsProps> = ({ className = '' }) => {
  // ==================== ESTADO ====================
  const [loadingState, setLoadingState] = useState<LoadingState>({ loading: true });
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSettingsType | null>(null);
  const [activeTab, setActiveTab] = useState<
    'general' | 'security' | 'database' | 'notifications' | 'performance'
  >('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<SystemSettingsType | null>(null);

  // ==================== EFECTOS ====================
  useEffect(() => {
    const loadSettings = async () => {
      setLoadingState({ loading: true });
      try {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const mockSettings = createMockSystemSettings();
        setSettings(mockSettings);
        setOriginalSettings(JSON.parse(JSON.stringify(mockSettings)));
        setLoadingState({ loading: false });
      } catch (error) {
        logger.error('Error loading system settings', error);
        setLoadingState({ loading: false, error: 'Failed to load settings' });
      }
    };

    void loadSettings();
  }, []);

  // ==================== FUNCIONES AUXILIARES ====================

  const handleSettingChange = (
    section: keyof SystemSettingsType | 'general',
    field: string,
    value: any,
  ) => {
    if (!settings) return;

    let newSettings;
    if (section === 'general' || section === 'passwordPolicy' || section === 'hipaaCompliance') {
      newSettings = {
        ...settings,
        [section]: {
          ...(settings[section] as any),
          [field]: value,
        },
        updatedAt: new Date().toISOString(),
      };
    } else {
      newSettings = {
        ...settings,
        [field]: value,
        updatedAt: new Date().toISOString(),
      };
    }

    setSettings(newSettings as SystemSettingsType);
    setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(originalSettings));
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
      setHasChanges(false);
      // Aquí iría la llamada real a la API
      logger.info('Settings saved', { settings });
    } catch (error) {
      logger.error('Error saving settings', error);
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = () => {
    if (originalSettings) {
      setSettings(JSON.parse(JSON.stringify(originalSettings)));
      setHasChanges(false);
    }
  };

  const handleResetToDefaults = async () => {
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const defaultSettings = createMockSystemSettings();
      setSettings(defaultSettings);
      setOriginalSettings(JSON.parse(JSON.stringify(defaultSettings)));
      setHasChanges(false);
    } catch (error) {
      logger.error('Error resetting to defaults', error);
    } finally {
      setSaving(false);
    }
  };

  // ==================== RENDERIZADO CONDICIONAL ====================

  if (loadingState.loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuración del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Cargando configuración del sistema...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loadingState.error || !settings) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            Error al Cargar Configuración
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No se pudo cargar la configuración del sistema</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ==================== TABS DE CONFIGURACIÓN ====================

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Settings },
    { id: 'security' as const, label: 'Seguridad', icon: Shield },
    { id: 'database' as const, label: 'Base de Datos', icon: Database },
    { id: 'notifications' as const, label: 'Notificaciones', icon: Bell },
    { id: 'performance' as const, label: 'Rendimiento', icon: Zap },
  ];

  // ==================== RENDERIZADO PRINCIPAL ====================

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuración del Sistema
            {hasChanges && (
              <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                Cambios pendientes
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <button
                onClick={handleResetSettings}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                title="Descartar cambios"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Descartar
              </button>
            )}
            <button
              onClick={handleSaveSettings}
              disabled={!hasChanges || saving}
              className="flex items-center px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Navegación de pestañas */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenido de configuración general */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label htmlFor="siteName" className="block text-sm font-medium text-gray-700">
                  Nombre del Sitio
                </label>
                <input
                  id="siteName"
                  type="text"
                  value={settings.general.siteName}
                  onChange={(e) => handleSettingChange('general', 'siteName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="siteUrl" className="block text-sm font-medium text-gray-700">
                  URL del Sitio
                </label>
                <input
                  id="siteUrl"
                  type="url"
                  value={settings.general.siteUrl}
                  onChange={(e) => handleSettingChange('general', 'siteUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                  Zona Horaria
                </label>
                <select
                  id="timezone"
                  value={settings.general.timezone}
                  onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="America/Bogota">América/Bogotá (COT)</option>
                  <option value="America/New_York">América/Nueva York (EST)</option>
                  <option value="Europe/Madrid">Europa/Madrid (CET)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                  Idioma
                </label>
                <select
                  id="language"
                  value={settings.general.language}
                  onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="es-ES">Español</option>
                  <option value="en-US">English</option>
                  <option value="pt-BR">Português</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Modo Mantenimiento</h3>
                  <p className="text-sm text-gray-500">Desactiva el acceso público al sistema</p>
                </div>
                <label
                  htmlFor="maintenanceMode"
                  className="relative inline-flex items-center cursor-pointer"
                >
                  <input
                    id="maintenanceMode"
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) =>
                      handleSettingChange('maintenanceMode', '', e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Modo Debug</h3>
                  <p className="text-sm text-gray-500">
                    Muestra información detallada de errores
                  </p>
                </div>
                <label
                  htmlFor="debugMode"
                  className="relative inline-flex items-center cursor-pointer"
                >
                  <input
                    id="debugMode"
                    type="checkbox"
                    checked={settings.general.debugMode}
                    onChange={(e) => handleSettingChange('general', 'debugMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Información de última actualización */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              <span>
                Última actualización: {AdapterUtils.formatDate(settings.updatedAt)} por{' '}
                {settings.updatedBy}
              </span>
            </div>
            <button
              onClick={handleResetToDefaults}
              disabled={saving}
              className="text-red-600 hover:text-red-700 hover:underline"
            >
              Restaurar valores por defecto
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemSettings;
