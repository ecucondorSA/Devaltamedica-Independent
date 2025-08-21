'use client';

import {
  Activity,
  AlertTriangle,
  Bed,
  Building2,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

export interface MiniHospital {
  id: string;
  name: string;
  saturation: number;
  patients: number;
  capacity: number;
  staff: number;
  status: 'critical' | 'warning' | 'normal' | 'good';
  location: string;
  specialties: string[];
}

// Solarized color palette
const solarized = {
  base03: '#002b36',
  base02: '#073642',
  base01: '#586e75',
  base00: '#657b83',
  base0: '#839496',
  base1: '#93a1a1',
  base2: '#eee8d5',
  base3: '#fdf6e3',
  yellow: '#b58900',
  orange: '#cb4b16',
  red: '#dc322f',
  magenta: '#d33682',
  violet: '#6c71c4',
  blue: '#268bd2',
  cyan: '#2aa198',
  green: '#859900'
};

interface NetworkMinimapProps {
  hospitals?: MiniHospital[]; // opcional: si no se pasa, usa mock interno
}

export function NetworkMinimap({ hospitals: externalHospitals }: NetworkMinimapProps) {
  const [selectedHospital, setSelectedHospital] = useState<string | null>(null);

  // Datos mock de hospitales (memoizado para evitar re-renders)
  const mockHospitals: MiniHospital[] = useMemo(() => [
    {
      id: 'h1',
      name: 'Hospital Central',
      saturation: 95,
      patients: 380,
      capacity: 400,
      staff: 85,
      status: 'critical',
      location: 'Centro',
      specialties: ['Cardiología', 'Emergencias', 'UCI']
    },
    {
      id: 'h2',
      name: 'Clínica Norte',
      saturation: 78,
      patients: 156,
      capacity: 200,
      staff: 45,
      status: 'warning',
      location: 'Zona Norte',
      specialties: ['Medicina General', 'Pediatría']
    },
    {
      id: 'h3',
      name: 'Hospital Sur',
      saturation: 45,
      patients: 90,
      capacity: 200,
      staff: 52,
      status: 'good',
      location: 'Zona Sur',
      specialties: ['Trauma', 'Neurología', 'Oncología']
    },
    {
      id: 'h4',
      name: 'Centro Médico Este',
      saturation: 88,
      patients: 176,
      capacity: 200,
      staff: 38,
      status: 'warning',
      location: 'Zona Este',
      specialties: ['Ginecología', 'Cirugía']
    },
    {
      id: 'h5',
      name: 'Hospital Universitario',
      saturation: 62,
      patients: 248,
      capacity: 400,
      staff: 95,
      status: 'normal',
      location: 'Universidad',
      specialties: ['Investigación', 'Especialidades', 'Docencia']
    },
    {
      id: 'h6',
      name: 'Clínica Oeste',
      saturation: 35,
      patients: 70,
      capacity: 200,
      staff: 42,
      status: 'good',
      location: 'Zona Oeste',
      specialties: ['Rehabilitación', 'Medicina Deportiva']
    }
  ], []);

  // Fuente: props externas si vienen, sino mocks
  const hospitals = useMemo(() => externalHospitals ?? mockHospitals, [externalHospitals, mockHospitals]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': 
        return {
          color: solarized.red,
          backgroundColor: `${solarized.red}20`,
          borderColor: solarized.red
        };
      case 'warning': 
        return {
          color: solarized.orange,
          backgroundColor: `${solarized.orange}20`,
          borderColor: solarized.orange
        };
      case 'normal': 
        return {
          color: solarized.blue,
          backgroundColor: `${solarized.blue}20`,
          borderColor: solarized.blue
        };
      case 'good': 
        return {
          color: solarized.green,
          backgroundColor: `${solarized.green}20`,
          borderColor: solarized.green
        };
      default: 
        return {
          color: solarized.base0,
          backgroundColor: solarized.base02,
          borderColor: solarized.base01
        };
    }
  };

  const getStatusIcon = (status: string) => {
    const iconStyle = { width: '0.75rem', height: '0.75rem' };
    switch (status) {
      case 'critical': return <AlertTriangle style={iconStyle} />;
      case 'warning': return <Clock style={iconStyle} />;
      case 'normal': return <Activity style={iconStyle} />;
      case 'good': return <CheckCircle style={iconStyle} />;
      default: return <Building2 style={iconStyle} />;
    }
  };

  const containerStyle: React.CSSProperties = {
    padding: '0.75rem',
    backgroundColor: solarized.base03,
    color: solarized.base0,
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    fontSize: '0.75rem',
    height: '100%',
    overflow: 'auto'
  };

  const summaryCardStyle: React.CSSProperties = {
    backgroundColor: solarized.base02,
    border: `1px solid ${solarized.base01}`,
    borderRadius: '0.375rem',
    padding: '0.5rem',
    marginBottom: '0.5rem'
  };

  const hospitalCardStyle = (hospital: MiniHospital): React.CSSProperties => {
    const colors = getStatusColor(hospital.status);
    return {
      backgroundColor: colors.backgroundColor,
      border: `1px solid ${colors.borderColor}`,
      borderRadius: '0.375rem',
      padding: '0.5rem',
      marginBottom: '0.5rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      color: colors.color,
      ...(selectedHospital === hospital.id && {
        boxShadow: `0 0 0 2px ${solarized.cyan}`,
        borderColor: solarized.cyan
      })
    };
  };

  const progressBarStyle = (saturation: number): React.CSSProperties => ({
    width: '100%',
    backgroundColor: solarized.base01,
    borderRadius: '9999px',
    height: '0.375rem',
    overflow: 'hidden',
    marginBottom: '0.5rem'
  });

  const progressFillStyle = (saturation: number): React.CSSProperties => ({
    height: '100%',
    width: `${saturation}%`,
    borderRadius: '9999px',
    backgroundColor: 
      saturation >= 85 ? solarized.red :
      saturation >= 70 ? solarized.orange :
      solarized.green,
    transition: 'width 0.3s ease'
  });

  return (
    <div style={containerStyle}>
      {/* Network Summary */}
      <div style={summaryCardStyle}>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: '600',
          color: solarized.base1,
          marginBottom: '0.5rem'
        }}>
          Red Hospitalaria
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
          fontSize: '0.7rem'
        }}>
          <div>
            <div style={{ 
              color: solarized.red, 
              fontWeight: '600',
              fontSize: '0.875rem'
            }}>2</div>
            <div style={{ 
              color: `${solarized.base0}CC`,
              fontSize: '0.65rem'
            }}>Críticos</div>
          </div>
          <div>
            <div style={{ 
              color: solarized.orange, 
              fontWeight: '600',
              fontSize: '0.875rem'
            }}>2</div>
            <div style={{ 
              color: `${solarized.base0}CC`,
              fontSize: '0.65rem'
            }}>Alerta</div>
          </div>
        </div>
      </div>

      {/* Hospital List */}
      {hospitals.map((hospital) => (
        <div
          key={hospital.id}
          onClick={() => setSelectedHospital(selectedHospital === hospital.id ? null : hospital.id)}
          style={hospitalCardStyle(hospital)}
        >
          {/* Hospital Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            marginBottom: '0.25rem' 
          }}>
            {getStatusIcon(hospital.status)}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontSize: '0.75rem', 
                fontWeight: '600', 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {hospital.name}
              </div>
              <div style={{ 
                fontSize: '0.65rem', 
                opacity: 0.8 
              }}>
                {hospital.location}
              </div>
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              fontWeight: 'bold' 
            }}>
              {hospital.saturation}%
            </div>
          </div>

          {/* Saturation Bar */}
          <div style={progressBarStyle(hospital.saturation)}>
            <div style={progressFillStyle(hospital.saturation)} />
          </div>

          {/* Basic Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '0.25rem',
            fontSize: '0.65rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Bed style={{ width: '0.75rem', height: '0.75rem' }} />
              <span>{hospital.patients}/{hospital.capacity}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Users style={{ width: '0.75rem', height: '0.75rem' }} />
              <span>{hospital.staff}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Activity style={{ width: '0.75rem', height: '0.75rem' }} />
              <span style={{
                fontWeight: '600',
                color: getStatusColor(hospital.status).color
              }}>
                {hospital.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Expanded Details */}
          {selectedHospital === hospital.id && (
            <div style={{
              marginTop: '0.5rem',
              paddingTop: '0.5rem',
              borderTop: `1px solid ${getStatusColor(hospital.status).borderColor}33`
            }}>
              <div style={{ fontSize: '0.65rem' }}>
                <div style={{ 
                  fontWeight: '600', 
                  marginBottom: '0.25rem',
                  color: solarized.base1
                }}>
                  Especialidades:
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.25rem',
                  marginBottom: '0.5rem'
                }}>
                  {hospital.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      style={{
                        backgroundColor: solarized.base02,
                        color: solarized.base0,
                        padding: '0.125rem 0.375rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.6rem',
                        border: `1px solid ${solarized.base01}`
                      }}
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Quick Actions */}
              <div style={{
                display: 'flex',
                gap: '0.25rem',
                paddingTop: '0.25rem'
              }}>
                <button style={{
                  flex: 1,
                  backgroundColor: solarized.blue,
                  color: solarized.base3,
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.65rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}>
                  Ver Detalles
                </button>
                {hospital.status === 'critical' && (
                  <button style={{
                    flex: 1,
                    backgroundColor: solarized.red,
                    color: solarized.base3,
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.65rem',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}>
                    Redistribuir
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Legend */}
      <div style={{
        paddingTop: '0.5rem',
        borderTop: `1px solid ${solarized.base01}`,
        marginTop: '0.5rem'
      }}>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: '600',
          color: solarized.base1,
          marginBottom: '0.5rem'
        }}>
          Leyenda
        </div>
        <div style={{ fontSize: '0.65rem' }}>
          {[
            { color: solarized.red, label: 'Crítico (>85%)' },
            { color: solarized.orange, label: 'Alerta (70-85%)' },
            { color: solarized.green, label: 'Normal (<70%)' }
          ].map((item, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.25rem'
            }}>
              <div style={{
                width: '0.5rem',
                height: '0.5rem',
                backgroundColor: item.color,
                borderRadius: '50%'
              }} />
              <span style={{ color: solarized.base0 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}