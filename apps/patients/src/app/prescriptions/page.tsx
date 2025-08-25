'use client';

import { logger } from '@altamedica/shared/services/logger.service';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Mail,
  Pill,
  Printer,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface Prescription {
  id: string;
  date: string;
  doctor: string;
  specialty: string;
  medications: Medication[];
  diagnosis: string;
  instructions: string;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  refills: number;
  refillsRemaining: number;
  expiresAt: string;
  notes?: string;
  isTelemedicine: boolean;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string;
  sideEffects?: string[];
  contraindications?: string[];
  isGeneric: boolean;
  brandName?: string;
  genericName: string;
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'calendar'>('list');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  useEffect(() => {
    filterPrescriptions();
  }, [prescriptions, searchTerm, selectedStatus, selectedDoctor]);

  const loadPrescriptions = async () => {
    try {
      // Simulación de datos - en producción usarías tus APIs
      const mockPrescriptions: Prescription[] = [
        {
          id: '1',
          date: '2025-01-15',
          doctor: 'Dr. Carlos García López',
          specialty: 'Cardiología',
          diagnosis: 'Hipertensión arterial',
          instructions: 'Tomar con el estómago vacío, preferiblemente por la mañana',
          status: 'active',
          refills: 3,
          refillsRemaining: 2,
          expiresAt: '2025-04-15',
          isTelemedicine: false,
          medications: [
            {
              id: 'med1',
              name: 'Amlodipina',
              dosage: '5mg',
              frequency: 'Una vez al día',
              duration: '3 meses',
              quantity: 30,
              instructions: 'Tomar 1 tableta por la mañana con agua',
              sideEffects: ['Mareos', 'Hinchazón en los tobillos', 'Dolor de cabeza'],
              contraindications: ['Alergia a amlodipina', 'Embarazo'],
              isGeneric: true,
              brandName: 'Norvasc',
              genericName: 'Amlodipina',
            },
            {
              id: 'med2',
              name: 'Atorvastatina',
              dosage: '20mg',
              frequency: 'Una vez al día',
              duration: '3 meses',
              quantity: 30,
              instructions: 'Tomar 1 tableta por la noche con agua',
              sideEffects: ['Dolor muscular', 'Náuseas', 'Diarrea'],
              contraindications: ['Enfermedad hepática', 'Embarazo'],
              isGeneric: true,
              brandName: 'Lipitor',
              genericName: 'Atorvastatina',
            },
          ],
        },
        {
          id: '2',
          date: '2025-01-10',
          doctor: 'Dra. María Ruiz',
          specialty: 'Medicina General',
          diagnosis: 'Resfriado común',
          instructions: 'Tomar según sea necesario para aliviar síntomas',
          status: 'completed',
          refills: 0,
          refillsRemaining: 0,
          expiresAt: '2025-02-10',
          isTelemedicine: true,
          medications: [
            {
              id: 'med3',
              name: 'Paracetamol',
              dosage: '500mg',
              frequency: 'Cada 6-8 horas según sea necesario',
              duration: '7 días',
              quantity: 20,
              instructions: 'Tomar 1-2 tabletas cada 6-8 horas para fiebre o dolor',
              sideEffects: ['Náuseas', 'Dolor de estómago'],
              contraindications: ['Alergia a paracetamol', 'Enfermedad hepática'],
              isGeneric: true,
              brandName: 'Tylenol',
              genericName: 'Paracetamol',
            },
          ],
        },
        {
          id: '3',
          date: '2024-12-20',
          doctor: 'Dr. Roberto Silva',
          specialty: 'Dermatología',
          diagnosis: 'Acné moderado',
          instructions: 'Aplicar tópicamente según las indicaciones',
          status: 'active',
          refills: 2,
          refillsRemaining: 1,
          expiresAt: '2025-03-20',
          isTelemedicine: false,
          medications: [
            {
              id: 'med4',
              name: 'Tretinoína',
              dosage: '0.025%',
              frequency: 'Una vez al día por la noche',
              duration: '3 meses',
              quantity: 30,
              instructions: 'Aplicar una capa fina en las áreas afectadas antes de dormir',
              sideEffects: ['Enrojecimiento', 'Descamación', 'Sensibilidad al sol'],
              contraindications: ['Embarazo', 'Lactancia'],
              isGeneric: true,
              brandName: 'Retin-A',
              genericName: 'Tretinoína',
            },
          ],
        },
      ];

      setPrescriptions(mockPrescriptions);
      setLoading(false);
    } catch (error) {
      logger.error('Error loading prescriptions: ' + String(error));
      setLoading(false);
    }
  };

  const filterPrescriptions = () => {
    let filtered = prescriptions;

    if (searchTerm) {
      filtered = filtered.filter(
        (prescription) =>
          prescription.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prescription.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prescription.medications.some((med) =>
            med.name.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((prescription) => prescription.status === selectedStatus);
    }

    if (selectedDoctor !== 'all') {
      filtered = filtered.filter((prescription) => prescription.doctor === selectedDoctor);
    }

    setFilteredPrescriptions(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'expired':
        return <AlertTriangle className="w-4 h-4" />;
      case 'cancelled':
        return <X className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const daysUntilExpiry = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const exportPrescriptions = () => {
    // Implementar exportación de recetas
    logger.info('Exporting prescriptions...');
  };

  const printPrescriptions = () => {
    // Implementar impresión de recetas
    logger.info('Printing prescriptions...');
  };

  const emailPrescriptions = () => {
    // Implementar envío por email
    logger.info('Emailing prescriptions...');
  };

  const requestRefill = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setShowRefillModal(true);
  };

  const openPrescriptionModal = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setShowPrescriptionModal(true);
  };

  const doctors = Array.from(new Set(prescriptions.map((p) => p.doctor))).sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando recetas médicas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Recetas Médicas</h1>
              <p className="text-gray-600 mt-1">Gestiona y revisa tus medicamentos recetados</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportPrescriptions}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </button>
              <button
                onClick={printPrescriptions}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </button>
              <button
                onClick={emailPrescriptions}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar con filtros */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>

              {/* Búsqueda */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar recetas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Estado */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Activa</option>
                  <option value="completed">Completada</option>
                  <option value="expired">Expirada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>

              {/* Médico */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Médico</label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos los médicos</option>
                  {doctors.map((doctor) => (
                    <option key={doctor} value={doctor}>
                      {doctor}
                    </option>
                  ))}
                </select>
              </div>

              {/* Resumen */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Resumen</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total de recetas:</span>
                    <span className="font-medium">{filteredPrescriptions.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Activas:</span>
                    <span className="font-medium text-green-600">
                      {filteredPrescriptions.filter((p) => p.status === 'active').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Por expirar:</span>
                    <span className="font-medium text-orange-600">
                      {
                        filteredPrescriptions.filter(
                          (p) => p.status === 'active' && daysUntilExpiry(p.expiresAt) <= 30,
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Expiradas:</span>
                    <span className="font-medium text-red-600">
                      {filteredPrescriptions.filter((p) => p.status === 'expired').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-3">
            {/* Controles de vista */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">Vista:</span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        viewMode === 'list'
                          ? 'bg-blue-100 text-blue-800'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Lista
                    </button>
                    <button
                      onClick={() => setViewMode('timeline')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        viewMode === 'timeline'
                          ? 'bg-blue-100 text-blue-800'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Cronología
                    </button>
                    <button
                      onClick={() => setViewMode('calendar')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        viewMode === 'calendar'
                          ? 'bg-blue-100 text-blue-800'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Calendario
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {filteredPrescriptions.length} recetas encontradas
                </div>
              </div>
            </div>

            {/* Lista de recetas */}
            <div className="space-y-6">
              {filteredPrescriptions.map((prescription) => (
                <div key={prescription.id} className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Pill className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Receta #{prescription.id}
                            </h3>
                            <p className="text-sm text-gray-600">{prescription.diagnosis}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${getStatusColor(prescription.status)}`}
                            >
                              {prescription.status}
                            </span>
                            {getStatusIcon(prescription.status)}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <span className="text-sm font-medium text-gray-700">Médico:</span>
                            <p className="text-gray-900">{prescription.doctor}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-700">Especialidad:</span>
                            <p className="text-gray-900">{prescription.specialty}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-700">Fecha:</span>
                            <p className="text-gray-900">
                              {new Date(prescription.date).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Medicamentos:</h4>
                          <div className="space-y-2">
                            {prescription.medications.map((medication) => (
                              <div key={medication.id} className="bg-gray-50 p-3 rounded-md">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {medication.name} {medication.dosage}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {medication.frequency} • {medication.duration}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-gray-600">
                                      Cantidad: {medication.quantity}
                                    </p>
                                    {medication.isGeneric && (
                                      <p className="text-xs text-green-600">Genérico disponible</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-4">
                            <span className="text-gray-600">
                              Vence: {new Date(prescription.expiresAt).toLocaleDateString('es-ES')}
                            </span>
                            {prescription.status === 'active' && (
                              <span className="text-gray-600">
                                Reposiciones restantes: {prescription.refillsRemaining}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openPrescriptionModal(prescription)}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {prescription.status === 'active' &&
                              prescription.refillsRemaining > 0 && (
                                <button
                                  onClick={() => requestRefill(prescription)}
                                  className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                  <RefreshCw className="w-3 h-3 mr-1" />
                                  Reposición
                                </button>
                              )}
                          </div>
                        </div>

                        {prescription.status === 'active' && isExpired(prescription.expiresAt) && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex items-center">
                              <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                              <span className="text-sm text-red-800">
                                Esta receta ha expirado. Contacta a tu médico para una nueva receta.
                              </span>
                            </div>
                          </div>
                        )}

                        {prescription.status === 'active' &&
                          !isExpired(prescription.expiresAt) &&
                          daysUntilExpiry(prescription.expiresAt) <= 30 && (
                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                              <div className="flex items-center">
                                <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                                <span className="text-sm text-yellow-800">
                                  Esta receta expira en {daysUntilExpiry(prescription.expiresAt)}{' '}
                                  días.
                                </span>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de detalle de receta */}
      {showPrescriptionModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Detalle de Receta</h2>
                <button
                  onClick={() => setShowPrescriptionModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Información general */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Información General</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Médico:</span>
                      <p className="text-gray-900">{selectedPrescription.doctor}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Especialidad:</span>
                      <p className="text-gray-900">{selectedPrescription.specialty}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Fecha:</span>
                      <p className="text-gray-900">
                        {new Date(selectedPrescription.date).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Estado:</span>
                      <p className="text-gray-900">{selectedPrescription.status}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Diagnóstico:</span>
                      <p className="text-gray-900">{selectedPrescription.diagnosis}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Vence:</span>
                      <p className="text-gray-900">
                        {new Date(selectedPrescription.expiresAt).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Instrucciones */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Instrucciones Generales</h3>
                  <p className="text-gray-700">{selectedPrescription.instructions}</p>
                </div>

                {/* Medicamentos */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Medicamentos</h3>
                  <div className="space-y-4">
                    {selectedPrescription.medications.map((medication) => (
                      <div key={medication.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{medication.name}</h4>
                            <p className="text-sm text-gray-600">
                              {medication.dosage} • {medication.frequency} • {medication.duration}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Cantidad: {medication.quantity}</p>
                            {medication.isGeneric && (
                              <p className="text-xs text-green-600">Genérico disponible</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Instrucciones:</span>
                            <p className="text-gray-900">{medication.instructions}</p>
                          </div>

                          {medication.sideEffects && medication.sideEffects.length > 0 && (
                            <div>
                              <span className="font-medium text-gray-700">
                                Efectos secundarios:
                              </span>
                              <ul className="list-disc list-inside text-gray-900">
                                {medication.sideEffects.map((effect, index) => (
                                  <li key={index}>{effect}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {medication.contraindications &&
                            medication.contraindications.length > 0 && (
                              <div>
                                <span className="font-medium text-gray-700">
                                  Contraindicaciones:
                                </span>
                                <ul className="list-disc list-inside text-gray-900">
                                  {medication.contraindications.map((contraindication, index) => (
                                    <li key={index}>{contraindication}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedPrescription.notes && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Notas Adicionales</h3>
                    <p className="text-gray-700">{selectedPrescription.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de reposición */}
      {showRefillModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Solicitar Reposición</h2>
              <p className="text-gray-600 mb-4">
                ¿Estás seguro de que quieres solicitar una reposición para esta receta?
              </p>

              <div className="bg-blue-50 p-4 rounded-md mb-4">
                <h3 className="font-medium text-gray-900 mb-2">
                  Receta #{selectedPrescription.id}
                </h3>
                <p className="text-sm text-gray-600">{selectedPrescription.diagnosis}</p>
                <p className="text-sm text-gray-600">
                  Reposiciones restantes: {selectedPrescription.refillsRemaining}
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowRefillModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    // Implementar solicitud de reposición
                    logger.info('Requesting refill for prescription:', selectedPrescription.id);
                    setShowRefillModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Solicitar Reposición
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
