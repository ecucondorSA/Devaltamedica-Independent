'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@altamedica/ui';
import { Button } from '@altamedica/ui';
import { Badge } from '@altamedica/ui';
import { 
  Camera, 
  Mic, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Settings,
  HelpCircle,
  Shield,
  Wifi,
  Monitor
} from 'lucide-react';
import { useAudioVideoOptimizer } from '../services/AudioVideoOptimizer';

import { logger } from '@altamedica/shared/services/logger.service';
interface DeviceDiagnosticPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
}

interface DeviceInfo {
  name: string;
  id: string;
  kind: string;
  status: 'available' | 'in-use' | 'denied' | 'not-found';
}

export default function DeviceDiagnosticPanel({ 
  isOpen, 
  onClose, 
  onRetry 
}: DeviceDiagnosticPanelProps) {
  const { checkDevicePermissions, getAvailableDevices, requestDevicePermissions } = useAudioVideoOptimizer();
  const [devices, setDevices] = useState<{
    cameras: DeviceInfo[];
    microphones: DeviceInfo[];
  }>({ cameras: [], microphones: [] });
  const [permissions, setPermissions] = useState<{
    camera: PermissionState;
    microphone: PermissionState;
  }>({ camera: 'prompt', microphone: 'prompt' });
  const [isScanning, setIsScanning] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<{
    issues: string[];
    recommendations: string[];
    canProceed: boolean;
  }>({ issues: [], recommendations: [], canProceed: false });

  useEffect(() => {
    if (isOpen) {
      runDiagnostic();
    }
  }, [isOpen]);

  const runDiagnostic = async () => {
    setIsScanning(true);
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // 1. Verificar permisos
      const permResults = await checkDevicePermissions();
      setPermissions(permResults);

      if (permResults.camera === 'denied') {
        issues.push('Permisos de cámara denegados');
        recommendations.push('Habilita los permisos de cámara en tu navegador');
      }

      if (permResults.microphone === 'denied') {
        issues.push('Permisos de micrófono denegados');
        recommendations.push('Habilita los permisos de micrófono en tu navegador');
      }

      // 2. Enumerar dispositivos
      const deviceResults = await getAvailableDevices();
      
      const cameras: DeviceInfo[] = deviceResults.cameras.map(device => ({
        name: device.label || `Cámara ${device.deviceId.slice(0, 8)}`,
        id: device.deviceId,
        kind: 'videoinput',
        status: 'available'
      }));

      const microphones: DeviceInfo[] = deviceResults.microphones.map(device => ({
        name: device.label || `Micrófono ${device.deviceId.slice(0, 8)}`,
        id: device.deviceId,
        kind: 'audioinput',
        status: 'available'
      }));

      setDevices({ cameras, microphones });

      if (cameras.length === 0) {
        issues.push('No se encontraron cámaras');
        recommendations.push('Verifica que tu cámara esté conectada y funcionando');
      }

      if (microphones.length === 0) {
        issues.push('No se encontraron micrófonos');
        recommendations.push('Verifica que tu micrófono esté conectado y funcionando');
      }

      // 3. Verificar soporte de WebRTC
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        issues.push('WebRTC no está soportado');
        recommendations.push('Actualiza tu navegador a una versión más reciente');
      }

      // 4. Verificar HTTPS
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        issues.push('No estás usando HTTPS');
        recommendations.push('Accede a la aplicación usando HTTPS');
      }

      // 5. Verificar conexión a internet
      if (!navigator.onLine) {
        issues.push('Sin conexión a internet');
        recommendations.push('Verifica tu conexión a internet');
      }

      setDiagnosticResults({
        issues,
        recommendations,
        canProceed: issues.length === 0 || (cameras.length > 0 || microphones.length > 0)
      });

    } catch (error) {
      logger.error('Error en diagnóstico:', error);
      issues.push('Error durante el diagnóstico');
      recommendations.push('Intenta recargar la página');
      
      setDiagnosticResults({
        issues,
        recommendations,
        canProceed: false
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleRequestPermissions = async () => {
    try {
      const result = await requestDevicePermissions();
      if (result.success) {
        addNotification('success', 'Permisos concedidos exitosamente');
        runDiagnostic(); // Re-ejecutar diagnóstico
      } else {
        addNotification('error', result.error || 'Error solicitando permisos');
      }
    } catch (error) {
      addNotification('error', 'Error solicitando permisos');
    }
  };

  const addNotification = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    // Implementar sistema de notificaciones
    logger.info(`${type}: ${message}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in-use': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'denied': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'not-found': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <HelpCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600';
      case 'in-use': return 'text-yellow-600';
      case 'denied': return 'text-red-600';
      case 'not-found': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Diagnóstico de Dispositivos</h2>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <XCircle className="w-6 h-6" />
            </Button>
          </div>

          {isScanning ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Analizando dispositivos...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Estado de Permisos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Estado de Permisos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Cámara:</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(permissions.camera === 'granted' ? 'available' : permissions.camera === 'denied' ? 'denied' : 'not-found')}
                        <Badge variant="outline" className={getStatusColor(permissions.camera === 'granted' ? 'available' : permissions.camera === 'denied' ? 'denied' : 'not-found')}>
                          {permissions.camera === 'granted' ? 'Concedido' : 
                           permissions.camera === 'denied' ? 'Denegado' : 'Pendiente'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Micrófono:</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(permissions.microphone === 'granted' ? 'available' : permissions.microphone === 'denied' ? 'denied' : 'not-found')}
                        <Badge variant="outline" className={getStatusColor(permissions.microphone === 'granted' ? 'available' : permissions.microphone === 'denied' ? 'denied' : 'not-found')}>
                          {permissions.microphone === 'granted' ? 'Concedido' : 
                           permissions.microphone === 'denied' ? 'Denegado' : 'Pendiente'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {(permissions.camera === 'denied' || permissions.microphone === 'denied') && (
                    <Button onClick={handleRequestPermissions} className="w-full">
                      <Shield className="w-4 h-4 mr-2" />
                      Solicitar Permisos
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Dispositivos Disponibles */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-green-600" />
                    Dispositivos Disponibles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Cámaras ({devices.cameras.length})
                    </h4>
                    <div className="space-y-2">
                      {devices.cameras.length > 0 ? (
                        devices.cameras.map((camera, index) => (
                          <div key={camera.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700">{camera.name}</span>
                            {getStatusIcon(camera.status)}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No se encontraron cámaras</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                      <Mic className="w-4 h-4" />
                      Micrófonos ({devices.microphones.length})
                    </h4>
                    <div className="space-y-2">
                      {devices.microphones.length > 0 ? (
                        devices.microphones.map((microphone, index) => (
                          <div key={microphone.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700">{microphone.name}</span>
                            {getStatusIcon(microphone.status)}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <Mic className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No se encontraron micrófonos</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Problemas Detectados */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    Problemas Detectados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {diagnosticResults.issues.length > 0 ? (
                    <div className="space-y-2">
                      {diagnosticResults.issues.map((issue, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-800">{issue}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-green-600">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                      <p>No se detectaron problemas</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recomendaciones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-blue-600" />
                    Recomendaciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {diagnosticResults.recommendations.length > 0 ? (
                    <div className="space-y-2">
                      {diagnosticResults.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                          <HelpCircle className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-800">{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                      <p>No se requieren acciones</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {diagnosticResults.canProceed ? 
                  'Puedes proceder con la consulta' : 
                  'Resuelve los problemas antes de continuar'
                }
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={runDiagnostic} disabled={isScanning}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
                  {isScanning ? 'Analizando...' : 'Reanalizar'}
                </Button>
                {diagnosticResults.canProceed && (
                  <Button onClick={onRetry}>
                    Intentar de Nuevo
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 