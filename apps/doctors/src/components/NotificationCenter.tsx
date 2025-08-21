'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  X,
  Check,
  Briefcase,
  Calendar,
  Star,
  MessageSquare,
  Settings,
  Trash2,
  BellOff,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { notificationService } from '../services/notification.service';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'job_match' | 'application_update' | 'interview_scheduled' | 'offer_received' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  actionText?: string;
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState(notificationService.getPreferences());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Suscribirse a las notificaciones
    const handleNotifications = (newNotifications: Notification[]) => {
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
    };

    notificationService.subscribe(handleNotifications);

    // Limpiar notificaciones antiguas al cargar
    notificationService.cleanOldNotifications();

    // Click outside handler
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      notificationService.unsubscribe(handleNotifications);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    notificationService.markAsRead(notification.id);
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const handleDeleteNotification = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    notificationService.deleteNotification(notificationId);
  };

  const handlePreferenceChange = (key: string, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    notificationService.updatePreferences(newPreferences);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'job_match':
        return <Briefcase className="w-4 h-4" />;
      case 'application_update':
        return <MessageSquare className="w-4 h-4" />;
      case 'interview_scheduled':
        return <Calendar className="w-4 h-4" />;
      case 'offer_received':
        return <Star className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: Notification['type'], priority: Notification['priority']) => {
    if (priority === 'high') return 'text-red-600 bg-red-50';
    
    switch (type) {
      case 'job_match':
        return 'text-blue-600 bg-blue-50';
      case 'application_update':
        return 'text-purple-600 bg-purple-50';
      case 'interview_scheduled':
        return 'text-green-600 bg-green-50';
      case 'offer_received':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    return date.toLocaleDateString('es-ES');
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Botón de notificaciones */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Marcar todas como leídas
                  </button>
                )}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Settings className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Configuración de notificaciones */}
          {showSettings ? (
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Preferencias de Notificación</h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Nuevas ofertas de trabajo</span>
                  <input
                    type="checkbox"
                    checked={preferences.jobMatches}
                    onChange={(e) => handlePreferenceChange('jobMatches', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Actualizaciones de aplicaciones</span>
                  <input
                    type="checkbox"
                    checked={preferences.applicationUpdates}
                    onChange={(e) => handlePreferenceChange('applicationUpdates', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Notificaciones push</span>
                  <input
                    type="checkbox"
                    checked={preferences.pushNotifications}
                    onChange={(e) => handlePreferenceChange('pushNotifications', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
                <div>
                  <label className="text-sm text-gray-700">
                    Match mínimo para notificar: {preferences.minMatchScore}%
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={preferences.minMatchScore}
                    onChange={(e) => handlePreferenceChange('minMatchScore', parseInt(e.target.value))}
                    className="w-full mt-1"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="mt-4 text-sm text-blue-600 hover:text-blue-700"
              >
                Volver a notificaciones
              </button>
            </div>
          ) : (
            <>
              {/* Lista de notificaciones */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <BellOff className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No tienes notificaciones</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map(notification => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${getNotificationColor(notification.type, notification.priority)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                {formatTime(notification.createdAt)}
                              </span>
                              {notification.actionUrl && (
                                <span className="text-xs text-blue-600 flex items-center">
                                  {notification.actionText || 'Ver más'}
                                  <ChevronRight className="w-3 h-3 ml-1" />
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDeleteNotification(e, notification.id)}
                            className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-200">
                  <Link 
                    href="/notifications" 
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center"
                  >
                    Ver todas las notificaciones
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}