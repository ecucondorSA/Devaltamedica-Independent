/**
 * 🧭 UNIFIED NAVIGATION COMPONENT
 * 
 * Componente de navegación unificado para todas las aplicaciones de AltaMedica
 * Soporta múltiples modos: navbar (horizontal), sidebar (vertical), mobile
 * 
 * Consolida:
 * - apps/doctors/src/components/navigation/Navbar.tsx
 * - apps/patients/src/components/layout/PatientSidebar.tsx
 * - apps/companies/src/components/navigation/CompanyNavigation.tsx
 * - apps/admin/src/components/layout/AdminLayout.tsx
 */

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../../lib/utils';
import {
  Home,
  Calendar,
  FileText,
  Users,
  Settings,
  Bell,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Briefcase,
  Activity,
  DollarSign,
  Shield,
  Heart,
  Pill,
  Video,
  Building,
  BarChart3,
  type LucideIcon
} from 'lucide-react';

// ============================================================================
// TIPOS
// ============================================================================

export interface NavigationItem {
  id: string;
  name: string;
  href: string;
  icon?: LucideIcon;
  badge?: number | string;
  description?: string;
  permission?: string;
  children?: NavigationItem[];
  onClick?: () => void;
}

export interface NavigationSection {
  id: string;
  title?: string;
  items: NavigationItem[];
}

export interface UnifiedNavigationProps {
  // Modo de visualización
  mode?: 'navbar' | 'sidebar' | 'mobile';
  
  // Datos de navegación
  sections?: NavigationSection[];
  items?: NavigationItem[];
  
  // Usuario actual
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
  
  // Callbacks
  onLogout?: () => void;
  onNavigate?: (item: NavigationItem) => void;
  
  // Personalización
  logo?: React.ReactNode;
  logoHref?: string;
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  
  // Features
  showNotifications?: boolean;
  showSettings?: boolean;
  showUserMenu?: boolean;
  showSearch?: boolean;
  notificationCount?: number;
}

// ============================================================================
// NAVEGACIÓN POR ROL
// ============================================================================

const NAVIGATION_BY_ROLE: Record<string, NavigationSection[]> = {
  patient: [
    {
      id: 'main',
      items: [
        { id: 'dashboard', name: 'Panel Principal', href: '/dashboard', icon: Home },
        { id: 'appointments', name: 'Mis Citas', href: '/appointments', icon: Calendar },
        { id: 'medical-history', name: 'Historial Médico', href: '/medical-history', icon: FileText },
        { id: 'prescriptions', name: 'Prescripciones', href: '/prescriptions', icon: Pill },
        { id: 'telemedicine', name: 'Telemedicina', href: '/telemedicine', icon: Video },
      ]
    },
    {
      id: 'personal',
      title: 'Personal',
      items: [
        { id: 'profile', name: 'Mi Perfil', href: '/profile', icon: User },
        { id: 'settings', name: 'Configuración', href: '/settings', icon: Settings },
      ]
    }
  ],
  
  doctor: [
    {
      id: 'main',
      items: [
        { id: 'dashboard', name: 'Dashboard', href: '/', icon: Home },
        { id: 'appointments', name: 'Citas', href: '/citas', icon: Calendar },
        { id: 'patients', name: 'Pacientes', href: '/pacientes', icon: Users },
        { id: 'telemedicine', name: 'Telemedicina', href: '/telemedicine', icon: Video },
        { id: 'qos', name: 'QoS Dashboard', href: '/qos', icon: Activity },
      ]
    },
    {
      id: 'professional',
      title: 'Profesional',
      items: [
        { id: 'profile', name: 'Mi Perfil', href: '/perfil', icon: User },
        { id: 'marketplace', name: 'Marketplace', href: '/job-applications', icon: Briefcase },
      ]
    }
  ],
  
  company: [
    {
      id: 'main',
      items: [
        { id: 'dashboard', name: 'Dashboard', href: '/', icon: Home },
        { id: 'operations', name: 'Operations Hub', href: '/operations-hub', icon: Activity },
        { id: 'marketplace', name: 'Marketplace', href: '/marketplace', icon: Briefcase },
        { id: 'billing', name: 'Facturación', href: '/billing', icon: DollarSign },
        { id: 'analytics', name: 'Analytics', href: '/analytics', icon: BarChart3 },
      ]
    },
    {
      id: 'management',
      title: 'Gestión',
      items: [
        { id: 'staff', name: 'Personal', href: '/staff', icon: Users },
        { id: 'compliance', name: 'Compliance', href: '/compliance', icon: Shield },
        { id: 'settings', name: 'Configuración', href: '/settings', icon: Settings },
      ]
    }
  ],
  
  admin: [
    {
      id: 'main',
      items: [
        { id: 'dashboard', name: 'Dashboard', href: '/', icon: Home },
        { id: 'users', name: 'Usuarios', href: '/users', icon: Users },
        { id: 'companies', name: 'Empresas', href: '/companies', icon: Building },
        { id: 'analytics', name: 'Analytics', href: '/analytics', icon: BarChart3 },
        { id: 'audit', name: 'Auditoría', href: '/audit', icon: Shield },
      ]
    },
    {
      id: 'system',
      title: 'Sistema',
      items: [
        { id: 'settings', name: 'Configuración', href: '/settings', icon: Settings },
        { id: 'health', name: 'System Health', href: '/health', icon: Activity },
      ]
    }
  ]
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function UnifiedNavigation({
  mode = 'navbar',
  sections,
  items,
  user,
  onLogout,
  onNavigate,
  logo,
  logoHref = '/',
  className = '',
  theme = 'light',
  collapsed = false,
  onCollapsedChange,
  showNotifications = true,
  showSettings = true,
  showUserMenu = true,
  showSearch = false,
  notificationCount = 0
}: UnifiedNavigationProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  // Determinar secciones de navegación
  const navigationSections = useMemo(() => {
    if (sections) return sections;
    if (items) return [{ id: 'main', items }];
    
    // Usar navegación por rol si está disponible
    const userRole = user?.role?.toLowerCase();
    if (userRole && NAVIGATION_BY_ROLE[userRole]) {
      return NAVIGATION_BY_ROLE[userRole];
    }
    
    // Default
    return [];
  }, [sections, items, user?.role]);
  
  // Verificar si un item está activo
  const isItemActive = (item: NavigationItem): boolean => {
    if (item.href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(item.href) || false;
  };
  
  // Manejar navegación
  const handleNavigate = (item: NavigationItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (onNavigate) {
      onNavigate(item);
    }
    setMobileMenuOpen(false);
  };
  
  // Renderizar item de navegación
  const renderNavigationItem = (item: NavigationItem, isCompact = false) => {
    const isActive = isItemActive(item);
    const Icon = item.icon;
    
    const itemContent = (
      <>
        {Icon && (
          <Icon className={cn(
            'flex-shrink-0',
            isCompact ? 'w-5 h-5' : 'w-4 h-4',
            mode === 'sidebar' && !collapsed && 'mr-3'
          )} />
        )}
        {(!collapsed || mode !== 'sidebar') && (
          <>
            <span className="flex-1">{item.name}</span>
            {item.badge !== undefined && (
              <span className={cn(
                'ml-2 px-2 py-0.5 text-xs font-medium rounded-full',
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              )}>
                {item.badge}
              </span>
            )}
          </>
        )}
      </>
    );
    
    const itemClasses = cn(
      'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
      isActive
        ? 'bg-blue-50 text-blue-700'
        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
      mode === 'sidebar' && collapsed && 'justify-center',
      'cursor-pointer'
    );
    
    if (item.href) {
      return (
        <Link
          key={item.id}
          href={item.href}
          className={itemClasses}
          onClick={() => handleNavigate(item)}
          title={collapsed ? item.name : undefined}
        >
          {itemContent}
        </Link>
      );
    }
    
    return (
      <button
        key={item.id}
        onClick={() => handleNavigate(item)}
        className={itemClasses}
        title={collapsed ? item.name : undefined}
      >
        {itemContent}
      </button>
    );
  };
  
  // ============================================================================
  // NAVBAR MODE
  // ============================================================================
  
  if (mode === 'navbar') {
    return (
      <nav className={cn(
        'bg-white shadow-sm border-b border-gray-200',
        theme === 'dark' && 'bg-gray-900 border-gray-800',
        className
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo y navegación principal */}
            <div className="flex items-center">
              {/* Logo */}
              <Link href={logoHref} className="flex-shrink-0 flex items-center">
                {logo || (
                  <>
                    <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">A</span>
                    </div>
                    <span className="ml-2 text-xl font-bold text-gray-900">
                      ALTAMEDICA
                    </span>
                  </>
                )}
              </Link>
              
              {/* Navegación desktop */}
              <div className="hidden md:ml-6 md:flex md:space-x-1">
                {navigationSections.map(section => 
                  section.items.map(item => renderNavigationItem(item))
                )}
              </div>
            </div>
            
            {/* Acciones del usuario */}
            <div className="flex items-center space-x-3">
              {/* Notificaciones */}
              {showNotifications && (
                <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
                  )}
                </button>
              )}
              
              {/* Settings */}
              {showSettings && (
                <Link href="/settings" className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <Settings className="h-5 w-5" />
                </Link>
              )}
              
              {/* User menu */}
              {showUserMenu && user && (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  </button>
                  
                  {/* Dropdown menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Mi Perfil
                      </Link>
                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Configuración
                      </Link>
                      {onLogout && (
                        <button
                          onClick={onLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Cerrar Sesión
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationSections.map(section => (
                <div key={section.id}>
                  {section.title && (
                    <h3 className="px-3 pt-3 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {section.title}
                    </h3>
                  )}
                  {section.items.map(item => renderNavigationItem(item))}
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>
    );
  }
  
  // ============================================================================
  // SIDEBAR MODE
  // ============================================================================
  
  if (mode === 'sidebar') {
    return (
      <aside className={cn(
        'flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        theme === 'dark' && 'bg-gray-900 border-gray-800',
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!collapsed && (
            <Link href={logoHref} className="flex items-center">
              {logo || (
                <>
                  <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">A</span>
                  </div>
                  <span className="ml-2 text-xl font-bold text-gray-900">
                    ALTAMEDICA
                  </span>
                </>
              )}
            </Link>
          )}
          
          {onCollapsedChange && (
            <button
              onClick={() => onCollapsedChange(!collapsed)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>
        
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          {navigationSections.map(section => (
            <div key={section.id} className="mb-6">
              {section.title && !collapsed && (
                <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              <div className="px-3 space-y-1">
                {section.items.map(item => renderNavigationItem(item))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer */}
        {user && (
          <div className="border-t border-gray-200 p-4">
            {!collapsed ? (
              <div className="flex items-center">
                <div className="h-9 w-9 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Cerrar Sesión"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={onLogout}
                className="w-full p-2 text-gray-400 hover:text-gray-600 transition-colors flex justify-center"
                title="Cerrar Sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
      </aside>
    );
  }
  
  // Mobile mode would go here if needed
  return null;
}

export default UnifiedNavigation;