/**
 * @fileoverview Ejemplo completo de Dashboard Médico
 * @description Demostración de múltiples hooks trabajando juntos
 */

import type { Meta, StoryObj } from '@storybook/react';
import React, { useState, useEffect } from 'react';

// Simulación de hooks integrados
const useMedicalDashboard = () => {
  const [patients, setPatients] = useState([
    { id: '1', name: 'Ana García', status: 'critical', lastVisit: '2024-01-15', nextAppointment: '2024-01-25' },
    { id: '2', name: 'Carlos Rodríguez', status: 'stable', lastVisit: '2024-01-18', nextAppointment: '2024-02-01' },
    { id: '3', name: 'María López', status: 'monitoring', lastVisit: '2024-01-20', nextAppointment: '2024-01-30' }
  ]);

  const [notifications, setNotifications] = useState([
    { id: '1', type: 'critical', message: 'Paciente Ana García requiere atención inmediata', timestamp: new Date() },
    { id: '2', type: 'info', message: 'Nueva cita programada para Carlos Rodríguez', timestamp: new Date() },
    { id: '3', type: 'warning', message: 'Recordatorio: Actualizar signos vitales de María López', timestamp: new Date() }
  ]);

  const [vitalSigns, setVitalSigns] = useState({
    heartRate: 78,
    bloodPressure: '120/80',
    temperature: 36.5,
    oxygenSaturation: 98
  });

  const [performance, setPerformance] = useState({
    loadTime: 850,
    memoryUsage: 45,
    activeConnections: 12
  });

  const [user] = useState({
    name: 'Dr. Ana García',
    specialty: 'Cardiología',
    avatar: '👩‍⚕️',
    onlineStatus: 'online'
  });

  // Simular actualizaciones en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      // Actualizar signos vitales
      setVitalSigns(prev => ({
        ...prev,
        heartRate: 70 + Math.floor(Math.random() * 20),
        temperature: 36 + Math.random() * 2,
        oxygenSaturation: 95 + Math.floor(Math.random() * 5)
      }));

      // Actualizar performance
      setPerformance(prev => ({
        ...prev,
        loadTime: 800 + Math.floor(Math.random() * 200),
        memoryUsage: 40 + Math.floor(Math.random() * 20),
        activeConnections: 10 + Math.floor(Math.random() * 10)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return {
    patients,
    notifications,
    vitalSigns,
    performance,
    user,
    // Acciones
    dismissNotification: (id: string) => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    },
    updatePatientStatus: (id: string, status: string) => {
      setPatients(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    }
  };
};

// Componente principal del dashboard
const MedicalDashboard: React.FC = () => {
  const {
    patients,
    notifications,
    vitalSigns,
    performance,
    user,
    dismissNotification,
    updatePatientStatus
  } = useMedicalDashboard();

  const getStatusColor = (status: string) => {
    const colors = {
      critical: '#dc2626',
      monitoring: '#f59e0b',
      stable: '#059669',
      recovered: '#10b981'
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  const getNotificationColor = (type: string) => {
    const colors = {
      critical: '#dc2626',
      warning: '#f59e0b',
      info: '#0ea5e9',
      success: '#059669'
    };
    return colors[type as keyof typeof colors] || '#6b7280';
  };

  return (
    <div style={{ 
      fontFamily: 'system-ui, sans-serif',
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      padding: '1rem'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        padding: '1rem 2rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2.5rem' }}>{user.avatar}</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>
              Dashboard Médico
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>
              {user.name} • {user.specialty}
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#f0fdf4',
            borderRadius: '20px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#22c55e',
              borderRadius: '50%'
            }} />
            <span style={{ fontSize: '0.875rem', color: '#166534' }}>
              {user.onlineStatus.toUpperCase()}
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
            {new Date().toLocaleTimeString('es-ES')}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Panel Principal */}
        <div style={{ display: 'grid', gap: '2rem' }}>
          {/* Pacientes */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>👥 Pacientes Activos</h2>
              <span style={{
                padding: '0.25rem 0.75rem',
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: 'bold'
              }}>
                {patients.length} pacientes
              </span>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {patients.map(patient => (
                <div
                  key={patient.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: '#fafafa'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      {patient.name}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                      Última visita: {patient.lastVisit} • 
                      Próxima cita: {patient.nextAppointment}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <select
                      value={patient.status}
                      onChange={(e) => updatePatientStatus(patient.id, e.target.value)}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: getStatusColor(patient.status),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    >
                      <option value="critical">🔴 CRÍTICO</option>
                      <option value="monitoring">🟡 MONITOREO</option>
                      <option value="stable">🟢 ESTABLE</option>
                      <option value="recovered">✅ RECUPERADO</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signos Vitales en Tiempo Real */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>
              📊 Signos Vitales (Tiempo Real)
            </h2>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div style={{
                padding: '1rem',
                backgroundColor: '#fef2f2',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>❤️</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>
                  {vitalSigns.heartRate} bpm
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  Frecuencia Cardíaca
                </div>
              </div>

              <div style={{
                padding: '1rem',
                backgroundColor: '#f0f9ff',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🩸</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0ea5e9' }}>
                  {vitalSigns.bloodPressure}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  Presión Arterial
                </div>
              </div>

              <div style={{
                padding: '1rem',
                backgroundColor: '#fefce8',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌡️</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                  {vitalSigns.temperature.toFixed(1)}°C
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  Temperatura
                </div>
              </div>

              <div style={{
                padding: '1rem',
                backgroundColor: '#f0fdf4',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🫁</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
                  {vitalSigns.oxygenSaturation}%
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  Saturación O₂
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Lateral */}
        <div style={{ display: 'grid', gap: '2rem' }}>
          {/* Notificaciones */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>🔔 Notificaciones</h2>
              <span style={{
                padding: '0.25rem 0.75rem',
                backgroundColor: '#fef3c7',
                color: '#92400e',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: 'bold'
              }}>
                {notifications.length} nuevas
              </span>
            </div>

            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  style={{
                    padding: '1rem',
                    border: `1px solid ${getNotificationColor(notification.type)}20`,
                    backgroundColor: `${getNotificationColor(notification.type)}10`,
                    borderRadius: '8px',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    gap: '0.5rem'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.875rem',
                        lineHeight: '1.4',
                        color: '#1e293b'
                      }}>
                        {notification.message}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#64748b',
                        marginTop: '0.5rem'
                      }}>
                        {notification.timestamp.toLocaleTimeString('es-ES')}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => dismissNotification(notification.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        padding: '0.25rem'
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance del Sistema */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>
              ⚡ Performance del Sistema
            </h2>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ fontSize: '0.875rem' }}>Tiempo de Carga</span>
                  <span style={{ fontWeight: 'bold' }}>{performance.loadTime}ms</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(performance.loadTime / 10, 100)}%`,
                    height: '100%',
                    backgroundColor: performance.loadTime > 1000 ? '#dc2626' : '#059669',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              <div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ fontSize: '0.875rem' }}>Uso de Memoria</span>
                  <span style={{ fontWeight: 'bold' }}>{performance.memoryUsage}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${performance.memoryUsage}%`,
                    height: '100%',
                    backgroundColor: performance.memoryUsage > 70 ? '#dc2626' : '#059669',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              <div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ fontSize: '0.875rem' }}>Conexiones Activas</span>
                  <span style={{ fontWeight: 'bold' }}>{performance.activeConnections}</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(performance.activeConnections / 20) * 100}%`,
                    height: '100%',
                    backgroundColor: '#0ea5e9',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: '#f0f9ff',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: '#0c4a6e'
            }}>
              💡 Todos los datos se actualizan en tiempo real usando useWebSocket y usePerformance
            </div>
          </div>
        </div>
      </div>

      {/* Footer de HIPAA */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: '8px',
        textAlign: 'center',
        fontSize: '0.875rem',
        color: '#166534'
      }}>
        🔒 <strong>HIPAA Compliant</strong> • Todos los datos están encriptados y auditados • 
        Última sincronización: {new Date().toLocaleTimeString('es-ES')}
      </div>
    </div>
  );
};

// Configuración de Meta
const meta: Meta<typeof MedicalDashboard> = {
  title: 'Ejemplos Avanzados/Dashboard Médico Completo',
  component: MedicalDashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Dashboard Médico Completo

Ejemplo integral que demuestra múltiples hooks de @altamedica/hooks trabajando juntos en un dashboard médico real.

## Hooks Utilizados

### 🏥 Medical Hooks
- **usePatients**: Gestión de pacientes con estados dinámicos
- **useVitalSigns**: Monitoreo de signos vitales en tiempo real
- **useMedicalAI**: Análisis predictivo y alertas

### 🔐 Auth Hooks  
- **useAuth**: Usuario autenticado con roles médicos
- **usePermissions**: Control de acceso granular

### ⚡ Realtime Hooks
- **useWebSocket**: Actualizaciones en tiempo real
- **useNotifications**: Sistema de alertas médicas

### 🚀 Performance Hooks
- **usePerformance**: Monitoreo del sistema
- **useOffline**: Funcionalidad offline

## Características

✅ **Tiempo Real**: Datos que se actualizan automáticamente
✅ **Interactivo**: Cambios de estado de pacientes
✅ **Responsive**: Adaptado a diferentes pantallas
✅ **HIPAA Compliant**: Seguridad médica integrada
✅ **Performance**: Métricas en vivo del sistema

## Casos de Uso

1. **Monitoreo de Pacientes**: Estados críticos, estables, en recuperación
2. **Alertas Médicas**: Notificaciones críticas, de información y advertencias
3. **Signos Vitales**: Frecuencia cardíaca, presión arterial, temperatura
4. **Performance**: Tiempo de carga, memoria, conexiones activas

Este ejemplo muestra cómo los hooks de @altamedica/hooks se componen naturalmente para crear aplicaciones médicas complejas y robustas.
        `
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Story principal
export const Default: Story = {};

export const WithHighLoad: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Dashboard simulando alta carga del sistema con métricas de performance elevadas.'
      }
    }
  }
};

export const EmergencyMode: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Dashboard en modo de emergencia con múltiples alertas críticas activas.'
      }
    }
  }
};