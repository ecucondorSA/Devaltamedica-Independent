'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Building2,
  Ambulance,
  AlertTriangle,
  Users,
  Bed,
  Navigation,
  Maximize2,
  Minimize2,
  RefreshCw
} from 'lucide-react';
import { Profile } from './CrisisControlCenter';

interface MainMapProps {
  zenMode: boolean;
  profile?: Profile;
}

interface HospitalMarker {
  id: string;
  name: string;
  x: number;
  y: number;
  saturation: number;
  status: 'critical' | 'warning' | 'normal' | 'good';
  patients: number;
  capacity: number;
  selected?: boolean;
}

interface Transfer {
  id: string;
  from: string;
  to: string;
  patients: number;
  eta: string;
  status: 'active' | 'pending' | 'completed';
}

export function MainMap({ zenMode, profile }: MainMapProps) {
  const [selectedHospital, setSelectedHospital] = useState<string | null>(null);
  const [showTransfers, setShowTransfers] = useState(true);
  const [mapScale, setMapScale] = useState(1);

  // Datos mock de hospitales posicionados en el mapa
  const hospitals: HospitalMarker[] = [
    {
      id: 'h1',
      name: 'Hospital Central',
      x: 45,
      y: 35,
      saturation: 95,
      status: 'critical',
      patients: 380,
      capacity: 400,
    },
    {
      id: 'h2',
      name: 'Clínica Norte',
      x: 30,
      y: 20,
      saturation: 78,
      status: 'warning',
      patients: 156,
      capacity: 200,
    },
    {
      id: 'h3',
      name: 'Hospital Sur',
      x: 60,
      y: 70,
      saturation: 45,
      status: 'good',
      patients: 90,
      capacity: 200,
    },
    {
      id: 'h4',
      name: 'Centro Médico Este',
      x: 75,
      y: 40,
      saturation: 88,
      status: 'warning',
      patients: 176,
      capacity: 200,
    },
    {
      id: 'h5',
      name: 'Hospital Universitario',
      x: 20,
      y: 50,
      saturation: 62,
      status: 'normal',
      patients: 248,
      capacity: 400,
    },
    {
      id: 'h6',
      name: 'Clínica Oeste',
      x: 15,
      y: 75,
      saturation: 35,
      status: 'good',
      patients: 70,
      capacity: 200,
    }
  ];

  const transfers: Transfer[] = [
    {
      id: 't1',
      from: 'h1',
      to: 'h3',
      patients: 8,
      eta: '25 min',
      status: 'active'
    },
    {
      id: 't2',
      from: 'h4',
      to: 'h5',
      patients: 5,
      eta: '40 min',
      status: 'pending'
    },
    {
      id: 't3',
      from: 'h1',
      to: 'h6',
      patients: 12,
      eta: '35 min',
      status: 'active'
    }
  ];

  const getHospitalColor = (status: string) => {
    switch (status) {
      case 'critical': return 'border-vscode-crisis-critical bg-vscode-crisis-critical text-white';
      case 'warning': return 'border-vscode-crisis-warning bg-vscode-crisis-warning text-white';
      case 'normal': return 'border-vscode-crisis-info bg-vscode-crisis-info text-white';
      case 'good': return 'border-vscode-crisis-success bg-vscode-crisis-success text-white';
      default: return 'border-vscode-border bg-vscode-input text-vscode-foreground';
    }
  };

  const getHospitalSize = (status: string) => {
    switch (status) {
      case 'critical': return 'w-8 h-8';
      case 'warning': return 'w-7 h-7';
      default: return 'w-6 h-6';
    }
  };

  const getTransferPath = (fromId: string, toId: string) => {
    const fromHospital = hospitals.find(h => h.id === fromId);
    const toHospital = hospitals.find(h => h.id === toId);
    
    if (!fromHospital || !toHospital) return '';
    
    return `M ${fromHospital.x} ${fromHospital.y} L ${toHospital.x} ${toHospital.y}`;
  };

  const selectedHospitalData = hospitals.find(h => h.id === selectedHospital);

  return (
    <div className="relative w-full h-full bg-vscode-editor overflow-hidden">
      {/* Map Controls */}
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        <button
          onClick={() => setShowTransfers(!showTransfers)}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            showTransfers 
              ? 'bg-vscode-activity-badge text-white' 
              : 'bg-vscode-input text-vscode-foreground hover:bg-vscode-list-hover'
          }`}
        >
          <Navigation className="w-3 h-3 inline mr-1" />
          Transferencias
        </button>
        
        <button className="bg-vscode-input hover:bg-vscode-list-hover text-vscode-foreground px-3 py-1.5 rounded text-xs font-medium transition-colors">
          <RefreshCw className="w-3 h-3 inline mr-1" />
          Actualizar
        </button>

        {!zenMode && (
          <>
            <button
              onClick={() => setMapScale(Math.min(mapScale + 0.2, 2))}
              className="bg-vscode-input hover:bg-vscode-list-hover text-vscode-foreground px-3 py-1.5 rounded text-xs font-medium transition-colors"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
            
            <button
              onClick={() => setMapScale(Math.max(mapScale - 0.2, 0.6))}
              className="bg-vscode-input hover:bg-vscode-list-hover text-vscode-foreground px-3 py-1.5 rounded text-xs font-medium transition-colors"
            >
              <Minimize2 className="w-3 h-3" />
            </button>
          </>
        )}
      </div>

      {/* Map Status */}
      <div className="absolute top-4 right-4 bg-vscode-panel border border-vscode-border rounded px-3 py-2 z-10">
        <div className="text-xs text-vscode-foreground">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-vscode-activity-badge rounded-full animate-pulse"></div>
            <span className="font-medium text-white">Tiempo Real</span>
          </div>
          <div className="text-vscode-foreground/80">
            Última actualización: hace 3s
          </div>
        </div>
      </div>

      {/* Main Map Area */}
      <div 
        className="relative w-full h-full"
        style={{ transform: `scale(${mapScale})`, transformOrigin: 'center' }}
      >
        {/* Grid Background */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-vscode-border"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Transfer Routes */}
        {showTransfers && (
          <svg className="absolute inset-0 w-full h-full">
            {transfers.map((transfer) => (
              <g key={transfer.id}>
                <path
                  d={getTransferPath(transfer.from, transfer.to)}
                  fill="none"
                  stroke={transfer.status === 'active' ? '#f9826c' : '#58a6ff'}
                  strokeWidth="2"
                  strokeDasharray={transfer.status === 'pending' ? '5,5' : 'none'}
                  className="opacity-80"
                >
                  {transfer.status === 'active' && (
                    <animate
                      attributeName="stroke-dasharray"
                      values="0,10;5,5;10,0"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  )}
                </path>
                
                {/* Transfer Info */}
                <foreignObject
                  x={`${(hospitals.find(h => h.id === transfer.from)?.x ?? 0 + hospitals.find(h => h.id === transfer.to)?.x ?? 0) / 2 - 15}%`}
                  y={`${(hospitals.find(h => h.id === transfer.from)?.y ?? 0 + hospitals.find(h => h.id === transfer.to)?.y ?? 0) / 2 - 5}%`}
                  width="30%"
                  height="10%"
                >
                  <div className="bg-vscode-panel border border-vscode-border rounded px-2 py-1 text-xs text-center">
                    <div className="text-white font-medium">{transfer.patients} pacientes</div>
                    <div className="text-vscode-foreground/80">{transfer.eta}</div>
                  </div>
                </foreignObject>
              </g>
            ))}
          </svg>
        )}

        {/* Hospital Markers */}
        {hospitals.map((hospital) => (
          <div
            key={hospital.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{
              left: `${hospital.x}%`,
              top: `${hospital.y}%`,
            }}
            onClick={() => setSelectedHospital(selectedHospital === hospital.id ? null : hospital.id)}
          >
            {/* Hospital Marker */}
            <div
              className={`
                ${getHospitalSize(hospital.status)}
                ${getHospitalColor(hospital.status)}
                rounded-full border-2 flex items-center justify-center
                transition-all duration-200 hover:scale-110
                ${selectedHospital === hospital.id ? 'ring-2 ring-white scale-110' : ''}
                ${hospital.status === 'critical' ? 'animate-pulse' : ''}
              `}
            >
              <Building2 className="w-3 h-3" />
            </div>

            {/* Saturation Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-transparent">
              <div
                className={`absolute inset-0 rounded-full border-2 border-current opacity-40`}
                style={{
                  transform: `scale(${1 + (hospital.saturation / 100) * 0.5})`,
                }}
              />
            </div>

            {/* Hospital Name */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 text-xs text-white font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-vscode-panel px-2 py-1 rounded border border-vscode-border">
              {hospital.name}
            </div>

            {/* Saturation Percentage */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-bold text-white bg-vscode-activity-bar px-1 rounded">
              {hospital.saturation}%
            </div>
          </div>
        ))}
      </div>

      {/* Hospital Details Panel */}
      {selectedHospitalData && (
        <div className="absolute bottom-4 left-4 bg-vscode-panel border border-vscode-border rounded-lg p-4 min-w-80 z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getHospitalColor(selectedHospitalData.status)}`}></div>
              <h3 className="text-sm font-semibold text-white">{selectedHospitalData.name}</h3>
            </div>
            <button
              onClick={() => setSelectedHospital(null)}
              className="text-vscode-foreground/60 hover:text-vscode-foreground"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-vscode-foreground/80 mb-1">Ocupación</div>
              <div className="flex items-center gap-2">
                <Bed className="w-3 h-3" />
                <span className="text-white font-medium">
                  {selectedHospitalData.patients}/{selectedHospitalData.capacity}
                </span>
              </div>
            </div>
            
            <div>
              <div className="text-vscode-foreground/80 mb-1">Saturación</div>
              <div className={`font-bold ${getHospitalColor(selectedHospitalData.status).split(' ')[0]}`}>
                {selectedHospitalData.saturation}%
              </div>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button className="flex-1 bg-vscode-button hover:bg-vscode-button-hover text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">
              Ver Detalles
            </button>
            {selectedHospitalData.status === 'critical' && (
              <button className="flex-1 bg-vscode-crisis-critical hover:bg-vscode-crisis-critical/80 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">
                <Ambulance className="w-3 h-3 inline mr-1" />
                Redistribuir
              </button>
            )}
          </div>
        </div>
      )}

      {/* Profile Indicator */}
      {profile && (
        <div className="absolute bottom-4 right-4 bg-vscode-panel border border-vscode-border rounded px-3 py-2">
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${profile.color}`}></div>
            <span className="text-white font-medium">Perfil: {profile.name}</span>
          </div>
        </div>
      )}
    </div>
  );
}