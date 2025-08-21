// 🧭 NAVEGACIÓN LATERAL ALTAMEDICA
// Sistema de navegación consistente y responsive
// PROACTIVO: <350 líneas, accesible, modern UI

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  FileText,
  Pill,
  User,
  Heart,
  Activity,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Video,
  Phone,
  Download,
  HelpCircle,
  Shield
} from 'lucide-react';
import { useAuth } from "@altamedica/auth';

import { logger } from '@altamedica/shared/services/logger.service';
// 📝 TIPOS DE NAVEGACIÓN
interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  description?: string;
  permission?: string;
}

export default function PatientSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { authState, logout, checkPermission } = useAuth();

  // 🧭 ELEMENTOS DE NAVEGACIÓN
  const navigationItems: NavigationItem[] = [
    {
      name: 'Panel Principal',
      href: '/dashboard',
      icon: Home,
      description: 'Resumen de tu salud'
    },
    {
      name: 'Mis Citas',
      href: '/appointments',
      icon: Calendar,
      badge: 2,
      description: 'Gestionar citas médicas'
    },
    {
      name: 'Historial Médico',
      href: '/medical-history',
      icon: FileText,
      description: 'Registros y resultados'
    },
    {
      name: 'Prescripciones',
      href: '/prescriptions',
      icon: Pill,
      badge: 1,
      description: 'Medicamentos activos'
    },
    {
      name: 'Mi Perfil',
      href: '/profile',
      icon: User,
      description: 'Información personal'
    },
    {
      name: 'Métricas de Salud',
      href: '/health-metrics',
      icon: Activity,
      description: 'Seguimiento vital'
    },
    {
      name: 'Telemedicina',
      href: '/telemedicine',
      icon: Video,
      description: 'Consultas virtuales'
    }
  ];

  const secondaryItems: NavigationItem[] = [
    {
      name: 'Notificaciones',
      href: '/notifications',
      icon: Bell,
      badge: 3,
      description: 'Alertas y recordatorios'
    },
    {
      name: 'Descargas',
      href: '/downloads',
      icon: Download,
      description: 'Documentos médicos'
    },
    {
      name: 'Soporte',
      href: '/support',
      icon: HelpCircle,
      description: 'Ayuda y contacto'
    },
    {
      name: 'Configuración',
      href: '/settings',
      icon: Settings,
      description: 'Preferencias'
    }
  ];

  const isActiveRoute = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      logger.error('Logout failed:', error);
    }
  };

  return (
    <>
      {/* 📱 BOTÓN MÓVIL */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* 🌫️ OVERLAY MÓVIL */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 🧭 SIDEBAR */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* 🏥 HEADER */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 rounded-lg p-2">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">AltaMedica</h1>
              <p className="text-sm text-gray-600">Portal del Paciente</p>
            </div>
          </div>
        </div>

        {/* 👤 PERFIL USUARIO */}
        {authState.user && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {authState.user.firstName} {authState.user.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {authState.user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 🧭 NAVEGACIÓN PRINCIPAL */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href);

            // Verificar permisos si es necesario
            if (item.permission && !checkPermission(item.permission)) {
              return null;
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-lg
                  transition-colors duration-200
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className={`
                  mr-3 flex-shrink-0 w-5 h-5
                  ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}
                `} />
                <span className="flex-1">{item.name}</span>
                {item.badge && item.badge > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* 📋 SECCIÓN SECUNDARIA */}
          <div className="pt-6 mt-6 border-t border-gray-200">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Herramientas
            </h3>
            <div className="mt-3 space-y-2">
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-lg
                      transition-colors duration-200
                      ${isActive 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className={`
                      mr-3 flex-shrink-0 w-5 h-5
                      ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}
                    `} />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* 🚪 LOGOUT */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
          >
            <LogOut className="mr-3 w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  );
}
