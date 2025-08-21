'use client';

// apps/patients/src/components/common/ServiceStatus.tsx
import { Button, Card, Input } from '@altamedica/ui';
import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

interface ServiceStatus {
  name: string;
  url: string;
  status: 'online' | 'offline' | 'checking';
  description: string;
}

export function ServiceStatus() {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'API Server',
      url: 'http://localhost:3001/api/health',
      status: 'checking',
      description: 'Servidor principal de APIs'
    },
    {
      name: 'Signaling Server',
      url: 'http://localhost:8888/health',
      status: 'checking',
      description: 'Servidor WebRTC para videollamadas'
    }
  ]);

  const checkServiceStatus = async (service: ServiceStatus): Promise<'online' | 'offline'> => {
    try {
      const response = await fetch(service.url, { 
        method: 'GET',
        mode: 'cors',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return response.ok ? 'online' : 'offline';
    } catch (error) {
      return 'offline';
    }
  };

  const checkAllServices = async () => {
    const updatedServices = await Promise.all(
      services.map(async (service) => ({
        ...service,
        status: await checkServiceStatus(service)
      }))
    );
    setServices(updatedServices);
  };

  useEffect(() => {
    checkAllServices();
    // Recheck every 30 seconds
    const interval = setInterval(checkAllServices, 30000);
    return () => clearInterval(interval);
  }, []);

  const allOnline = services.every(service => service.status === 'online');
  const anyChecking = services.some(service => service.status === 'checking');

  if (allOnline) {
    return (
      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            Todos los servicios están funcionando correctamente
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <h3 className="text-sm font-medium text-amber-800">Estado de Servicios</h3>
        </div>
        <button
          onClick={checkAllServices}
          className="p-1 text-amber-600 hover:text-amber-700 transition-colors"
          disabled={anyChecking}
        >
          <RefreshCw className={`w-4 h-4 ${anyChecking ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <div className="space-y-2">
        {services.map((service) => (
          <div key={service.name} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {service.status === 'online' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : service.status === 'offline' ? (
                <AlertCircle className="w-4 h-4 text-red-600" />
              ) : (
                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
              )}
              <div>
                <span className="text-sm font-medium text-gray-900">{service.name}</span>
                <p className="text-xs text-gray-600">{service.description}</p>
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              service.status === 'online' 
                ? 'bg-green-100 text-green-700' 
                : service.status === 'offline'
                ? 'bg-red-100 text-red-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {service.status === 'online' ? 'En línea' : 
               service.status === 'offline' ? 'Fuera de línea' : 'Verificando...'}
            </span>
          </div>
        ))}
      </div>
      
      {services.some(s => s.status === 'offline') && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Para resolver:</h4>
          <div className="text-xs text-blue-700 space-y-1">
            {services.find(s => s.name === 'API Server' && s.status === 'offline') && (
              <p>• Iniciar API Server: <code className="bg-blue-100 px-1 rounded">cd apps/api-server && npm run dev</code></p>
            )}
            {services.find(s => s.name === 'Signaling Server' && s.status === 'offline') && (
              <p>• Iniciar Signaling Server: <code className="bg-blue-100 px-1 rounded">cd apps/signaling-server && npm run dev</code></p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}