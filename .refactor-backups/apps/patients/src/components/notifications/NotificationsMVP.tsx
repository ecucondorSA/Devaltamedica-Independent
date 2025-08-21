"use client";

import React, { useState, useEffect } from 'react';
import { Bell, X, Check, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@altamedica/ui';
import { Card } from '@altamedica/ui';
import { Badge } from '@altamedica/ui';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

interface NotificationsMVPProps {
  patientId?: string;
  className?: string;
  showAsList?: boolean;
}

export default function NotificationsMVP({ 
  patientId = 'demo', 
  className = '',
  showAsList = false 
}: NotificationsMVPProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with real API call
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Cita programada',
        message: 'Su cita con Dr. Rodríguez está programada para mañana a las 10:00 AM',
        type: 'info',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        read: false,
        actionUrl: '/appointments'
      },
      {
        id: '2',
        title: 'Resultados disponibles',
        message: 'Sus resultados de laboratorio ya están listos',
        type: 'success',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        read: false,
        actionUrl: '/lab-results'
      },
      {
        id: '3',
        title: 'Recordatorio de medicamento',
        message: 'Es hora de tomar su medicamento diario',
        type: 'warning',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        read: true,
        actionUrl: '/prescriptions'
      }
    ];

    setTimeout(() => {
      setNotifications(mockNotifications);
      setLoading(false);
    }, 1000);
  }, [patientId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffHours = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Hace unos minutos';
    if (diffHours < 24) return `Hace ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays}d`;
  };

  // Card view for dashboard
  if (!showAsList) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-3 bg-gray-200 rounded mb-1"></div>
                <div className="h-2 bg-gray-100 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-xs text-gray-500">Sin notificaciones</p>
        ) : (
          <div className="space-y-2">
            {notifications.slice(0, 3).map((notification) => (
              <div 
                key={notification.id}
                className={`p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                  !notification.read 
                    ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-2">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {notification.title}
                    </p>
                    <p className="text-gray-600 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-gray-400 mt-1">
                      {formatTimestamp(notification.timestamp)}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                  )}
                </div>
              </div>
            ))}
            
            {notifications.length > 3 && (
              <div className="pt-2 border-t">
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  Ver todas las notificaciones
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    );
  }

  // Full page list view
  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={markAllAsRead}
            className="text-xs"
          >
            <Check className="w-4 h-4 mr-1" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-100 rounded mb-1"></div>
                <div className="h-3 bg-gray-100 rounded w-2/3"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="p-8 text-center">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No tienes notificaciones</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification.id}
              className={`p-4 cursor-pointer transition-all ${
                !notification.read 
                  ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start gap-3">
                {getNotificationIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gray-900">
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                  <p className="text-gray-600 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    {formatTimestamp(notification.timestamp)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}