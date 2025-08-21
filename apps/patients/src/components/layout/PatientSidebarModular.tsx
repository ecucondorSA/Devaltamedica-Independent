// 🧭 SIDEBAR MODULAR ALTAMEDICA MEJORADO
// Navegación robusta con CSS corporativo y configuración dinámica
// CONSERVADOR: Preserva funcionalidad exacta, mejora robustez gradualmente

'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar, FileText, Pill, User, Heart, Activity, Bell, Settings, LogOut,
  Menu, X, Home, Video, Phone, Download, HelpCircle, Shield, AlertTriangle
} from 'lucide-react';
import { useAuth } from "@altamedica/auth';

import { logger } from '@altamedica/shared/services/logger.service';
// 📝 TIPOS ROBUSTOS PARA NAVEGACIÓN
export interface NavigationItem {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  description?: string;
  permission?: string;
  isExternal?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  hidden?: boolean;
  group?: 'primary' | 'secondary' | 'tools';
}

export interface SidebarConfig {
  brand?: {
    name: string;
    subtitle: string;
    icon?: React.ComponentType<{ className?: string }>;
  };
  showUserProfile?: boolean;
  collapsible?: boolean;
  persistState?: boolean;
  autoCollapse?: boolean;
  customItems?: NavigationItem[];
  hideDefaultItems?: string[];
  theme?: 'light' | 'dark' | 'corporate';
}

export interface SidebarProps {
  config?: SidebarConfig;
  className?: string;
  onNavigate?: (item: NavigationItem) => void;
  onError?: (error: Error) => void;
}

// 🛡️ ERROR BOUNDARY PARA SIDEBAR
class SidebarErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Sidebar Error:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-64 bg-white shadow-xl border-r border-gray-200 flex items-center justify-center p-6">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-4">Error en navegación</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="btn-secondary-altamedica text-xs px-3 py-1"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 🧭 CONFIGURACIÓN DE NAVEGACIÓN ROBUSTA
function useNavigationConfig(customConfig?: SidebarConfig): {
  primaryItems: NavigationItem[];
  secondaryItems: NavigationItem[];
  brand: SidebarConfig['brand'];
} {
  const defaultBrand = {
    name: 'AltaMedica',
    subtitle: 'Portal del Paciente',
    icon: Heart
  };

  const defaultPrimaryItems: NavigationItem[] = [
    {
      id: 'dashboard',
      name: 'Panel Principal',
      href: '/dashboard',
      icon: Home,
      description: 'Resumen de tu salud',
      group: 'primary'
    },
    {
      id: 'appointments',
      name: 'Mis Citas',
      href: '/appointments',
      icon: Calendar,
      badge: 2,
      description: 'Gestionar citas médicas',
      group: 'primary'
    },
    {
      id: 'medical-history',
      name: 'Historial Médico',
      href: '/medical-history',
      icon: FileText,
      description: 'Registros y resultados',
      group: 'primary'
    },
    {
      id: 'prescriptions',
      name: 'Prescripciones',
      href: '/prescriptions',
      icon: Pill,
      badge: 1,
      description: 'Medicamentos activos',
      group: 'primary'
    },
    {
      id: 'profile',
      name: 'Mi Perfil',
      href: '/profile',
      icon: User,
      description: 'Información personal',
      group: 'primary'
    },
    {
      id: 'health-metrics',
      name: 'Métricas de Salud',
      href: '/health-metrics',
      icon: Activity,
      description: 'Seguimiento vital',
      group: 'primary'
    },
    {
      id: 'telemedicine',
      name: 'Telemedicina',
      href: '/telemedicine',
      icon: Video,
      description: 'Consultas virtuales',
      group: 'primary'
    }
  ];

  const defaultSecondaryItems: NavigationItem[] = [
    {
      id: 'notifications',
      name: 'Notificaciones',
      href: '/notifications',
      icon: Bell,
      badge: 3,
      description: 'Alertas y recordatorios',
      group: 'secondary'
    },
    {
      id: 'downloads',
      name: 'Descargas',
      href: '/downloads',
      icon: Download,
      description: 'Documentos médicos',
      group: 'secondary'
    },
    {
      id: 'support',
      name: 'Soporte',
      href: '/support',
      icon: HelpCircle,
      description: 'Ayuda y contacto',
      group: 'secondary'
    },
    {
      id: 'settings',
      name: 'Configuración',
      href: '/settings',
      icon: Settings,
      description: 'Preferencias',
      group: 'secondary'
    }
  ];

  return useMemo(() => {
    const brand = { ...defaultBrand, ...customConfig?.brand };
    
    // Filtrar elementos ocultos por configuración
    const hideItems = customConfig?.hideDefaultItems || [];
    
    let primaryItems = defaultPrimaryItems.filter(item => !hideItems.includes(item.id));
    let secondaryItems = defaultSecondaryItems.filter(item => !hideItems.includes(item.id));
    
    // Agregar elementos personalizados
    if (customConfig?.customItems) {
      const customPrimary = customConfig.customItems.filter(item => item.group === 'primary');
      const customSecondary = customConfig.customItems.filter(item => item.group === 'secondary');
      
      primaryItems = [...primaryItems, ...customPrimary];
      secondaryItems = [...secondaryItems, ...customSecondary];
    }

    return { primaryItems, secondaryItems, brand };
  }, [customConfig]);
}

// 🔄 GESTIÓN DE ESTADO PERSISTENTE
function useSidebarState(config?: SidebarConfig) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const storageKey = 'altamedica-sidebar-state';

  // 💾 Cargar estado persistente
  useEffect(() => {
    if (config?.persistState && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const state = JSON.parse(saved);
          setIsCollapsed(state.isCollapsed || false);
        }
      } catch (error) {
        logger.warn('Error loading sidebar state:', error);
      }
    }
  }, [config?.persistState]);

  // 💾 Guardar estado persistente
  const saveState = useCallback((collapsed: boolean) => {
    if (config?.persistState && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ isCollapsed: collapsed }));
      } catch (error) {
        logger.warn('Error saving sidebar state:', error);
      }
    }
  }, [config?.persistState]);

  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(prev => {
      const newState = !prev;
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  const closeOnMobile = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    isCollapsed,
    toggleOpen,
    toggleCollapsed,
    closeOnMobile,
    setIsOpen
  };
}

// 🎯 COMPONENTE PRINCIPAL DEL SIDEBAR MEJORADO
export default function PatientSidebarModular({
  config,
  className = "",
  onNavigate,
  onError
}: SidebarProps) {
  const pathname = usePathname();
  const { authState, logout, checkPermission } = useAuth();
  const { primaryItems, secondaryItems, brand } = useNavigationConfig(config);
  const { isOpen, isCollapsed, toggleOpen, toggleCollapsed, closeOnMobile } = useSidebarState(config);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // 🔍 Función para determinar ruta activa (mejorada)
  const isActiveRoute = useCallback((href: string) => {
    if (pathname === href) return true;
    if (href !== '/' && pathname.startsWith(href + '/')) return true;
    return false;
  }, [pathname]);

  // 🚪 Manejo robusto del logout
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      closeOnMobile();
    } catch (error) {
      logger.error('Logout failed:', error);
      onError?.(error instanceof Error ? error : new Error('Logout failed'));
    }
  }, [logout, closeOnMobile, onError]);

  // 🧭 Renderizado de elementos de navegación
  const renderNavigationItem = useCallback((item: NavigationItem) => {
    const Icon = item.icon;
    const isActive = isActiveRoute(item.href);

    // Verificar permisos si es necesario
    if (item.permission && !checkPermission(item.permission)) {
      return null;
    }

    // Verificar si está oculto
    if (item.hidden) {
      return null;
    }

    const handleClick = () => {
      if (item.onClick) {
        item.onClick();
      }
      onNavigate?.(item);
      closeOnMobile();
    };

    const baseClasses = `
      group flex items-center px-3 py-3 text-sm font-medium rounded-xl
      transition-all duration-300 ease-in-out transform
      ${isCollapsed ? 'justify-center' : ''}
      ${item.disabled 
        ? 'opacity-50 cursor-not-allowed' 
        : 'hover:scale-105 active:scale-95'
      }
    `;

    const stateClasses = isActive 
      ? 'bg-gradient-primary-altamedica text-primary-altamedica border-r-4 border-secondary-altamedica shadow-md' 
      : 'text-gray-700 hover:bg-gradient-primary-altamedica hover:text-primary-altamedica hover:shadow-input';

    const content = (
      <>
        <Icon className={`
          flex-shrink-0 w-5 h-5 transition-colors duration-200
          ${isActive ? 'text-secondary-altamedica' : 'text-gray-400 group-hover:text-primary-altamedica'}
          ${isCollapsed ? '' : 'mr-3'}
        `} />
        {!isCollapsed && (
          <>
            <span className="flex-1 animate-fade-in-conservative">{item.name}</span>
            {item.badge && item.badge > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-danger rounded-full animate-pulse">
                {item.badge}
              </span>
            )}
          </>
        )}
      </>
    );

    if (item.isExternal || item.onClick) {
      return (
        <button
          key={item.id}
          onClick={handleClick}
          disabled={item.disabled}
          className={`${baseClasses} ${stateClasses} w-full text-left`}
          title={isCollapsed ? item.name : item.description}
        >
          {content}
        </button>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.href}
        onClick={handleClick}
        className={`${baseClasses} ${stateClasses}`}
        title={isCollapsed ? item.name : item.description}
      >
        {content}
      </Link>
    );
  }, [isActiveRoute, checkPermission, onNavigate, closeOnMobile, isCollapsed]);

  // 🔒 Cerrar sidebar al hacer clic fuera (solo móvil)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        window.innerWidth < 1024
      ) {
        closeOnMobile();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeOnMobile]);

  return (
    <SidebarErrorBoundary onError={onError}>
      {/* 📱 BOTÓN MÓVIL */}
      <button
        onClick={toggleOpen}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200"
        aria-label="Abrir menú de navegación"
      >
        {isOpen ? <X className="w-6 h-6 text-gray-600" /> : <Menu className="w-6 h-6 text-gray-600" />}
      </button>

      {/* 🌫️ OVERLAY MÓVIL */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 animate-fade-in-conservative"
          onClick={closeOnMobile}
          aria-hidden="true"
        />
      )}

      {/* 🧭 SIDEBAR PRINCIPAL */}
      <div 
        ref={sidebarRef}
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          ${isCollapsed ? 'w-20' : 'w-64'} bg-white shadow-2xl border-r border-gray-200
          transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col ${className}
        `}
      >
        {/* 🏥 HEADER CON BRANDING */}
        <div className={`p-6 border-b border-gray-200 bg-gradient-primary-altamedica ${isCollapsed ? 'px-3' : ''}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="bg-primary-altamedica rounded-xl p-2 shadow-lg">
              {brand.icon && <brand.icon className="w-6 h-6 text-white" />}
            </div>
            {!isCollapsed && (
              <div className="animate-fade-in-conservative">
                <h1 className="text-lg font-bold text-primary-altamedica">{brand.name}</h1>
                <p className="text-sm text-gray-600">{brand.subtitle}</p>
              </div>
            )}
          </div>
          
          {/* 🔧 BOTÓN DE COLAPSO (DESKTOP) */}
          {config?.collapsible && (
            <button
              onClick={toggleCollapsed}
              className="hidden lg:block absolute -right-3 top-8 w-6 h-6 bg-white border border-gray-200 rounded-full shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center"
              aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            >
              <Menu className={`w-3 h-3 text-gray-600 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {/* 👤 PERFIL USUARIO */}
        {config?.showUserProfile !== false && authState.user && (
          <div className={`p-4 border-b border-gray-200 bg-gradient-primary-altamedica ${isCollapsed ? 'px-2' : ''}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <div className="w-10 h-10 bg-secondary-altamedica rounded-full flex items-center justify-center shadow-md">
                <User className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0 animate-fade-in-conservative">
                  <p className="text-sm font-medium text-primary-altamedica truncate">
                    {authState.user.firstName} {authState.user.lastName}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {authState.user.email}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 🧭 NAVEGACIÓN PRINCIPAL */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {primaryItems.map(renderNavigationItem)}

          {/* 📋 SECCIÓN SECUNDARIA */}
          {secondaryItems.length > 0 && (
            <div className="pt-6 mt-6 border-t border-gray-200">
              {!isCollapsed && (
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 animate-fade-in-conservative">
                  Herramientas
                </h3>
              )}
              <div className="space-y-2">
                {secondaryItems.map(renderNavigationItem)}
              </div>
            </div>
          )}
        </nav>

        {/* 🚪 LOGOUT */}
        <div className={`p-4 border-t border-gray-200 bg-gradient-primary-altamedica ${isCollapsed ? 'px-2' : ''}`}>
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center px-3 py-3 text-sm font-medium text-gray-700 
              rounded-xl hover:bg-red-50 hover:text-danger transition-all duration-200 
              hover:scale-105 active:scale-95 shadow-sm hover:shadow-md
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title="Cerrar Sesión"
          >
            <LogOut className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
            {!isCollapsed && (
              <span className="animate-fade-in-conservative">Cerrar Sesión</span>
            )}
          </button>
        </div>
      </div>
    </SidebarErrorBoundary>
  );
}