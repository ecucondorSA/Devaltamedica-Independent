/**
 * @fileoverview Stories para usePatients
 * @description Documentación interactiva del hook de gestión de pacientes
 */

import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

// Mock del hook para Storybook
const mockUsePatients = (config: any = {}) => {
  const [patients, setPatients] = useState([
    {
      id: 'patient_001',
      name: 'Ana García',
      email: 'ana.garcia@email.com',
      age: 34,
      gender: 'female',
      status: 'active',
      priority: 'medium',
      lastVisit: new Date('2024-01-15'),
      diagnosis: 'Hipertensión controlada',
      assignedDoctorId: 'doctor_001'
    },
    {
      id: 'patient_002', 
      name: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@email.com',
      age: 45,
      gender: 'male',
      status: 'active',
      priority: 'high',
      lastVisit: new Date('2024-01-20'),
      diagnosis: 'Diabetes Tipo 2',
      assignedDoctorId: 'doctor_002'
    },
    {
      id: 'patient_003',
      name: 'María López',
      email: 'maria.lopez@email.com', 
      age: 28,
      gender: 'female',
      status: 'inactive',
      priority: 'low',
      lastVisit: new Date('2023-12-10'),
      diagnosis: 'Control de rutina',
      assignedDoctorId: 'doctor_001'
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const filteredPatients = patients.filter(patient => {
    if (searchQuery && !patient.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filters.status && patient.status !== filters.status) {
      return false;
    }
    if (filters.priority && patient.priority !== filters.priority) {
      return false;
    }
    return true;
  });

  return {
    // Estado
    patients: filteredPatients,
    isLoading,
    error,
    total: filteredPatients.length,
    currentPage,
    hasNextPage: false,
    hasPreviousPage: false,
    searchQuery,
    filters,

    // Acciones
    fetchPatients: async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
    },
    
    search: (query: string) => {
      setSearchQuery(query);
    },
    
    createPatient: async (patientData: any) => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      const newPatient = {
        id: `patient_${Date.now()}`,
        ...patientData,
        status: 'active',
        priority: 'medium'
      };
      setPatients(prev => [newPatient, ...prev]);
      setIsLoading(false);
      return newPatient;
    },
    
    updatePatient: async (id: string, updates: any) => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setPatients(prev => prev.map(patient => 
        patient.id === id ? { ...patient, ...updates } : patient
      ));
      setIsLoading(false);
    },
    
    deletePatient: async (id: string) => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setPatients(prev => prev.filter(patient => patient.id !== id));
      setIsLoading(false);
    },
    
    setFilters: (newFilters: any) => {
      setFilters(prev => ({ ...prev, ...newFilters }));
    },
    
    clearFilters: () => {
      setFilters({});
      setSearchQuery('');
    },
    
    goToPage: (page: number) => {
      setCurrentPage(page);
    },
    
    exportToCsv: async () => {
      const csv = [
        'ID,Nombre,Email,Edad,Género,Estado,Prioridad,Diagnóstico',
        ...filteredPatients.map(p => 
          `${p.id},${p.name},${p.email},${p.age},${p.gender},${p.status},${p.priority},${p.diagnosis}`
        )
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'patients.csv';
      a.click();
    }
  };
};

// Componente de demostración
const PatientsDemo: React.FC<{ config?: any }> = ({ config = {} }) => {
  const {
    patients,
    isLoading,
    error,
    searchQuery,
    filters,
    search,
    createPatient,
    updatePatient,
    deletePatient,
    setFilters,
    clearFilters,
    exportToCsv
  } = mockUsePatients(config);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    email: '',
    age: '',
    gender: 'male',
    diagnosis: ''
  });

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.name || !newPatient.email) return;
    
    await createPatient({
      ...newPatient,
      age: parseInt(newPatient.age) || 0
    });
    
    setNewPatient({ name: '', email: '', age: '', gender: 'male', diagnosis: '' });
    setShowCreateForm(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? '#10b981' : '#6b7280';
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: '#f8fafc',
        borderRadius: '8px'
      }}>
        <h2 style={{ margin: 0 }}>👥 Gestión de Pacientes</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#0ea5e9',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            ➕ Nuevo Paciente
          </button>
          <button
            onClick={exportToCsv}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            📊 Exportar CSV
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr auto auto auto',
        gap: '1rem',
        marginBottom: '2rem',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="🔍 Buscar pacientes..."
          value={searchQuery}
          onChange={(e) => search(e.target.value)}
          style={{
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '1rem'
          }}
        />
        
        <select
          value={filters.status || ''}
          onChange={(e) => setFilters({ status: e.target.value || undefined })}
          style={{
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px'
          }}
        >
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>

        <select
          value={filters.priority || ''}
          onChange={(e) => setFilters({ priority: e.target.value || undefined })}
          style={{
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px'
          }}
        >
          <option value="">Todas las prioridades</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>

        <button
          onClick={clearFilters}
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🗑️ Limpiar
        </button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            minWidth: '500px',
            maxWidth: '90vw'
          }}>
            <h3>Crear Nuevo Paciente</h3>
            <form onSubmit={handleCreatePatient}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nombre:</label>
                <input
                  type="text"
                  value={newPatient.name}
                  onChange={(e) => setNewPatient(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px'
                  }}
                  required
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email:</label>
                <input
                  type="email"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient(prev => ({ ...prev, email: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Edad:</label>
                  <input
                    type="number"
                    value={newPatient.age}
                    onChange={(e) => setNewPatient(prev => ({ ...prev, age: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Género:</label>
                  <select
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient(prev => ({ ...prev, gender: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="male">Masculino</option>
                    <option value="female">Femenino</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Diagnóstico:</label>
                <input
                  type="text"
                  value={newPatient.diagnosis}
                  onChange={(e) => setNewPatient(prev => ({ ...prev, diagnosis: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#0ea5e9',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    opacity: isLoading ? 0.7 : 1
                  }}
                >
                  {isLoading ? 'Creando...' : 'Crear Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <div>🔄 Cargando pacientes...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{ 
          padding: '1rem',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
          marginBottom: '1rem'
        }}>
          ❌ Error: {error}
        </div>
      )}

      {/* Patients List */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {patients.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            color: '#6b7280'
          }}>
            {searchQuery || Object.keys(filters).length > 0 
              ? '🔍 No se encontraron pacientes con los criterios especificados'
              : '👥 No hay pacientes registrados'
            }
          </div>
        ) : (
          patients.map(patient => (
            <div
              key={patient.id}
              style={{
                padding: '1.5rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                      {patient.gender === 'female' ? '👩' : '👨'} {patient.name}
                    </h3>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        color: 'white',
                        backgroundColor: getStatusColor(patient.status)
                      }}
                    >
                      {patient.status === 'active' ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        color: 'white',
                        backgroundColor: getPriorityColor(patient.priority)
                      }}
                    >
                      {patient.priority === 'high' ? '🔴 ALTA' : 
                       patient.priority === 'medium' ? '🟡 MEDIA' : '🟢 BAJA'}
                    </span>
                  </div>
                  
                  <div style={{ color: '#6b7280', marginBottom: '1rem', lineHeight: '1.5' }}>
                    <div>📧 {patient.email}</div>
                    <div>🎂 {patient.age} años</div>
                    <div>🩺 {patient.diagnosis}</div>
                    <div>📅 Última visita: {patient.lastVisit.toLocaleDateString('es-ES')}</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => updatePatient(patient.id, { 
                      status: patient.status === 'active' ? 'inactive' : 'active' 
                    })}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: patient.status === 'active' ? '#dc2626' : '#059669',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                    title={patient.status === 'active' ? 'Desactivar' : 'Activar'}
                  >
                    {patient.status === 'active' ? '⏸️' : '▶️'}
                  </button>
                  
                  <button
                    onClick={() => deletePatient(patient.id)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                    title="Eliminar paciente"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div style={{ 
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          📊 <strong>{patients.length}</strong> pacientes mostrados
        </div>
        {config.hipaaCompliant && (
          <div style={{ color: '#059669', fontSize: '0.875rem' }}>
            🔒 HIPAA Compliant ✓
          </div>
        )}
      </div>
    </div>
  );
};

// Configuración de Meta
const meta: Meta<typeof PatientsDemo> = {
  title: 'Medical Hooks/usePatients',
  component: PatientsDemo,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# usePatients

Hook completo para gestión de pacientes con compliance HIPAA, búsqueda avanzada, paginación, y operaciones CRUD.

## Características Principales

- ✅ **CRUD Completo**: Crear, leer, actualizar y eliminar pacientes
- ✅ **Búsqueda Debounced**: Búsqueda optimizada con debouncing automático  
- ✅ **Filtros Avanzados**: Por estado, prioridad, doctor asignado, etc.
- ✅ **Paginación**: Soporte para infinite scroll y paginación tradicional
- ✅ **Cache Inteligente**: Cache con invalidación automática
- ✅ **Real-time Updates**: Actualizaciones en tiempo real via WebSocket
- ✅ **Export**: Exportación a CSV y PDF
- ✅ **HIPAA Compliance**: Encriptación y audit trails automáticos
- ✅ **Error Handling**: Manejo robusto de errores con retry automático

## Ejemplo de Uso

\`\`\`typescript
import { usePatients } from '@altamedica/hooks/medical';

function PatientList() {
  const {
    patients,
    isLoading,
    error,
    search,
    createPatient,
    updatePatient,
    deletePatient,
    exportToCsv
  } = usePatients({
    hipaaCompliant: true,
    auditLog: true,
    realTimeUpdates: true,
    pagination: { pageSize: 20 }
  });

  return (
    <div>
      <input 
        placeholder="Buscar pacientes..."
        onChange={(e) => search(e.target.value)}
      />
      
      {patients.map(patient => (
        <PatientCard 
          key={patient.id} 
          patient={patient}
          onUpdate={(updates) => updatePatient(patient.id, updates)}
          onDelete={() => deletePatient(patient.id)}
        />
      ))}
    </div>
  );
}
\`\`\`
        `
      }
    }
  },
  argTypes: {
    config: {
      control: 'object',
      description: 'Configuración del hook usePatients'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Stories
export const Default: Story = {
  args: {
    config: {
      hipaaCompliant: true,
      auditLog: true,
      pagination: { pageSize: 10 }
    }
  }
};

export const WithRealTimeUpdates: Story = {
  args: {
    config: {
      hipaaCompliant: true,
      auditLog: true,
      realTimeUpdates: true,
      pagination: { pageSize: 10 }
    }
  }
};

export const WithAdvancedFilters: Story = {
  args: {
    config: {
      hipaaCompliant: true,
      auditLog: true,
      filters: {
        status: 'active',
        priority: 'high'
      },
      sorting: {
        field: 'lastVisit',
        direction: 'desc'
      }
    }
  }
};

export const HighPerformance: Story = {
  args: {
    config: {
      hipaaCompliant: false, // Para máximo rendimiento
      auditLog: false,
      cacheTime: 300000, // 5 minutos
      staleTime: 60000,   // 1 minuto
      pagination: { pageSize: 50 }
    }
  }
};