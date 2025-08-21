"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  User, 
  Calendar, 
  Stethoscope, 
  Pill, 
  Activity, 
  Shield, 
  AlertCircle,
  Search,
  Eye,
  X
} from 'lucide-react';
import { Button } from '@altamedica/ui';
import { Card } from '@altamedica/ui';
import { Badge } from '@altamedica/ui';

// Removed local interface - using @altamedica/types
import { MedicalRecord } from '@altamedica/types';

interface MedicalHistoryMVPProps {
  patientId?: string;
  className?: string;
  showAsCard?: boolean;
}

export default function MedicalHistoryMVP({ 
  patientId = 'demo', 
  className = '',
  showAsCard = false 
}: MedicalHistoryMVPProps) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadMedicalHistory();
  }, [patientId]);

  useEffect(() => {
    filterRecords();
  }, [records, searchTerm, selectedType]);

  const loadMedicalHistory = async () => {
    // Mock data - replace with API call
    const mockRecords: MedicalRecord[] = [
      {
        id: '1',
        date: '2025-01-15',
        type: 'consultation',
        title: 'Consulta de Cardiología',
        description: 'Chequeo cardiológico de rutina. Paciente asintomático.',
        doctor: 'Dr. Carlos García López',
        specialty: 'Cardiología',
        status: 'completed',
        notes: 'Continuar con medicación actual. Próxima cita en 6 meses.',
        medications: ['Amlodipina 5mg', 'Atorvastatina 20mg']
      },
      {
        id: '2',
        date: '2025-01-10',
        type: 'lab_result',
        title: 'Análisis de Sangre',
        description: 'Hemograma completo y perfil lipídico.',
        doctor: 'Dra. María Ruiz',
        specialty: 'Medicina General',
        status: 'completed',
        results: {
          'Hemoglobina': '14.2 g/dL',
          'Glucosa': '95 mg/dL',
          'Colesterol': '180 mg/dL'
        }
      },
      {
        id: '3',
        date: '2025-01-05',
        type: 'prescription',
        title: 'Renovación de Medicamentos',
        description: 'Renovación de medicamentos para tratamiento actual.',
        doctor: 'Dr. Carlos García López',
        specialty: 'Cardiología',
        status: 'completed',
        medications: ['Amlodipina 5mg', 'Atorvastatina 20mg', 'Aspirina 100mg']
      },
      {
        id: '4',
        date: '2024-12-20',
        type: 'vaccination',
        title: 'Vacuna Gripe 2024',
        description: 'Vacunación anual contra la influenza.',
        doctor: 'Dra. Ana Martínez',
        specialty: 'Medicina General',
        status: 'completed'
      }
    ];

    setTimeout(() => {
      setRecords(mockRecords);
      setLoading(false);
    }, 1000);
  };

  const filterRecords = () => {
    let filtered = records;

    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.specialty.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(record => record.type === selectedType);
    }

    setFilteredRecords(filtered);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation': return <User className="w-4 h-4" />;
      case 'lab_result': return <Activity className="w-4 h-4" />;
      case 'prescription': return <Pill className="w-4 h-4" />;
      case 'vaccination': return <Shield className="w-4 h-4" />;
      case 'emergency': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consultation': return 'bg-blue-100 text-blue-800';
      case 'lab_result': return 'bg-green-100 text-green-800';
      case 'prescription': return 'bg-purple-100 text-purple-800';
      case 'vaccination': return 'bg-yellow-100 text-yellow-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'consultation': return 'Consulta';
      case 'lab_result': return 'Laboratorio';
      case 'prescription': return 'Receta';
      case 'vaccination': return 'Vacuna';
      case 'emergency': return 'Emergencia';
      default: return 'Registro';
    }
  };

  const openRecordDetails = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  // Card view for dashboard
  if (showAsCard) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Historial Médico</h3>
          <Button variant="ghost" size="sm" className="text-xs">
            Ver todo
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 rounded mb-1"></div>
                    <div className="h-2 bg-gray-100 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {records.slice(0, 3).map((record) => (
              <div 
                key={record.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => openRecordDetails(record)}
              >
                <div className={`p-2 rounded-lg ${getTypeColor(record.type)}`}>
                  {getTypeIcon(record.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-xs truncate">
                    {record.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{record.doctor}</span>
                    <span>•</span>
                    <span>{new Date(record.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  }

  // Full page view
  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Historial Médico</h1>
        <p className="text-gray-600">Revisa todos tus registros médicos</p>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar registros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los tipos</option>
            <option value="consultation">Consultas</option>
            <option value="lab_result">Laboratorio</option>
            <option value="prescription">Recetas</option>
            <option value="vaccination">Vacunas</option>
            <option value="emergency">Emergencias</option>
          </select>
        </div>
      </Card>

      {/* Records List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-4">
              <div className="animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredRecords.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No se encontraron registros</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <Card key={record.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => openRecordDetails(record)}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${getTypeColor(record.type)}`}>
                  {getTypeIcon(record.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{record.title}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2">{record.description}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {getTypeLabel(record.type)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {record.doctor}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(record.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Stethoscope className="w-3 h-3" />
                      {record.specialty}
                    </span>
                  </div>
                  {record.medications && record.medications.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {record.medications.slice(0, 3).map((med, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {med}
                        </span>
                      ))}
                      {record.medications.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          +{record.medications.length - 3} más
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Record Detail Modal */}
      {showModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Detalle del Registro</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{selectedRecord.title}</h3>
                  <p className="text-gray-600">{selectedRecord.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Médico:</span>
                    <p className="text-gray-900">{selectedRecord.doctor}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Especialidad:</span>
                    <p className="text-gray-900">{selectedRecord.specialty}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Fecha:</span>
                    <p className="text-gray-900">{new Date(selectedRecord.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Estado:</span>
                    <Badge variant={selectedRecord.status === 'completed' ? 'default' : 'secondary'}>
                      {selectedRecord.status === 'completed' ? 'Completado' : 'Pendiente'}
                    </Badge>
                  </div>
                </div>
                
                {selectedRecord.notes && (
                  <div>
                    <span className="font-medium text-gray-700">Notas:</span>
                    <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">{selectedRecord.notes}</p>
                  </div>
                )}
                
                {selectedRecord.medications && selectedRecord.medications.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700">Medicamentos:</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedRecord.medications.map((med, index) => (
                        <Badge key={index} variant="outline">
                          {med}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedRecord.results && (
                  <div>
                    <span className="font-medium text-gray-700">Resultados:</span>
                    <div className="mt-2 space-y-2">
                      {Object.entries(selectedRecord.results).map(([key, value]) => (
                        <div key={key} className="flex justify-between p-2 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-700">{key}:</span>
                          <span className="text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}