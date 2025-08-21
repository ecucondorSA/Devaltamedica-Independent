// 🏥 HEADER MODULAR ALTAMEDICA PACIENTES
// Componente header independiente con CSS corporativo y funcionalidad robusta
// CONSERVADOR: Extrae funcionalidad sin modificar componente original

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Bell, Search, User, X, Menu } from 'lucide-react';
import { useAuth } from "@altamedica/auth';

// 📝 TIPOS ESPECÍFICOS DEL HEADER
export interface PatientHeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onMenuToggle?: () => void;
  showMobileMenu?: boolean;
  className?: string;
}

export interface NotificationProps {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  read: boolean;
}

export interface SearchResult {
  id: string;
  title: string;
  type: 'patient' | 'appointment' | 'record' | 'prescription';
  url: string;
  highlight?: string;
}

// 🔍 COMPONENTE DE BÚSQUEDA AVANZADA
function SearchComponent({ className = "" }: { className?: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // 🔍 Simulación de búsqueda (se conectará con servicios reales)
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    
    // Simulación temporal - se reemplazará con medicalService
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockResults: SearchResult[] = [
      {
        id: '1',
        title: `Cita con Dr. García - ${query}`,
        type: 'appointment',
        url: '/appointments/1',
        highlight: query
      },
      {
        id: '2',
        title: `Registro médico: ${query}`,
        type: 'record',
        url: '/medical-history/2',
        highlight: query
      }
    ];

    setResults(mockResults);
    setLoading(false);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsOpen(true);
    performSearch(value);
  }, [performSearch]);

  // 🔒 Cerrar búsqueda al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Buscar en el portal..."
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-altamedica focus:border-transparent w-64 shadow-input transition-all duration-200"
          onFocus={() => setIsOpen(true)}
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 📋 RESULTADOS DE BÚSQUEDA */}
      {isOpen && (searchQuery || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-altamedica mx-auto"></div>
              <p className="mt-2 text-sm">Buscando...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <a
                  key={result.id}
                  href={result.url}
                  className="block px-4 py-3 hover:bg-gradient-primary-altamedica transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      result.type === 'appointment' ? 'bg-secondary-altamedica' :
                      result.type === 'record' ? 'bg-primary-altamedica' :
                      result.type === 'prescription' ? 'bg-warning' : 'bg-gray-400'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{result.title}</p>
                      <p className="text-xs text-gray-500 capitalize">{result.type}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No se encontraron resultados para "{searchQuery}"</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// 🔔 COMPONENTE DE NOTIFICACIONES
function NotificationBell({ className = "" }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications] = useState<NotificationProps[]>([
    {
      id: '1',
      title: 'Cita programada',
      message: 'Su cita con Dr. García está confirmada para mañana',
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false
    },
    {
      id: '2',
      title: 'Prescripción lista',
      message: 'Su prescripción está lista para recoger',
      type: 'success',
      timestamp: new Date().toISOString(),
      read: false
    },
    {
      id: '3',
      title: 'Recordatorio',
      message: 'Tomar medicamento en 30 minutos',
      type: 'warning',
      timestamp: new Date().toISOString(),
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const notificationRef = useRef<HTMLDivElement>(null);

  // 🔒 Cerrar notificaciones al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={notificationRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-primary-altamedica transition-colors rounded-lg hover:bg-gradient-primary-altamedica"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-danger text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* 📋 PANEL DE NOTIFICACIONES */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gradient-primary-altamedica">
            <h3 className="text-sm font-semibold text-primary-altamedica">Notificaciones</h3>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 last:border-b-0 hover:bg-gradient-primary-altamedica transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      notification.type === 'info' ? 'bg-primary-altamedica' :
                      notification.type === 'success' ? 'bg-success' :
                      notification.type === 'warning' ? 'bg-warning' :
                      'bg-danger'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary-altamedica rounded-full mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No hay notificaciones</p>
              </div>
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gradient-primary-altamedica">
              <button className="text-sm text-primary-altamedica hover:text-secondary-altamedica font-medium">
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 👤 COMPONENTE DE PERFIL DE USUARIO
function UserProfile({ className = "" }: { className?: string }) {
  const { authState } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // 🔒 Cerrar perfil al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!authState.user) {
    return null;
  }

  return (
    <div ref={profileRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 text-gray-600 hover:text-primary-altamedica transition-colors rounded-lg hover:bg-gradient-primary-altamedica"
      >
        <User className="w-5 h-5" />
        <span className="hidden lg:block text-sm font-medium">
          {authState.user.firstName}
        </span>
      </button>

      {/* 📋 MENÚ DE PERFIL */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gradient-primary-altamedica">
            <p className="text-sm font-semibold text-primary-altamedica">
              {authState.user.firstName} {authState.user.lastName}
            </p>
            <p className="text-xs text-gray-600">{authState.user.email}</p>
          </div>
          
          <div className="py-2">
            <a
              href="/profile"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gradient-primary-altamedica hover:text-primary-altamedica transition-colors"
            >
              Mi Perfil
            </a>
            <a
              href="/settings"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gradient-primary-altamedica hover:text-primary-altamedica transition-colors"
            >
              Configuración
            </a>
            <a
              href="/help"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gradient-primary-altamedica hover:text-primary-altamedica transition-colors"
            >
              Ayuda
            </a>
          </div>
          
          <div className="border-t border-gray-200 py-2">
            <button className="block w-full text-left px-4 py-2 text-sm text-danger hover:bg-red-50 transition-colors">
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 📱 HEADER PRINCIPAL MODULAR
export default function PatientHeaderModular({
  title,
  subtitle,
  actions,
  onMenuToggle,
  showMobileMenu = false,
  className = ""
}: PatientHeaderProps) {
  
  return (
    <header className={`bg-white shadow-md border-b border-gray-200 ${className}`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* 📱 BOTÓN MENÚ MÓVIL */}
          <div className="flex items-center space-x-4">
            {onMenuToggle && (
              <button
                onClick={onMenuToggle}
                className="md:hidden p-2 text-gray-600 hover:text-primary-altamedica transition-colors rounded-lg hover:bg-gradient-primary-altamedica"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            
            {/* 📋 TÍTULO Y SUBTÍTULO */}
            <div className="flex-1">
              {title && (
                <h1 className="text-2xl font-bold text-primary-altamedica animate-fade-in-conservative">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-600 animate-fade-in-conservative">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          {/* 🔧 BARRA DE HERRAMIENTAS */}
          <div className="hidden md:flex items-center space-x-4">
            <SearchComponent />
            <NotificationBell />
            <UserProfile />
          </div>
          
          {/* 🎯 ACCIONES PERSONALIZADAS */}
          {actions && (
            <div className="flex items-center space-x-2 ml-4">
              {actions}
            </div>
          )}
        </div>
      </div>
      
      {/* 📱 MENÚ MÓVIL DESPLEGABLE */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-gray-200 bg-gradient-primary-altamedica px-4 py-3">
          <div className="space-y-3">
            <SearchComponent className="w-full" />
            <div className="flex items-center justify-between">
              <NotificationBell />
              <UserProfile />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}