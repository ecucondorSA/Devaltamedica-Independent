// 📊 DASHBOARD MÉDICO CUSTOMIZABLE - ALTAMEDICA
// Sistema de dashboard con drag & drop para personalización médica
// Widgets especializados para telemedicina y monitoreo de pacientes

'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  GripVertical, Plus, Settings, Maximize2, Minimize2, 
  X, Heart, Activity, Calendar, Pill, FileText, 
  Users, TrendingUp, Clock, AlertCircle, Save,
  RotateCcw, Download, Share2, Eye, EyeOff
} from 'lucide-react';
import { CardCorporate, CardHeaderCorporate, CardContentCorporate } from '../corporate/CardCorporate';
import { ButtonCorporate } from '../corporate/ButtonCorporate';
import { HealthMetricCard } from '../medical/HealthMetricCard';
import { AppointmentCard } from '../medical/AppointmentCard';
import { StatusBadge } from '../medical/StatusBadge';

// 📱 TIPOS DE WIDGETS
export type WidgetType = 
  | 'vitals'
  | 'medications' 
  | 'appointments'
  | 'lab-results'
  | 'patient-summary'
  | 'alerts'
  | 'quick-actions'
  | 'analytics'
  | 'telemedicine'
  | 'notes';

export type WidgetSize = 'small' | 'medium' | 'large' | 'extra-large';
export type LayoutType = 'responsive' | 'grid' | 'masonry';

// 🧩 CONFIGURACIÓN DE WIDGET
export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  position: { x: number; y: number };
  isVisible: boolean;
  isCollapsed: boolean;
  settings: Record<string, any>;
}

// 📊 DATOS DE EJEMPLO PARA WIDGETS
interface WidgetData {
  vitals: Array<{
    title: string;
    value: string;
    unit: string;
    status: 'normal' | 'warning' | 'critical';
    trend: 'up' | 'down' | 'stable';
    icon: React.ReactNode;
  }>;
  appointments: Array<{
    id: string;
    title: string;
    doctor: string;
    time: string;
    type: 'consultation' | 'follow_up' | 'emergency';
    status: 'scheduled' | 'confirmed' | 'completed';
  }>;
  medications: Array<{
    name: string;
    dose: string;
    frequency: string;
    nextDose: string;
    adherence: number;
  }>;
  labResults: Array<{
    test: string;
    result: string;
    normalRange: string;
    date: string;
    status: 'normal' | 'abnormal';
  }>;
  alerts: Array<{
    type: 'critical' | 'warning' | 'info';
    message: string;
    timestamp: Date;
    action?: string;
  }>;
}

// 🎯 PROPS DEL COMPONENTE
export interface CustomizableMedicalDashboardProps {
  widgets?: WidgetType[];
  layout?: LayoutType;
  onLayoutChange?: (layout: WidgetConfig[]) => void;
  patientId?: string;
  allowCustomization?: boolean;
  defaultWidgets?: WidgetConfig[];
  className?: string;
}

// 📋 CONFIGURACIÓN DE WIDGETS DISPONIBLES
const WIDGET_DEFINITIONS: Record<WidgetType, {
  title: string;
  description: string;
  icon: React.ElementType;
  defaultSize: WidgetSize;
  color: string;
  category: string;
}> = {
  vitals: {
    title: 'Signos Vitales',
    description: 'Monitoreo en tiempo real de métricas de salud',
    icon: Heart,
    defaultSize: 'medium',
    color: 'text-red-600',
    category: 'Monitoreo'
  },
  medications: {
    title: 'Medicamentos',
    description: 'Lista de medicamentos y adherencia',
    icon: Pill,
    defaultSize: 'medium',
    color: 'text-blue-600',
    category: 'Tratamiento'
  },
  appointments: {
    title: 'Citas Médicas',
    description: 'Próximas citas y consultas',
    icon: Calendar,
    defaultSize: 'large',
    color: 'text-green-600',
    category: 'Agenda'
  },
  'lab-results': {
    title: 'Resultados de Laboratorio',
    description: 'Últimos análisis y estudios',
    icon: FileText,
    defaultSize: 'large',
    color: 'text-purple-600',
    category: 'Diagnóstico'
  },
  'patient-summary': {
    title: 'Resumen del Paciente',
    description: 'Información general y estadísticas',
    icon: Users,
    defaultSize: 'extra-large',
    color: 'text-indigo-600',
    category: 'General'
  },
  alerts: {
    title: 'Alertas Médicas',
    description: 'Notificaciones y avisos importantes',
    icon: AlertCircle,
    defaultSize: 'small',
    color: 'text-yellow-600',
    category: 'Alertas'
  },
  'quick-actions': {
    title: 'Acciones Rápidas',
    description: 'Botones de acceso directo',
    icon: Plus,
    defaultSize: 'small',
    color: 'text-gray-600',
    category: 'Herramientas'
  },
  analytics: {
    title: 'Análisis y Tendencias',
    description: 'Gráficos y estadísticas médicas',
    icon: TrendingUp,
    defaultSize: 'large',
    color: 'text-teal-600',
    category: 'Análisis'
  },
  telemedicine: {
    title: 'Telemedicina',
    description: 'Consultas virtuales y videollamadas',
    icon: Activity,
    defaultSize: 'medium',
    color: 'text-cyan-600',
    category: 'Consultas'
  },
  notes: {
    title: 'Notas Médicas',
    description: 'Observaciones y comentarios',
    icon: FileText,
    defaultSize: 'medium',
    color: 'text-orange-600',
    category: 'Documentación'
  }
};

// 📐 TAMAÑOS DE WIDGETS
const WIDGET_SIZES = {
  small: 'col-span-1 row-span-1',
  medium: 'col-span-2 row-span-2',
  large: 'col-span-3 row-span-2',
  'extra-large': 'col-span-4 row-span-3'
};

// 🏥 COMPONENTE PRINCIPAL
export const CustomizableMedicalDashboard: React.FC<CustomizableMedicalDashboardProps> = ({
  widgets = ['vitals', 'appointments', 'medications', 'alerts'],
  layout = 'responsive',
  onLayoutChange,
  patientId,
  allowCustomization = true,
  defaultWidgets,
  className = ''
}) => {
  // 📊 ESTADO
  const [widgetConfigs, setWidgetConfigs] = useState<WidgetConfig[]>(() => {
    if (defaultWidgets) return defaultWidgets;
    
    return widgets.map((widget, index) => ({
      id: `widget-${widget}-${index}`,
      type: widget,
      title: WIDGET_DEFINITIONS[widget].title,
      size: WIDGET_DEFINITIONS[widget].defaultSize,
      position: { x: index % 4, y: Math.floor(index / 4) },
      isVisible: true,
      isCollapsed: false,
      settings: {}
    }));
  });

  const [isCustomizing, setIsCustomizing] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [availableWidgets, setAvailableWidgets] = useState<WidgetType[]>(
    Object.keys(WIDGET_DEFINITIONS).filter(w => !widgets.includes(w as WidgetType)) as WidgetType[]
  );

  // 🎲 DATOS MOCK PARA WIDGETS
  const mockData: WidgetData = useMemo(() => ({
    vitals: [
      { title: 'Frecuencia Cardíaca', value: '72', unit: 'bpm', status: 'normal', trend: 'stable', icon: <Heart className="w-5 h-5" /> },
      { title: 'Presión Arterial', value: '120/80', unit: 'mmHg', status: 'normal', trend: 'down', icon: <Activity className="w-5 h-5" /> },
      { title: 'Temperatura', value: '36.8', unit: '°C', status: 'normal', trend: 'stable', icon: <Heart className="w-5 h-5" /> },
      { title: 'Saturación O₂', value: '98', unit: '%', status: 'normal', trend: 'up', icon: <Activity className="w-5 h-5" /> }
    ],
    appointments: [
      { id: '1', title: 'Control Cardiológico', doctor: 'Dr. García', time: '10:00', type: 'consultation', status: 'confirmed' },
      { id: '2', title: 'Seguimiento Diabetes', doctor: 'Dr. López', time: '14:30', type: 'follow_up', status: 'scheduled' }
    ],
    medications: [
      { name: 'Enalapril', dose: '10mg', frequency: '1 vez/día', nextDose: '08:00', adherence: 95 },
      { name: 'Metformina', dose: '500mg', frequency: '2 veces/día', nextDose: '12:00', adherence: 88 }
    ],
    labResults: [
      { test: 'Glucosa', result: '95 mg/dL', normalRange: '70-100', date: '2025-01-25', status: 'normal' },
      { test: 'Colesterol Total', result: '180 mg/dL', normalRange: '<200', date: '2025-01-25', status: 'normal' }
    ],
    alerts: [
      { type: 'warning', message: 'Recordatorio: Tomar medicación de la tarde', timestamp: new Date(), action: 'Marcar como tomado' },
      { type: 'info', message: 'Nueva cita programada para mañana', timestamp: new Date() }
    ]
  }), []);

  // 🎨 RENDERIZAR WIDGET INDIVIDUAL
  const renderWidget = useCallback((config: WidgetConfig) => {
    const definition = WIDGET_DEFINITIONS[config.type];
    const Icon = definition.icon;

    if (config.isCollapsed) {
      return (
        <div className={`${WIDGET_SIZES[config.size]} p-2`}>
          <div className="h-12 bg-gray-100 rounded-lg flex items-center justify-between px-3">
            <div className="flex items-center gap-2">
              <Icon className={`w-4 h-4 ${definition.color}`} />
              <span className="text-sm font-medium text-gray-700">{config.title}</span>
            </div>
            <ButtonCorporate
              variant="ghost"
              size="sm"
              onClick={() => toggleWidgetCollapse(config.id)}
              icon={<Maximize2 className="w-3 h-3" />}
            />
          </div>
        </div>
      );
    }

    const widgetContent = () => {
      switch (config.type) {
        case 'vitals':
          return (
            <div className="grid grid-cols-2 gap-3">
              {mockData.vitals.map((vital, index) => (
                <HealthMetricCard
                  key={index}
                  title={vital.title}
                  value={vital.value}
                  unit={vital.unit}
                  status={vital.status as any}
                  trend={vital.trend as any}
                  icon={vital.icon}
                />
              ))}
            </div>
          );

        case 'appointments':
          return (
            <div className="space-y-3">
              {mockData.appointments.map((appointment) => (
                <div key={appointment.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{appointment.title}</span>
                    <StatusBadge status={appointment.status as any} size="sm" />
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>{appointment.doctor} - {appointment.time}</p>
                  </div>
                </div>
              ))}
            </div>
          );

        case 'medications':
          return (
            <div className="space-y-3">
              {mockData.medications.map((med, index) => (
                <div key={index} className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-800">{med.name}</span>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {med.adherence}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>{med.dose} - {med.frequency}</p>
                    <p className="text-xs">Próxima dosis: {med.nextDose}</p>
                  </div>
                </div>
              ))}
            </div>
          );

        case 'lab-results':
          return (
            <div className="space-y-3">
              {mockData.labResults.map((result, index) => (
                <div key={index} className="p-3 bg-white border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-800">{result.test}</span>
                    <StatusBadge 
                      status={result.status === 'normal' ? 'success' : 'warning'} 
                      size="sm" 
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Resultado: {result.result}</p>
                    <p>Rango normal: {result.normalRange}</p>
                    <p className="text-xs">{result.date}</p>
                  </div>
                </div>
              ))}
            </div>
          );

        case 'alerts':
          return (
            <div className="space-y-2">
              {mockData.alerts.map((alert, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${
                    alert.type === 'critical' ? 'bg-red-50 border-red-200' :
                    alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className={`w-4 h-4 mt-0.5 ${
                      alert.type === 'critical' ? 'text-red-600' :
                      alert.type === 'warning' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{alert.message}</p>
                      <p className="text-xs text-gray-500">
                        {alert.timestamp.toLocaleTimeString('es-AR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      {alert.action && (
                        <ButtonCorporate 
                          variant="ghost" 
                          size="sm" 
                          className="mt-1 text-xs"
                        >
                          {alert.action}
                        </ButtonCorporate>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );

        case 'quick-actions':
          return (
            <div className="grid grid-cols-2 gap-2">
              <ButtonCorporate variant="outline" size="sm" icon={<Plus />}>
                Nueva Cita
              </ButtonCorporate>
              <ButtonCorporate variant="outline" size="sm" icon={<FileText />}>
                Receta
              </ButtonCorporate>
              <ButtonCorporate variant="outline" size="sm" icon={<Activity />}>
                Videollamada
              </ButtonCorporate>
              <ButtonCorporate variant="outline" size="sm" icon={<Heart />}>
                Vitales
              </ButtonCorporate>
            </div>
          );

        default:
          return (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <div className="text-center">
                <Icon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Widget en desarrollo</p>
              </div>
            </div>
          );
      }
    };

    return (
      <div
        className={`${WIDGET_SIZES[config.size]} p-2`}
        draggable={isCustomizing}
        onDragStart={() => setDraggedWidget(config.id)}
        onDragEnd={() => setDraggedWidget(null)}
      >
        <CardCorporate
          variant="default"
          className={`h-full ${isCustomizing ? 'ring-2 ring-blue-200' : ''} ${
            draggedWidget === config.id ? 'opacity-50' : ''
          }`}
        >
          <CardHeaderCorporate
            title={config.title}
            medical={true}
            actions={
              <div className="flex items-center gap-1">
                {isCustomizing && (
                  <>
                    <ButtonCorporate
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleWidgetCollapse(config.id)}
                      icon={<Minimize2 className="w-3 h-3" />}
                    />
                    <ButtonCorporate
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleWidgetVisibility(config.id)}
                      icon={config.isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    />
                    <ButtonCorporate
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWidget(config.id)}
                      icon={<X className="w-3 h-3" />}
                    />
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                  </>
                )}
              </div>
            }
          />
          <CardContentCorporate className="flex-1 overflow-auto">
            {widgetContent()}
          </CardContentCorporate>
        </CardCorporate>
      </div>
    );
  }, [isCustomizing, draggedWidget, mockData]);

  // 🔧 FUNCIONES DE MANIPULACIÓN DE WIDGETS
  const addWidget = useCallback((type: WidgetType) => {
    const newWidget: WidgetConfig = {
      id: `widget-${type}-${Date.now()}`,
      type,
      title: WIDGET_DEFINITIONS[type].title,
      size: WIDGET_DEFINITIONS[type].defaultSize,
      position: { x: 0, y: 0 },
      isVisible: true,
      isCollapsed: false,
      settings: {}
    };

    setWidgetConfigs(prev => [...prev, newWidget]);
    setAvailableWidgets(prev => prev.filter(w => w !== type));
  }, []);

  const removeWidget = useCallback((widgetId: string) => {
    const widget = widgetConfigs.find(w => w.id === widgetId);
    if (widget) {
      setWidgetConfigs(prev => prev.filter(w => w.id !== widgetId));
      setAvailableWidgets(prev => [...prev, widget.type]);
    }
  }, [widgetConfigs]);

  const toggleWidgetVisibility = useCallback((widgetId: string) => {
    setWidgetConfigs(prev => prev.map(w => 
      w.id === widgetId ? { ...w, isVisible: !w.isVisible } : w
    ));
  }, []);

  const toggleWidgetCollapse = useCallback((widgetId: string) => {
    setWidgetConfigs(prev => prev.map(w => 
      w.id === widgetId ? { ...w, isCollapsed: !w.isCollapsed } : w
    ));
  }, []);

  const saveLayout = useCallback(() => {
    onLayoutChange?.(widgetConfigs);
    setIsCustomizing(false);
  }, [widgetConfigs, onLayoutChange]);

  const resetLayout = useCallback(() => {
    const defaultLayout = widgets.map((widget, index) => ({
      id: `widget-${widget}-${index}`,
      type: widget,
      title: WIDGET_DEFINITIONS[widget].title,
      size: WIDGET_DEFINITIONS[widget].defaultSize,
      position: { x: index % 4, y: Math.floor(index / 4) },
      isVisible: true,
      isCollapsed: false,
      settings: {}
    }));
    setWidgetConfigs(defaultLayout);
  }, [widgets]);

  // 📱 WIDGETS VISIBLES
  const visibleWidgets = widgetConfigs.filter(w => w.isVisible);

  return (
    <div className={`w-full ${className}`}>
      {/* BARRA DE HERRAMIENTAS */}
      {allowCustomization && (
        <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Dashboard Médico Personalizable
              </h2>
              <StatusBadge 
                status={isCustomizing ? 'in_progress' : 'active'} 
                text={isCustomizing ? 'Personalizando' : 'Modo Vista'}
              />
            </div>

            <div className="flex items-center gap-2">
              {!isCustomizing ? (
                <ButtonCorporate
                  variant="outline"
                  onClick={() => setIsCustomizing(true)}
                  icon={<Settings className="w-4 h-4" />}
                >
                  Personalizar
                </ButtonCorporate>
              ) : (
                <>
                  <ButtonCorporate
                    variant="ghost"
                    onClick={resetLayout}
                    icon={<RotateCcw className="w-4 h-4" />}
                  >
                    Resetear
                  </ButtonCorporate>
                  <ButtonCorporate
                    variant="outline"
                    onClick={() => setIsCustomizing(false)}
                  >
                    Cancelar
                  </ButtonCorporate>
                  <ButtonCorporate
                    variant="medical"
                    onClick={saveLayout}
                    icon={<Save className="w-4 h-4" />}
                  >
                    Guardar Layout
                  </ButtonCorporate>
                </>
              )}
            </div>
          </div>

          {/* WIDGETS DISPONIBLES PARA AÑADIR */}
          {isCustomizing && availableWidgets.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Widgets Disponibles:
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableWidgets.map(widgetType => {
                  const definition = WIDGET_DEFINITIONS[widgetType];
                  const Icon = definition.icon;
                  
                  return (
                    <ButtonCorporate
                      key={widgetType}
                      variant="outline"
                      size="sm"
                      onClick={() => addWidget(widgetType)}
                      icon={<Icon className="w-4 h-4" />}
                    >
                      {definition.title}
                    </ButtonCorporate>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* GRID DE WIDGETS */}
      <div className={`
        grid gap-4 auto-rows-min
        ${layout === 'responsive' ? 'grid-cols-1 lg:grid-cols-4' : 
          layout === 'grid' ? 'grid-cols-4' : 
          'columns-4'
        }
      `}>
        {visibleWidgets.map(widget => (
          <div key={widget.id}>
            {renderWidget(widget)}
          </div>
        ))}
      </div>

      {/* MENSAJE CUANDO NO HAY WIDGETS */}
      {visibleWidgets.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            Dashboard Vacío
          </h3>
          <p className="text-gray-600 mb-4">
            No hay widgets visibles. Añade algunos para comenzar.
          </p>
          {allowCustomization && (
            <ButtonCorporate
              variant="primary"
              onClick={() => setIsCustomizing(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Personalizar Dashboard
            </ButtonCorporate>
          )}
        </div>
      )}
    </div>
  );
};