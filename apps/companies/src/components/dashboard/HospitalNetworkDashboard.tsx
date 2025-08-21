/**
 * 🏥 HOSPITAL NETWORK DASHBOARD - REFACTORIZADO
 * Dashboard principal para gestión de red hospitalaria
 * Versión modularizada para mejor mantenibilidad
 */

import { logger } from '@altamedica/shared/services/logger.service';
import { cn } from '@altamedica/utils';
import { ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { DashboardControls } from './components/DashboardControls';
import { useHospitalDashboard } from './hooks/useHospitalDashboard';
import HospitalRedistributionMap from './HospitalRedistributionMap';
import { DashboardProps } from './types/HospitalDashboardTypes';

interface NetworkStatus {
  healthy: number;
  warning: number;
  critical: number;
  total: number;
}

interface RedistributionSuggestion {
  id: string;
  fromHospitalId: string;
  fromHospitalName: string;
  toHospitalId: string;
  toHospitalName: string;
  patientsToTransfer: number;
  estimatedTime: number; // minutes
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  createdAt: Date;
}

interface StaffShortage {
  id: string;
  hospitalId: string;
  hospitalName: string;
  specialty: string;
  currentStaff: number;
  requiredStaff: number;
  shortage: number;
  severity: 'critical' | 'urgent' | 'moderate';
  impactDescription: string;
  estimatedWaitIncrease: number; // percentage
  suggestedActions: string[];
  autoJobPostingTriggered: boolean;
  detectedAt: Date;
}

interface JobPosting {
  id: string;
  shortageId: string;
  title: string;
  specialty: string;
  hospitalName: string;
  urgencyLevel: 'critical' | 'urgent' | 'moderate';
  positions: number;
  salaryRange: string;
  benefits: string[];
  requirements: string[];
  status: 'draft' | 'published' | 'applications_open' | 'filled';
  postedAt: Date;
  applicationsCount: number;
}

export default function HospitalNetworkDashboard({ hospitalId, config }: DashboardProps) {
  const {
    state,
    loadHospitalData,
    toggleSection,
    toggleDarkMode,
    toggleCompactView,
    toggleEmergencyMode,
    toggleMapView
  } = useHospitalDashboard(hospitalId);

  const {
    metrics,
    networkStatus,
    loading,
    lastUpdate,
    expandedSections,
    isDarkMode,
    isCompactView,
    emergencyMode,
    showMapView
  } = state;

  // Servicio de integración - comentado temporalmente para evitar errores
  // const dataService = new HospitalDataIntegrationService(config);

  // Componente de controles principales
  const renderMainControls = () => (
    <DashboardControls
      emergencyMode={emergencyMode}
      showMapView={showMapView}
      isDarkMode={isDarkMode}
      isCompactView={isCompactView}
      onToggleEmergency={toggleEmergencyMode}
      onToggleMapView={toggleMapView}
      onToggleDarkMode={toggleDarkMode}
      onToggleCompactView={toggleCompactView}
      onRefresh={loadHospitalData}
    />
  );

  // 🔄 REDISTRIBUTION LOGIC (moved up to avoid "used before declaration" issues)
  const loadNetworkData = useCallback(async () => {
    // Mock network data - En producción vendría de la API
    const mockHospitals = [
      {
        id: 'hosp-1',
        name: 'Hospital Central',
        capacity: { current: 285, max: 300, percentage: 95 },
        emergency: { waiting: 15, critical: 3 },
        staff: { doctors: 12, nurses: 45, required: { doctors: 15, nurses: 50 } },
        location: { 
          distance: 0,
          city: 'Buenos Aires',
          country: 'Argentina',
          coordinates: [-34.6037, -58.3816] as [number, number]
        }
      },
      {
        id: 'hosp-2', 
        name: 'Hospital Norte',
        capacity: { current: 180, max: 250, percentage: 72 },
        emergency: { waiting: 5, critical: 1 },
        staff: { doctors: 20, nurses: 35, required: { doctors: 18, nurses: 40 } },
        location: { 
          distance: 15,
          city: 'San Miguel',
          country: 'Argentina',
          coordinates: [-34.5420, -58.7120] as [number, number]
        }
      },
      {
        id: 'hosp-3',
        name: 'Hospital Sul',
        capacity: { current: 220, max: 280, percentage: 79 },
        emergency: { waiting: 8, critical: 2 },
        staff: { doctors: 8, nurses: 25, required: { doctors: 16, nurses: 35 } },
        location: { 
          distance: 22,
          city: 'La Plata',
          country: 'Argentina',
          coordinates: [-34.9214, -57.9544] as [number, number]
        }
      }
    ];

    // Generar sugerencias de redistribución
    const suggestions = generateRedistributionSuggestions(mockHospitals);
    setRedistributionSuggestions(suggestions);

    // Detectar déficits de personal
    const shortages = detectStaffShortagesByHospital(mockHospitals);
    setStaffShortages(shortages);

    // 🗺️ Preparar datos para el mapa
    const mapFormattedHospitals: MapHospital[] = mockHospitals.map(hospital => ({
      id: hospital.id,
      name: hospital.name,
      location: {
        city: hospital.location.city,
        country: hospital.location.country,
        coordinates: hospital.location.coordinates as [number, number]
      },
      currentCapacity: hospital.capacity.current,
      maxCapacity: hospital.capacity.max,
      criticalStaff: {
        doctors: hospital.staff.doctors,
        nurses: hospital.staff.nurses,
        specialists: Math.floor(Math.random() * 5) + 3, // mock specialists
        requiredDoctors: hospital.staff.required.doctors,
        requiredNurses: hospital.staff.required.nurses,
        requiredSpecialists: Math.floor(Math.random() * 3) + 7 // mock required
      },
      status: hospital.capacity.percentage > 95 ? 'saturated' :
              hospital.capacity.percentage > 85 ? 'critical' :
              hospital.capacity.percentage > 75 ? 'warning' : 'normal',
      waitingPatients: hospital.emergency.waiting,
      emergencyPatients: hospital.emergency.critical,
      lastUpdated: new Date()
    }));

    setMapHospitals(mapFormattedHospitals);
  }, []);

  const checkCompletedRedistributions = useCallback(() => {
    // Limpiar redistribuciones completadas después de 5 minutos
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    setRedistributionSuggestions(prev => 
      prev.filter(s => 
        s.status !== 'completed' || s.createdAt > fiveMinutesAgo
      )
    );
  }, []);

  const evaluateEmergencyActions = useCallback(() => {
    // Acciones automáticas en modo de emergencia
    if (metrics && metrics.occupancy.beds.percentage > 95) {
      // Forzar redistribucion inmediata
      const criticalSuggestions = redistributionSuggestions.filter(
        s => s.priority === 'critical' && s.status === 'pending'
      );
      
      criticalSuggestions.forEach(suggestion => {
        if (autoRedistributionEnabled) {
          executeRedistribution(suggestion.id);
        }
      });
    }
  }, [metrics, redistributionSuggestions, autoRedistributionEnabled]);

  useEffect(() => {
    // Cargar datos iniciales
    loadHospitalData();
    loadNetworkData();

    // Configurar actualización en tiempo real - simulada
    const unsubscribe = () => {
      // Simular desconexión - en producción usaría dataService.startRealTimeMonitoring
      logger.info('Real-time monitoring would be disconnected here');
    };

    // Actualización periódica cada 30 segundos
    const interval = setInterval(() => {
      loadHospitalData();
      checkCompletedRedistributions();
    }, 30000);

    // 🚨 Monitor de emergencia cada 10 segundos
    const emergencyInterval = setInterval(() => {
      if (emergencyMode) {
        evaluateEmergencyActions();
      }
    }, 10000);

    return () => {
      unsubscribe();
      clearInterval(interval);
      clearInterval(emergencyInterval);
    };
  }, [hospitalId, autoRedistributionEnabled, autoJobPostingEnabled, emergencyMode, loadHospitalData, loadNetworkData, checkCompletedRedistributions, evaluateEmergencyActions]);


  const updateNetworkStatus = (data: HospitalMetrics) => {
    try {
      // Calcular saturación manualmente para evitar errores del servicio
      const bedsPercentage = data.occupancy.beds.percentage;
      const emergencyWaiting = data.occupancy.emergency.waiting;
      
      // Lógica de saturación simplificada
      let saturationLevel: 'normal' | 'warning' | 'critical' = 'normal';
      let saturationScore = bedsPercentage;
      
      if (bedsPercentage >= 90) {
        saturationLevel = 'critical';
        saturationScore = bedsPercentage + (emergencyWaiting * 2);
      } else if (bedsPercentage >= 75) {
        saturationLevel = 'warning';
        saturationScore = bedsPercentage + emergencyWaiting;
      }
      
      // Actualizar estado de red basado en saturación
      setNetworkStatus(prev => ({
        ...prev,
        critical: saturationLevel === 'critical' ? Math.min(prev.critical + 1, 100) : prev.critical,
        warning: saturationLevel === 'warning' ? Math.min(prev.warning + 1, 100) : prev.warning
      }));
      
      // Activar modo de emergencia si la saturación es crítica
      if (saturationLevel === 'critical' && saturationScore > 90) {
        setEmergencyMode(true);
      } else if (saturationScore < 60) {
        setEmergencyMode(false);
      }
    } catch (error) {
      logger.error('Error updating network status:', error);
      // En caso de error, usar valores conservadores
      setEmergencyMode(false);
    }
  };

  // (loadNetworkData moved above)

  const generateRedistributionSuggestions = (hospitals: any[]): RedistributionSuggestion[] => {
    const suggestions: RedistributionSuggestion[] = [];
    
    const oversaturated = hospitals.filter(h => h.capacity.percentage > 90);
    const hasCapacity = hospitals.filter(h => h.capacity.percentage < 80).sort((a, b) => a.location.distance - b.location.distance);
    
    oversaturated.forEach(fromHosp => {
      const patientsToTransfer = Math.min(
        fromHosp.emergency.waiting - fromHosp.emergency.critical,
        Math.floor((fromHosp.capacity.percentage - 85) / 100 * fromHosp.capacity.max)
      );
      
      if (patientsToTransfer > 0 && hasCapacity.length > 0) {
        const toHosp = hasCapacity[0]; // Closest hospital with capacity
        
        suggestions.push({
          id: `redist-${fromHosp.id}-${toHosp.id}-${Date.now()}`,
          fromHospitalId: fromHosp.id,
          fromHospitalName: fromHosp.name,
          toHospitalId: toHosp.id,
          toHospitalName: toHosp.name,
          patientsToTransfer,
          estimatedTime: Math.round(toHosp.location.distance * 2.5 + 15), // Base time + transport
          priority: fromHosp.capacity.percentage > 95 ? 'critical' : fromHosp.capacity.percentage > 90 ? 'high' : 'medium',
          reason: `${fromHosp.name} tiene ${fromHosp.capacity.percentage}% de ocupación y ${fromHosp.emergency.waiting} pacientes en espera`,
          status: 'pending',
          createdAt: new Date()
        });
      }
    });
    
    return suggestions;
  };

  const evaluateRedistributionNeeds = (data: HospitalMetrics) => {
    // Evaluar en tiempo real si se necesitan redistribuciones adicionales
    if (data.occupancy.beds.percentage > 90 && data.occupancy.emergency.waiting > 10) {
      const existingSuggestion = redistributionSuggestions.find(
        s => s.fromHospitalId === data.hospitalId && s.status === 'pending'
      );
      
      if (!existingSuggestion) {
        // Crear nueva sugerencia de redistribución
        loadNetworkData(); // Recargar para generar nuevas sugerencias
      }
    }
  };

  const executeRedistribution = async (suggestionId: string) => {
    setActiveRedistributions(prev => new Set([...prev, suggestionId]));
    
    // Actualizar estado de la sugerencia
    setRedistributionSuggestions(prev => 
      prev.map(s => s.id === suggestionId ? { ...s, status: 'executing' } : s)
    );

    try {
      // Simular proceso de redistribución
      // En producción: await hospitalNetworkService.executeRedistribution(suggestionId);
      
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simular tiempo de ejecución
      
      // Marcar como completado
      setRedistributionSuggestions(prev => 
        prev.map(s => s.id === suggestionId ? { ...s, status: 'completed' } : s)
      );
      
      // Mostrar notificación de éxito
      // En producción: showNotification('Redistribución completada exitosamente');
      
    } catch (error) {
      // Manejar error
      setRedistributionSuggestions(prev => 
        prev.map(s => s.id === suggestionId ? { ...s, status: 'failed' } : s)
      );
    } finally {
      setActiveRedistributions(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestionId);
        return newSet;
      });
    }
  };

  // 👨‍⚕️ STAFF SHORTAGE DETECTION
  const detectStaffShortagesByHospital = (hospitals: any[]): StaffShortage[] => {
    const shortages: StaffShortage[] = [];
    
    hospitals.forEach(hospital => {
      // Detectar déficit de doctores
      if (hospital.staff.doctors < hospital.staff.required.doctors) {
        const shortage = hospital.staff.required.doctors - hospital.staff.doctors;
        shortages.push({
          id: `shortage-${hospital.id}-doctors-${Date.now()}`,
          hospitalId: hospital.id,
          hospitalName: hospital.name,
          specialty: 'Médico General',
          currentStaff: hospital.staff.doctors,
          requiredStaff: hospital.staff.required.doctors,
          shortage,
          severity: shortage > 5 ? 'critical' : shortage > 2 ? 'urgent' : 'moderate',
          impactDescription: `Déficit de ${shortage} médicos puede aumentar tiempos de espera en ${shortage * 15}%`,
          estimatedWaitIncrease: shortage * 15,
          suggestedActions: [
            'Publicar vacantes urgentes en marketplace',
            'Contratar médicos temporales',
            'Redistribuir personal de otros hospitales'
          ],
          autoJobPostingTriggered: false,
          detectedAt: new Date()
        });
      }
      
      // Detectar déficit de enfermeros
      if (hospital.staff.nurses < hospital.staff.required.nurses) {
        const shortage = hospital.staff.required.nurses - hospital.staff.nurses;
        shortages.push({
          id: `shortage-${hospital.id}-nurses-${Date.now()}`,
          hospitalId: hospital.id,
          hospitalName: hospital.name,
          specialty: 'Enfermería',
          currentStaff: hospital.staff.nurses,
          requiredStaff: hospital.staff.required.nurses,
          shortage,
          severity: shortage > 10 ? 'critical' : shortage > 5 ? 'urgent' : 'moderate',
          impactDescription: `Déficit de ${shortage} enfermeros puede reducir capacidad de atención en ${shortage * 8}%`,
          estimatedWaitIncrease: shortage * 8,
          suggestedActions: [
            'Contratar enfermeros temporales',
            'Publicar múltiples vacantes',
            'Activar protocolo de horas extras'
          ],
          autoJobPostingTriggered: false,
          detectedAt: new Date()
        });
      }
    });
    
    return shortages;
  };

  const detectStaffShortages = (data: HospitalMetrics) => {
    // Detectar déficits basado en métricas en tiempo real
    const currentShortages = [...staffShortages];
    
    // Verificar si hay especialidades con saturación alta
    data.occupancy.specialties.forEach(specialty => {
      if (specialty.saturation > 80) {
        const existingShortage = currentShortages.find(
          s => s.hospitalId === data.hospitalId && s.specialty === specialty.name
        );
        
        if (!existingShortage && autoJobPostingEnabled) {
          // Crear automáticamente una oferta de trabajo
          triggerAutomaticJobPosting(data.hospitalId, specialty);
        }
      }
    });
  };

  const triggerAutomaticJobPosting = async (hospitalId: string, specialty: any) => {
    const newJobPosting: JobPosting = {
      id: `job-${hospitalId}-${specialty.name}-${Date.now()}`,
      shortageId: `auto-${hospitalId}-${specialty.name}`,
      title: `${specialty.name} - URGENTE`,
      specialty: specialty.name,
      hospitalName: 'Hospital Central', // En producción obtener nombre real
      urgencyLevel: specialty.saturation > 90 ? 'critical' : 'urgent',
      positions: Math.ceil(specialty.saturation / 20), // Calcular posiciones necesarias
      salaryRange: '$15,000 - $25,000 MXN',
      benefits: [
        'Seguro de gastos médicos mayores',
        'Fondo de ahorro',
        'Capacitación continua',
        'Horarios flexibles'
      ],
      requirements: [
        'Cédula profesional vigente',
        `Especialidad en ${specialty.name}`,
        'Experiencia mínima 2 años',
        'Disponibilidad inmediata'
      ],
      status: 'published',
      postedAt: new Date(),
      applicationsCount: 0
    };
    
    setJobPostings(prev => [...prev, newJobPosting]);
    
    // Marcar que se activó job posting automático para el déficit
    setStaffShortages(prev => 
      prev.map(s => 
        s.hospitalId === hospitalId && s.specialty === specialty.name 
          ? { ...s, autoJobPostingTriggered: true }
          : s
      )
    );
    
    // En producción: await jobMarketplaceAPI.createUrgentPosting(newJobPosting);
  };



  // 🗺️ Funciones para el mapa
  const convertRedistributionSuggestionsForMap = (): MapRoute[] => {
    return redistributionSuggestions.map<MapRoute | null>(suggestion => {
      const fromHospital = mapHospitals.find(h => h.id === suggestion.fromHospitalId);
      const toHospital = mapHospitals.find(h => h.id === suggestion.toHospitalId);
      
      if (!fromHospital || !toHospital) return null;
      
      return {
        id: suggestion.id,
        fromHospital,
        toHospital,
        patientsToTransfer: suggestion.patientsToTransfer,
        status: suggestion.status,
        priority: suggestion.priority,
        estimatedTime: suggestion.estimatedTime,
        progress: suggestion.status === 'executing' ? Math.floor(Math.random() * 80) + 10 : undefined
      } as MapRoute;
    }).filter((r): r is MapRoute => r !== null);
  };

  const handleHospitalSelectOnMap = (hospital: MapHospital) => {
    setSelectedHospitalOnMap(hospital);
    logger.info('Hospital seleccionado en mapa:', hospital);
  };

  const handleRouteSelectOnMap = (route: any) => {
    logger.info('Ruta seleccionada en mapa:', route);
  };

  const getDataSourceIcon = () => {
    switch (metrics?.dataQuality.source) {
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      case 'api': return <Wifi className="h-4 w-4" />;
      case 'iot': return <Activity className="h-4 w-4" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getSaturationColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-50';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // 🎨 Solarized Dark Color Palette
  const solarizedColors = {
    base03: '#002b36', // Background principal
    base02: '#073642', // Background secundario
    base01: '#586e75', // Comentarios / content secundario
    base00: '#657b83', // Body text / default code
    base0: '#839496',  // Primary content
    base1: '#93a1a1',  // Comments / secondary content
    base2: '#eee8d5',  // Background highlights
    base3: '#fdf6e3',  // Background highlights
    yellow: '#b58900', // Variables
    orange: '#cb4b16', // Classes/Types
    red: '#dc322f',    // Errors
    magenta: '#d33682', // Numbers/Constants
    violet: '#6c71c4', // Keywords
    blue: '#268bd2',   // Functions
    cyan: '#2aa198',   // Strings
    green: '#859900'   // Operators/Keywords
  };

  // Aplicar estilos Solarized con clases CSS personalizadas
  const containerStyle: CSSProperties = {
    minHeight: '100vh',
    backgroundColor: isDarkMode ? solarizedColors.base03 : solarizedColors.base3,
    color: isDarkMode ? solarizedColors.base0 : solarizedColors.base00,
    transition: 'all 0.5s ease-in-out',
    fontFamily: '"Inter", "SF Pro Text", system-ui, sans-serif'
  };

  const headerStyle: CSSProperties = {
    backgroundColor: isDarkMode ? `${solarizedColors.base02}F2` : `${solarizedColors.base2}E6`,
    borderColor: isDarkMode ? `${solarizedColors.base01}4D` : `${solarizedColors.base01}33`,
    color: isDarkMode ? solarizedColors.base1 : solarizedColors.base01,
    backdropFilter: 'blur(8px)'
  };

  // Additional component styles
  const hospitalCardStyle: CSSProperties = {
    backgroundColor: isDarkMode ? solarizedColors.base02 : solarizedColors.base2,
    borderColor: isDarkMode ? solarizedColors.base01 : solarizedColors.base1,
    color: isDarkMode ? solarizedColors.base0 : solarizedColors.base00,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '0.75rem',
    transition: 'all 0.3s ease',
    boxShadow: isDarkMode ? `0 4px 20px ${solarizedColors.base03}40` : `0 4px 20px ${solarizedColors.base01}20`
  };

  const badgeStyle: CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: '600',
    padding: '0.25rem 0.75rem',
    borderRadius: '0.375rem',
    fontFamily: '"Fira Code", monospace'
  };

  const criticalBadgeStyle: CSSProperties = {
    ...badgeStyle,
    backgroundColor: `${solarizedColors.red}20`,
    color: solarizedColors.red,
    border: `1px solid ${solarizedColors.red}40`
  };

  const warningBadgeStyle: CSSProperties = {
    ...badgeStyle,
    backgroundColor: `${solarizedColors.orange}20`,
    color: solarizedColors.orange,
    border: `1px solid ${solarizedColors.orange}40`
  };

  const successBadgeStyle: CSSProperties = {
    ...badgeStyle,
    backgroundColor: `${solarizedColors.green}20`,
    color: solarizedColors.green,
    border: `1px solid ${solarizedColors.green}40`
  };

  const infoBadgeStyle: CSSProperties = {
    ...badgeStyle,
    backgroundColor: `${solarizedColors.blue}20`,
    color: solarizedColors.blue,
    border: `1px solid ${solarizedColors.blue}40`
  };

  const titleStyle: CSSProperties = {
    color: isDarkMode ? solarizedColors.base1 : solarizedColors.base01,
    fontSize: '1.125rem',
    fontWeight: '600',
    fontFamily: '"Inter", system-ui, sans-serif'
  };

  const subtitleStyle: CSSProperties = {
    color: isDarkMode ? solarizedColors.base01 : solarizedColors.base1,
    fontSize: '0.875rem',
    fontFamily: '"Inter", system-ui, sans-serif'
  };

  return (
    <div style={containerStyle}>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header mejorado con controles */}
      <div className="rounded-2xl border p-6 shadow-lg transition-all duration-500" style={headerStyle}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className={`text-3xl font-bold tracking-wide leading-tight transition-all duration-300 ${
                isDarkMode 
                  ? `bg-gradient-to-r from-[${solarizedColors.blue}] to-[${solarizedColors.cyan}] bg-clip-text text-transparent`
                  : `bg-gradient-to-r from-[${solarizedColors.blue}] to-[${solarizedColors.violet}] bg-clip-text text-transparent`
              }`} style={{
                fontFamily: '"Fira Code", "JetBrains Mono", "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace',
                fontWeight: '600',
                letterSpacing: '0.02em',
                textShadow: isDarkMode ? `0 0 20px ${solarizedColors.blue}40` : 'none'
              }}>
                🏥 Centro de Control Hospitalario
              </h1>
              <p className={`mt-2 text-sm transition-colors duration-300 font-medium tracking-wide ${
                isDarkMode 
                  ? `text-[${solarizedColors.base01}]` 
                  : `text-[${solarizedColors.base00}]`
              }`} style={{
                fontFamily: '"Inter", "SF Pro Text", "Segoe UI", system-ui, sans-serif',
                letterSpacing: '0.01em'
              }}>
                <span className={`${isDarkMode ? `text-[${solarizedColors.green}]` : `text-[${solarizedColors.blue}]`}`}>
                  Red AltaMedica
                </span>
                {' • '}
                <span className={`${isDarkMode ? `text-[${solarizedColors.yellow}]` : `text-[${solarizedColors.orange}]`} font-bold`}>
                  {networkStatus.total}
                </span>
                {' hospitales conectados'}
              </p>
            </div>
            {emergencyMode && (
              <div className="animate-pulse">
                <Badge className={`px-4 py-2 text-sm font-bold tracking-wide border-2 transition-all duration-300`}
                       style={{
                         backgroundColor: isDarkMode ? `${solarizedColors.red}30` : `${solarizedColors.red}20`,
                         color: solarizedColors.red,
                         borderColor: solarizedColors.red,
                         fontFamily: '"JetBrains Mono", "SF Mono", "Monaco", monospace',
                         textShadow: `0 0 10px ${solarizedColors.red}80`,
                         boxShadow: `0 0 20px ${solarizedColors.red}40, inset 0 1px 0 ${solarizedColors.red}60`
                       }}>
                  🚨 MODO EMERGENCIA
                </Badge>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={isDarkMode 
                ? `transition-all duration-500 bg-[${solarizedColors.base02}] border-[${solarizedColors.base01}] hover:bg-[${solarizedColors.base01}] text-[${solarizedColors.base1}] hover:text-[${solarizedColors.yellow}]`
                : `transition-all duration-500 bg-[${solarizedColors.base2}] border-[${solarizedColors.base01}] hover:bg-[${solarizedColors.base3}] text-[${solarizedColors.base01}] hover:text-[${solarizedColors.blue}]`
              }
              style={{
                fontFamily: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsCompactView(!isCompactView)}
              className={isDarkMode 
                ? `transition-all duration-500 bg-[${solarizedColors.base02}] border-[${solarizedColors.base01}] hover:bg-[${solarizedColors.base01}] text-[${solarizedColors.base1}] hover:text-[${solarizedColors.cyan}]`
                : `transition-all duration-500 bg-[${solarizedColors.base2}] border-[${solarizedColors.base01}] hover:bg-[${solarizedColors.base3}] text-[${solarizedColors.base01}] hover:text-[${solarizedColors.violet}]`
              }
              style={{
                fontFamily: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace'
              }}
            >
              {isCompactView ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadHospitalData}
              disabled={loading}
              className={isDarkMode 
                ? `flex items-center gap-2 transition-all duration-500 bg-[${solarizedColors.base02}] border-[${solarizedColors.base01}] hover:bg-[${solarizedColors.base01}] text-[${solarizedColors.base1}] ${loading ? `text-[${solarizedColors.yellow}]` : `hover:text-[${solarizedColors.green}]`} disabled:opacity-60`
                : `flex items-center gap-2 transition-all duration-500 bg-[${solarizedColors.base2}] border-[${solarizedColors.base01}] hover:bg-[${solarizedColors.base3}] text-[${solarizedColors.base01}] ${loading ? `text-[${solarizedColors.orange}]` : `hover:text-[${solarizedColors.green}]`} disabled:opacity-60`
              }
              style={{
                fontFamily: '"Inter", "SF Pro Text", system-ui, sans-serif',
                fontWeight: '500',
                letterSpacing: '0.005em'
              }}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} style={{
                color: loading ? (isDarkMode ? solarizedColors.yellow : solarizedColors.orange) : 'inherit'
              }} />
              <span className="text-xs font-medium">
                {loading ? 'Actualizando...' : 'Actualizar'}
              </span>
            </Button>
            
            <Button 
              size="sm"
              className={`transition-all duration-500 shadow-lg hover:shadow-xl ${
                isDarkMode 
                  ? `bg-gradient-to-r from-[${solarizedColors.blue}] to-[${solarizedColors.cyan}] hover:from-[${solarizedColors.cyan}] hover:to-[${solarizedColors.blue}] text-[${solarizedColors.base03}]`
                  : `bg-gradient-to-r from-[${solarizedColors.blue}] to-[${solarizedColors.violet}] hover:from-[${solarizedColors.violet}] hover:to-[${solarizedColors.blue}] text-[${solarizedColors.base3}]`
              }`}
              style={{
                fontFamily: '"Inter", "SF Pro Text", system-ui, sans-serif',
                fontWeight: '600',
                letterSpacing: '0.01em'
              }}
            >
              <Settings className={`h-4 w-4 mr-2`} />
              <span className="text-xs">Config</span>
            </Button>
          </div>
        </div>

        {/* Estado de la red con diseño mejorado */}
        <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${isCompactView ? 'gap-2' : 'gap-4'}`}>
          <Card className={`group hover:scale-105 transform transition-all duration-500 overflow-hidden shadow-lg hover:shadow-xl ${
            isDarkMode 
              ? `bg-gradient-to-br from-[${solarizedColors.base02}] to-[${solarizedColors.base03}] border-[${solarizedColors.green}]/30` 
              : `bg-gradient-to-br from-[${solarizedColors.base2}] to-[${solarizedColors.base3}] border-[${solarizedColors.green}]/40`
          }`} style={{
            boxShadow: isDarkMode ? `0 4px 20px ${solarizedColors.green}20` : `0 4px 20px ${solarizedColors.green}15`
          }}>
            <CardContent className={`p-4 relative ${isCompactView ? 'p-3' : 'p-4'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-semibold tracking-wide transition-colors duration-300`} 
                     style={{
                       color: isDarkMode ? solarizedColors.green : solarizedColors.green,
                       fontFamily: '"Inter", "SF Pro Text", system-ui, sans-serif',
                       letterSpacing: '0.02em'
                     }}>
                    Red Saludable
                  </p>
                  <p className={`text-2xl font-bold transition-colors duration-300`}
                     style={{
                       color: isDarkMode ? solarizedColors.base1 : solarizedColors.base01,
                       fontFamily: '"JetBrains Mono", "SF Mono", "Monaco", monospace',
                       letterSpacing: '-0.01em'
                     }}>
                    {networkStatus.healthy}%
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-12`} 
                     style={{
                       backgroundColor: isDarkMode ? `${solarizedColors.green}20` : `${solarizedColors.green}15`,
                       boxShadow: `0 0 15px ${solarizedColors.green}40`
                     }}>
                  <Activity className={`h-6 w-6 transition-colors duration-300`} 
                           style={{ color: solarizedColors.green }} />
                </div>
              </div>
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent transition-opacity duration-500 opacity-0 group-hover:opacity-100`}
                   style={{ 
                     background: `linear-gradient(to right, transparent, ${solarizedColors.green}08)`
                   }} />
            </CardContent>
          </Card>

          <Card className={`group hover:scale-105 transform transition-all duration-500 overflow-hidden shadow-lg hover:shadow-xl ${
            isDarkMode 
              ? `bg-gradient-to-br from-[${solarizedColors.base02}] to-[${solarizedColors.base03}] border-[${solarizedColors.yellow}]/30` 
              : `bg-gradient-to-br from-[${solarizedColors.base2}] to-[${solarizedColors.base3}] border-[${solarizedColors.yellow}]/40`
          }`} style={{
            boxShadow: isDarkMode ? `0 4px 20px ${solarizedColors.yellow}20` : `0 4px 20px ${solarizedColors.yellow}15`
          }}>
            <CardContent className={`p-4 relative ${isCompactView ? 'p-3' : 'p-4'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-semibold tracking-wide transition-colors duration-300`} 
                     style={{
                       color: isDarkMode ? solarizedColors.yellow : solarizedColors.yellow,
                       fontFamily: '"Inter", "SF Pro Text", system-ui, sans-serif',
                       letterSpacing: '0.02em'
                     }}>
                    Atención Requerida
                  </p>
                  <p className={`text-2xl font-bold transition-colors duration-300`}
                     style={{
                       color: isDarkMode ? solarizedColors.base1 : solarizedColors.base01,
                       fontFamily: '"JetBrains Mono", "SF Mono", "Monaco", monospace',
                       letterSpacing: '-0.01em'
                     }}>
                    {networkStatus.warning}%
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-12`} 
                     style={{
                       backgroundColor: isDarkMode ? `${solarizedColors.yellow}20` : `${solarizedColors.yellow}15`,
                       boxShadow: `0 0 15px ${solarizedColors.yellow}40`
                     }}>
                  <AlertTriangle className={`h-6 w-6 transition-colors duration-300`} 
                           style={{ color: solarizedColors.yellow }} />
                </div>
              </div>
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent transition-opacity duration-500 opacity-0 group-hover:opacity-100`}
                   style={{ 
                     background: `linear-gradient(to right, transparent, ${solarizedColors.yellow}08)`
                   }} />
            </CardContent>
          </Card>

          <Card className={`group hover:scale-105 transform transition-all duration-500 overflow-hidden shadow-lg hover:shadow-xl ${
            isDarkMode 
              ? `bg-gradient-to-br from-[${solarizedColors.base02}] to-[${solarizedColors.base03}] border-[${solarizedColors.red}]/30` 
              : `bg-gradient-to-br from-[${solarizedColors.base2}] to-[${solarizedColors.base3}] border-[${solarizedColors.red}]/40`
          }`} style={{
            boxShadow: isDarkMode ? `0 4px 20px ${solarizedColors.red}20` : `0 4px 20px ${solarizedColors.red}15`
          }}>
            <CardContent className={`p-4 relative ${isCompactView ? 'p-3' : 'p-4'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-semibold tracking-wide transition-colors duration-300`} 
                     style={{
                       color: isDarkMode ? solarizedColors.red : solarizedColors.red,
                       fontFamily: '"Inter", "SF Pro Text", system-ui, sans-serif',
                       letterSpacing: '0.02em'
                     }}>
                    Saturación Crítica
                  </p>
                  <p className={`text-2xl font-bold transition-colors duration-300`}
                     style={{
                       color: isDarkMode ? solarizedColors.base1 : solarizedColors.base01,
                       fontFamily: '"JetBrains Mono", "SF Mono", "Monaco", monospace',
                       letterSpacing: '-0.01em'
                     }}>
                    {networkStatus.critical}%
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-12`} 
                     style={{
                       backgroundColor: isDarkMode ? `${solarizedColors.red}20` : `${solarizedColors.red}15`,
                       boxShadow: `0 0 15px ${solarizedColors.red}40`
                     }}>
                  <AlertTriangle className={`h-6 w-6 transition-colors duration-300`} 
                           style={{ color: solarizedColors.red }} />
                </div>
              </div>
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent transition-opacity duration-500 opacity-0 group-hover:opacity-100`}
                   style={{ 
                     background: `linear-gradient(to right, transparent, ${solarizedColors.red}08)`
                   }} />
            </CardContent>
          </Card>

          <Card className={`group hover:scale-105 transform transition-all duration-500 overflow-hidden shadow-lg hover:shadow-xl ${
            isDarkMode 
              ? `bg-gradient-to-br from-[${solarizedColors.base02}] to-[${solarizedColors.base03}] border-[${solarizedColors.blue}]/30` 
              : `bg-gradient-to-br from-[${solarizedColors.base2}] to-[${solarizedColors.base3}] border-[${solarizedColors.blue}]/40`
          }`} style={{
            boxShadow: isDarkMode ? `0 4px 20px ${solarizedColors.blue}20` : `0 4px 20px ${solarizedColors.blue}15`
          }}>
            <CardContent className={`p-4 relative ${isCompactView ? 'p-3' : 'p-4'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-semibold tracking-wide transition-colors duration-300`} 
                     style={{
                       color: isDarkMode ? solarizedColors.blue : solarizedColors.blue,
                       fontFamily: '"Inter", "SF Pro Text", system-ui, sans-serif',
                       letterSpacing: '0.02em'
                     }}>
                    Hospitales en Red
                  </p>
                  <p className={`text-2xl font-bold transition-colors duration-300`}
                     style={{
                       color: isDarkMode ? solarizedColors.base1 : solarizedColors.base01,
                       fontFamily: '"JetBrains Mono", "SF Mono", "Monaco", monospace',
                       letterSpacing: '-0.01em'
                     }}>
                    {networkStatus.total}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-12`} 
                     style={{
                       backgroundColor: isDarkMode ? `${solarizedColors.blue}20` : `${solarizedColors.blue}15`,
                       boxShadow: `0 0 15px ${solarizedColors.blue}40`
                     }}>
                  <Building2 className={`h-6 w-6 transition-colors duration-300`} 
                           style={{ color: solarizedColors.blue }} />
                </div>
              </div>
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent transition-opacity duration-500 opacity-0 group-hover:opacity-100`}
                   style={{ 
                     background: `linear-gradient(to right, transparent, ${solarizedColors.blue}08)`
                   }} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Métricas del Hospital */}
      {metrics && (
        <>
          {/* Ocupación y Pacientes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div style={hospitalCardStyle}>
              <div style={{ padding: '1.5rem', borderBottom: `1px solid ${isDarkMode ? solarizedColors.base01 : solarizedColors.base1}` }}>
                <div className="flex items-center justify-between">
                  <h3 style={titleStyle}>Ocupación Hospitalaria</h3>
                  <div style={{
                    ...(metrics.occupancy.beds.percentage >= 90 ? criticalBadgeStyle : 
                       metrics.occupancy.beds.percentage >= 75 ? warningBadgeStyle : successBadgeStyle)
                  }}>
                    {metrics.occupancy.beds.percentage}%
                  </div>
                </div>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span style={subtitleStyle}>Camas Totales</span>
                    <span style={{
                      fontWeight: '600',
                      color: isDarkMode ? solarizedColors.base0 : solarizedColors.base00,
                      fontFamily: '"JetBrains Mono", monospace'
                    }}>{metrics.occupancy.beds.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={subtitleStyle}>Camas Ocupadas</span>
                    <span style={{
                      fontWeight: '600',
                      color: solarizedColors.red,
                      fontFamily: '"JetBrains Mono", monospace'
                    }}>{metrics.occupancy.beds.occupied}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={subtitleStyle}>Camas Disponibles</span>
                    <span style={{
                      fontWeight: '600',
                      color: solarizedColors.green,
                      fontFamily: '"JetBrains Mono", monospace'
                    }}>{metrics.occupancy.beds.available}</span>
                  </div>
                  <div style={{
                    width: '100%',
                    backgroundColor: isDarkMode ? solarizedColors.base01 : solarizedColors.base1,
                    borderRadius: '9999px',
                    height: '10px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '10px',
                      borderRadius: '9999px',
                      width: `${metrics.occupancy.beds.percentage}%`,
                      backgroundColor: 
                        metrics.occupancy.beds.percentage >= 90 ? solarizedColors.red : 
                        metrics.occupancy.beds.percentage >= 75 ? solarizedColors.orange : 
                        solarizedColors.green,
                      transition: 'all 0.3s ease'
                    }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div style={hospitalCardStyle}>
              <div style={{ padding: '1.5rem', borderBottom: `1px solid ${isDarkMode ? solarizedColors.base01 : solarizedColors.base1}` }}>
                <div className="flex items-center justify-between">
                  <h3 style={titleStyle}>Urgencias</h3>
                  <div className="flex items-center gap-2">
                    <Clock style={{ width: '1rem', height: '1rem', color: isDarkMode ? solarizedColors.base01 : solarizedColors.base1 }} />
                    <span style={{
                      fontSize: '0.875rem',
                      color: isDarkMode ? solarizedColors.base01 : solarizedColors.base1,
                      fontFamily: '"Inter", system-ui, sans-serif'
                    }}>
                      {metrics.occupancy.emergency.averageWaitTime} min promedio
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span style={subtitleStyle}>Pacientes Esperando</span>
                    <span style={{
                      fontWeight: '600',
                      color: solarizedColors.yellow,
                      fontFamily: '"JetBrains Mono", monospace'
                    }}>{metrics.occupancy.emergency.waiting}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={subtitleStyle}>Casos Críticos</span>
                    <span style={{
                      fontWeight: '600',
                      color: solarizedColors.red,
                      fontFamily: '"JetBrains Mono", monospace',
                      animation: metrics.occupancy.emergency.critical > 0 ? 'pulse 2s infinite' : 'none'
                    }}>{metrics.occupancy.emergency.critical}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={subtitleStyle}>Personal Activo</span>
                    <span style={{
                      fontWeight: '600',
                      color: solarizedColors.blue,
                      fontFamily: '"JetBrains Mono", monospace'
                    }}>{metrics.staff.active}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fuente de Datos y Calidad */}
          <Card>
            <CardHeader>
              <CardTitle>Calidad de Datos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getDataSourceIcon()}
                    <span className="text-sm font-medium capitalize">
                      Fuente: {metrics.dataQuality.source}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-blue-600">
                    Confianza: {metrics.dataQuality.confidence}%
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  Última actualización: {lastUpdate.toLocaleTimeString()}
                </div>
              </div>

              {/* Indicadores de integración */}
              <div className="mt-4 flex gap-4">
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full text-xs",
                  config.whatsapp.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                )}>
                  <MessageSquare className="h-3 w-3" />
                  WhatsApp
                </div>
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full text-xs",
                  config.api.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                )}>
                  <Wifi className="h-3 w-3" />
                  API REST
                </div>
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full text-xs",
                  config.iot.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                )}>
                  <Activity className="h-3 w-3" />
                  IoT Sensors
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 🎛️ SYSTEM CONTROLS con botón desplegable */}
          <Card className={cn(
            "border-2 transition-all duration-300", 
            emergencyMode 
              ? (isDarkMode ? "border-red-500 bg-red-900/20" : "border-red-500 bg-red-50") 
              : (isDarkMode ? "border-blue-700 bg-blue-900/20" : "border-blue-200 bg-blue-50")
          )}>
            <CardHeader>
              <CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => toggleSection('controls')}
                  className={`w-full justify-between p-0 h-auto ${
                    isDarkMode ? 'text-white hover:bg-slate-700/50' : 'text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {emergencyMode ? (
                      <>
                        <Zap className={`h-5 w-5 animate-pulse ${
                          isDarkMode ? 'text-red-400' : 'text-red-600'
                        }`} />
                        <span className={`text-lg font-semibold ${
                          isDarkMode ? 'text-red-300' : 'text-red-700'
                        }`}>🚨 MODO EMERGENCIA ACTIVADO</span>
                      </>
                    ) : (
                      <>
                        <Activity className={`h-5 w-5 ${
                          isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        }`} />
                        <span className={`text-lg font-semibold ${
                          isDarkMode ? 'text-slate-200' : 'text-slate-900'
                        }`}>🎛️ Sistema de Control Inteligente</span>
                      </>
                    )}
                  </div>
                  {expandedSections.controls ? 
                    <ChevronUp className="h-5 w-5" /> : 
                    <ChevronDown className="h-5 w-5" />
                  }
                </Button>
              </CardTitle>
            </CardHeader>
            {expandedSections.controls && (
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={autoRedistributionEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAutoRedistributionEnabled(!autoRedistributionEnabled)}
                    className={`text-xs transition-all duration-300 ${
                      autoRedistributionEnabled 
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' 
                        : (isDarkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-slate-300 hover:bg-slate-50')
                    }`}
                  >
                    🔄 Redistribución Auto: {autoRedistributionEnabled ? 'ON' : 'OFF'}
                  </Button>
                  <Button 
                    variant={autoJobPostingEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAutoJobPostingEnabled(!autoJobPostingEnabled)}
                    className={`text-xs transition-all duration-300 ${
                      autoJobPostingEnabled 
                        ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg' 
                        : (isDarkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-slate-300 hover:bg-slate-50')
                    }`}
                  >
                    💼 Vacantes Auto: {autoJobPostingEnabled ? 'ON' : 'OFF'}
                  </Button>
                  <Button 
                    variant={showMapView ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowMapView(!showMapView)}
                    className={`text-xs transition-all duration-300 ${
                      showMapView 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' 
                        : (isDarkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-slate-300 hover:bg-slate-50')
                    }`}
                  >
                    <MapIcon className="h-3 w-3 mr-1" />
                    🗺️ Mapa: {showMapView ? 'ON' : 'OFF'}
                  </Button>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-4 ${
                  isCompactView ? 'gap-2' : 'gap-4'
                }`}>
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                    <span>{redistributionSuggestions.length} redistribuciones pendientes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserX className="h-4 w-4 text-red-600" />
                    <span>{staffShortages.length} déficits de personal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BriefcaseMedical className="h-4 w-4 text-green-600" />
                    <span>{jobPostings.length} vacantes publicadas</span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* 🗺️ INTERACTIVE REDISTRIBUTION MAP */}
          {showMapView && mapHospitals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapIcon className="h-5 w-5 text-green-600" />
                  Mapa Interactivo de Redistribución Hospitalaria
                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">
                    Tiempo Real
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Información del hospital seleccionado */}
                  {selectedHospitalOnMap && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">
                        🏥 {selectedHospitalOnMap.name}
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700">Ocupación:</span>
                          <span className="ml-1 font-bold">
                            {Math.round((selectedHospitalOnMap.currentCapacity / selectedHospitalOnMap.maxCapacity) * 100)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-700">En espera:</span>
                          <span className="ml-1 font-bold">{selectedHospitalOnMap.waitingPatients}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Emergencias:</span>
                          <span className="ml-1 font-bold text-red-600">{selectedHospitalOnMap.emergencyPatients}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Estado:</span>
                          <span className={`ml-1 font-bold ${
                            selectedHospitalOnMap.status === 'saturated' ? 'text-red-600' :
                            selectedHospitalOnMap.status === 'critical' ? 'text-orange-600' :
                            selectedHospitalOnMap.status === 'warning' ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {selectedHospitalOnMap.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mapa de redistribución */}
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <HospitalRedistributionMap
                      hospitals={mapHospitals}
                      redistributionRoutes={convertRedistributionSuggestionsForMap()}
                      staffShortages={staffShortages.map<MapStaffShortage>(s => ({
                        hospitalId: s.hospitalId,
                        hospitalName: s.hospitalName,
                        role: s.specialty,
                        shortage: s.shortage,
                        severity: s.severity,
                        autoJobPostingTriggered: s.autoJobPostingTriggered
                      }))}
                      onHospitalSelect={handleHospitalSelectOnMap}
                      onRouteSelect={handleRouteSelectOnMap}
                      showRedistributionRoutes={true}
                      showStaffShortages={true}
                      emergencyMode={emergencyMode}
                      autoRefresh={true}
                    />
                  </div>

                  {/* Estadísticas del mapa */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <div className="font-bold text-lg text-green-600">
                        {mapHospitals.filter(h => h.status === 'normal').length}
                      </div>
                      <div className="text-green-700 text-xs">Hospitales Normales</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg text-center">
                      <div className="font-bold text-lg text-yellow-600">
                        {mapHospitals.filter(h => h.status === 'warning').length}
                      </div>
                      <div className="text-yellow-700 text-xs">En Advertencia</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg text-center">
                      <div className="font-bold text-lg text-orange-600">
                        {mapHospitals.filter(h => h.status === 'critical').length}
                      </div>
                      <div className="text-orange-700 text-xs">Estado Crítico</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg text-center">
                      <div className="font-bold text-lg text-red-600">
                        {mapHospitals.filter(h => h.status === 'saturated').length}
                      </div>
                      <div className="text-red-700 text-xs">Saturados</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 🔄 PATIENT REDISTRIBUTION SUGGESTIONS */}
          {redistributionSuggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                  Sugerencias de Redistribución Inteligente
                  <Badge variant="outline" className="ml-2">
                    {redistributionSuggestions.filter(s => s.status === 'pending').length} pendientes
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {redistributionSuggestions.map(suggestion => (
                    <div 
                      key={suggestion.id} 
                      className={cn(
                        "border rounded-lg p-4 transition-all duration-200",
                        suggestion.priority === 'critical' ? "border-red-300 bg-red-50" :
                        suggestion.priority === 'high' ? "border-orange-300 bg-orange-50" :
                        suggestion.priority === 'medium' ? "border-yellow-300 bg-yellow-50" :
                        "border-gray-300 bg-gray-50",
                        suggestion.status === 'executing' && "animate-pulse"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={cn(
                              "text-xs font-medium",
                              suggestion.priority === 'critical' ? "bg-red-100 text-red-800" :
                              suggestion.priority === 'high' ? "bg-orange-100 text-orange-800" :
                              suggestion.priority === 'medium' ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            )}>
                              {suggestion.priority.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className={cn(
                              "text-xs",
                              suggestion.status === 'pending' ? "bg-blue-50 text-blue-700" :
                              suggestion.status === 'executing' ? "bg-yellow-50 text-yellow-700" :
                              suggestion.status === 'completed' ? "bg-green-50 text-green-700" :
                              "bg-red-50 text-red-700"
                            )}>
                              {suggestion.status === 'pending' ? '⏳ Pendiente' :
                               suggestion.status === 'executing' ? '🔄 Ejecutando' :
                               suggestion.status === 'completed' ? '✅ Completado' :
                               '❌ Fallido'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <h4 className="font-medium mb-1">Redistribución Propuesta</h4>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">De:</span>
                                  <span className="font-medium">{suggestion.fromHospitalName}</span>
                                  <span className="text-red-600 text-xs">↗ Saturado</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">A:</span>
                                  <span className="font-medium">{suggestion.toHospitalName}</span>
                                  <span className="text-green-600 text-xs">↘ Capacidad disponible</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">Pacientes:</span>
                                  <span className="font-bold text-blue-600">{suggestion.patientsToTransfer}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-1">Detalles de Ejecución</h4>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs">Tiempo estimado: {suggestion.estimatedTime} min</span>
                                </div>
                                <div className="text-xs text-gray-600">
                                  <span className="font-medium">Motivo:</span> {suggestion.reason}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Detectado: {suggestion.createdAt.toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-4 flex flex-col gap-2">
                          {suggestion.status === 'pending' && (
                            <Button
                              onClick={() => executeRedistribution(suggestion.id)}
                              disabled={activeRedistributions.has(suggestion.id)}
                              size="sm"
                              className={cn(
                                "px-4 py-2 text-xs",
                                suggestion.priority === 'critical' 
                                  ? "bg-red-600 hover:bg-red-700" 
                                  : "bg-blue-600 hover:bg-blue-700"
                              )}
                            >
                              {activeRedistributions.has(suggestion.id) ? (
                                <>
                                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                  Ejecutando...
                                </>
                              ) : (
                                '🚀 Ejecutar Ahora'
                              )}
                            </Button>
                          )}
                          {suggestion.status === 'completed' && (
                            <div className="text-center">
                              <CheckCircle className="h-6 w-6 text-green-600 mx-auto" />
                              <span className="text-xs text-green-600 font-medium">Completado</span>
                            </div>
                          )}
                          {suggestion.status === 'failed' && (
                            <div className="text-center">
                              <XCircle className="h-6 w-6 text-red-600 mx-auto" />
                              <span className="text-xs text-red-600 font-medium">Error</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 👨‍⚕️ STAFF SHORTAGE & AUTOMATIC JOB POSTING */}
          {staffShortages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserX className="h-5 w-5 text-red-600" />
                  Déficits de Personal Detectados
                  <Badge variant="outline" className="ml-2 bg-red-50 text-red-700">
                    {staffShortages.filter(s => s.severity === 'critical').length} críticos
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staffShortages.map(shortage => (
                    <div 
                      key={shortage.id}
                      className={cn(
                        "border rounded-lg p-4",
                        shortage.severity === 'critical' ? "border-red-300 bg-red-50" :
                        shortage.severity === 'urgent' ? "border-orange-300 bg-orange-50" :
                        "border-yellow-300 bg-yellow-50"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{shortage.hospitalName}</h3>
                            <Badge className={cn(
                              "text-xs",
                              shortage.severity === 'critical' ? "bg-red-100 text-red-800" :
                              shortage.severity === 'urgent' ? "bg-orange-100 text-orange-800" :
                              "bg-yellow-100 text-yellow-800"
                            )}>
                              {shortage.severity.toUpperCase()}
                            </Badge>
                            {shortage.autoJobPostingTriggered && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                                🤖 Auto-publicado
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <h4 className="font-medium mb-2">Déficit de Personal</h4>
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Especialidad:</span>
                                  <span className="font-medium">{shortage.specialty}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Personal actual:</span>
                                  <span className="text-red-600 font-medium">{shortage.currentStaff}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Requerido:</span>
                                  <span className="font-medium">{shortage.requiredStaff}</span>
                                </div>
                                <div className="flex justify-between border-t pt-1">
                                  <span className="text-gray-600">Déficit:</span>
                                  <span className="font-bold text-red-700">{shortage.shortage} profesionales</span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Impacto Estimado</h4>
                              <div className="space-y-2">
                                <div className="text-xs text-gray-700 bg-white p-2 rounded">
                                  {shortage.impactDescription}
                                </div>
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-3 w-3 text-red-500" />
                                  <span className="text-xs">
                                    Aumento tiempo espera: <span className="font-bold text-red-600">{shortage.estimatedWaitIncrease}%</span>
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  Detectado: {shortage.detectedAt.toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <h5 className="text-xs font-medium text-gray-600 mb-1">ACCIONES SUGERIDAS</h5>
                            <div className="flex flex-wrap gap-1">
                              {shortage.suggestedActions.map((action, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {action}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-4 space-y-2 min-w-[120px]">
                          {!shortage.autoJobPostingTriggered && (
                            <Button
                              onClick={() => triggerAutomaticJobPosting(shortage.hospitalId, { name: shortage.specialty, saturation: 95 })}
                              size="sm"
                              className="w-full bg-green-600 hover:bg-green-700 text-xs"
                            >
                              🚀 Publicar Vacante
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs"
                          >
                            📋 Ver Detalles
                          </Button>
                          {shortage.autoJobPostingTriggered && (
                            <div className="text-center text-xs">
                              <div className="text-green-600 font-medium">✅ Publicado</div>
                              <div className="text-gray-500">en Marketplace</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 💼 ACTIVE JOB POSTINGS GENERATED */}
          {jobPostings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BriefcaseMedical className="h-5 w-5 text-green-600" />
                  Vacantes Publicadas Automáticamente
                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">
                    {jobPostings.length} activas
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jobPostings.map(posting => (
                    <div key={posting.id} className="border rounded-lg p-4 bg-green-50">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-sm">{posting.title}</h3>
                          <p className="text-xs text-gray-600">{posting.hospitalName}</p>
                        </div>
                        <Badge className={cn(
                          "text-xs",
                          posting.urgencyLevel === 'critical' ? "bg-red-100 text-red-800" :
                          posting.urgencyLevel === 'urgent' ? "bg-orange-100 text-orange-800" :
                          "bg-yellow-100 text-yellow-800"
                        )}>
                          {posting.urgencyLevel.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Posiciones:</span>
                          <span className="font-medium">{posting.positions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Salario:</span>
                          <span className="font-medium">{posting.salaryRange}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Aplicaciones:</span>
                          <span className="font-bold text-blue-600">{posting.applicationsCount}</span>
                        </div>
                        <div className="text-gray-500">
                          Publicado: {posting.postedAt.toLocaleTimeString()}
                        </div>
                      </div>
                      
                      <div className="mt-2 flex gap-1">
                        <Button size="sm" variant="outline" className="text-xs flex-1">
                          Ver Candidatos
                        </Button>
                        <Button size="sm" className="text-xs bg-blue-600 hover:bg-blue-700">
                          Editar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
      
      {/* 🔴 REAL-TIME STATUS INDICATOR mejorado */}
      <div className="fixed bottom-4 right-4 z-50">
        {emergencyMode ? (
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-xl shadow-2xl text-sm animate-pulse border border-red-400">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 animate-bounce" />
              <span className="font-medium">🚨 MODO EMERGENCIA - Sistema activado</span>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-xl text-sm shadow-2xl border border-green-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="font-medium">✨ Sistema activo - Monitoreo en tiempo real</span>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}