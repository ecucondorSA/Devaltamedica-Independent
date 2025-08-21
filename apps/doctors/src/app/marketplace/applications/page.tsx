'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  MapPin,
  DollarSign,
  Building2,
  AlertCircle,
  FileText,
  MessageSquare,
  Send
} from 'lucide-react';

// Tipo de aplicación
interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  salary: string;
  appliedDate: string;
  status: 'pending' | 'viewed' | 'interview' | 'accepted' | 'rejected';
  coverLetter: string;
  expectedSalary: string;
  availability: string;
  lastUpdate: string;
  recruiterNotes?: string;
  interviewDate?: string;
}

// Mock data de aplicaciones (en producción vendría del API)
const mockApplications: JobApplication[] = [
  {
    id: 'app-001',
    jobId: 'job-001',
    jobTitle: 'Cardiólogo Intervencionista - Urgente',
    company: 'Hospital Central Buenos Aires',
    location: 'Buenos Aires, Argentina',
    salary: 'USD 8,000 - 12,000/mes',
    appliedDate: '2025-01-28T10:30:00',
    status: 'viewed',
    coverLetter: 'Como cardiólogo con 7 años de experiencia en procedimientos intervencionistas...',
    expectedSalary: 'USD 10,000/mes',
    availability: 'immediate',
    lastUpdate: '2025-01-28T15:45:00',
    recruiterNotes: 'Perfil muy interesante. Programar entrevista para la próxima semana.'
  },
  {
    id: 'app-002',
    jobId: 'job-002',
    jobTitle: 'Pediatra - Telemedicina Internacional',
    company: 'AltaMedica Global Network',
    location: 'Remoto - LATAM',
    salary: 'USD 60-100/hora',
    appliedDate: '2025-01-26T14:20:00',
    status: 'interview',
    coverLetter: 'Mi experiencia en telemedicina pediátrica durante los últimos 3 años...',
    expectedSalary: 'USD 80/hora',
    availability: '2weeks',
    lastUpdate: '2025-01-27T09:00:00',
    interviewDate: '2025-01-30T16:00:00'
  },
  {
    id: 'app-003',
    jobId: 'job-003',
    jobTitle: 'Neurólogo - Centro de Investigación',
    company: 'Instituto Neurológico Argentino',
    location: 'Córdoba, Argentina',
    salary: 'USD 10,000 - 15,000/mes',
    appliedDate: '2025-01-25T11:00:00',
    status: 'pending',
    coverLetter: 'Mi interés en la investigación de enfermedades neurodegenerativas...',
    expectedSalary: 'USD 12,000/mes',
    availability: '1month',
    lastUpdate: '2025-01-25T11:00:00'
  },
  {
    id: 'app-004',
    jobId: 'job-004',
    jobTitle: 'Médico de Emergencias - Turno Nocturno',
    company: 'Clínica de Urgencias 24/7',
    location: 'Rosario, Argentina',
    salary: 'USD 6,000 - 8,000/mes + guardias',
    appliedDate: '2025-01-24T22:30:00',
    status: 'rejected',
    coverLetter: 'Con 5 años de experiencia en servicios de emergencia...',
    expectedSalary: 'USD 7,500/mes',
    availability: 'immediate',
    lastUpdate: '2025-01-28T08:00:00',
    recruiterNotes: 'No cumple con el requisito de disponibilidad nocturna exclusiva.'
  }
];

// Componente de tarjeta de aplicación
const ApplicationCard = ({ application }: { application: JobApplication }) => {
  const router = useRouter();
  
  const statusConfig = {
    pending: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: Clock,
      label: 'Pendiente'
    },
    viewed: {
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Eye,
      label: 'Vista'
    },
    interview: {
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: MessageSquare,
      label: 'Entrevista'
    },
    accepted: {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle,
      label: 'Aceptada'
    },
    rejected: {
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: XCircle,
      label: 'Rechazada'
    }
  };

  const config = statusConfig[application.status];
  const StatusIcon = config.icon;

  const getTimeDiff = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffDays > 0) return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    return 'hace unos minutos';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-1">
            {application.jobTitle}
          </h3>
          <div className="flex items-center text-gray-600 space-x-4 text-sm">
            <span className="flex items-center">
              <Building2 className="w-4 h-4 mr-1" />
              {application.company}
            </span>
            <span className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {application.location}
            </span>
          </div>
        </div>
        
        <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center ${config.color}`}>
          <StatusIcon className="w-4 h-4 mr-1" />
          {config.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p className="text-gray-500">Aplicado</p>
          <p className="font-medium">
            {new Date(application.appliedDate).toLocaleDateString('es-ES')}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Última actualización</p>
          <p className="font-medium">
            {getTimeDiff(application.lastUpdate)}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Salario esperado</p>
          <p className="font-medium text-green-600">
            {application.expectedSalary}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Disponibilidad</p>
          <p className="font-medium">
            {application.availability === 'immediate' ? 'Inmediata' :
             application.availability === '2weeks' ? 'En 2 semanas' :
             application.availability === '1month' ? 'En 1 mes' : 'En 2 meses'}
          </p>
        </div>
      </div>

      {/* Notas del reclutador */}
      {application.recruiterNotes && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-600">
            <strong>Nota del reclutador:</strong> {application.recruiterNotes}
          </p>
        </div>
      )}

      {/* Fecha de entrevista */}
      {application.interviewDate && (
        <div className="bg-purple-50 rounded-lg p-3 mb-4 flex items-center">
          <Calendar className="w-4 h-4 text-purple-600 mr-2" />
          <p className="text-sm font-medium text-purple-900">
            Entrevista programada: {new Date(application.interviewDate).toLocaleString('es-ES')}
          </p>
        </div>
      )}

      <div className="flex justify-between items-center pt-4 border-t">
        <button
          onClick={() => router.push(`/marketplace/listings/${application.jobId}`)}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
        >
          <FileText className="w-4 h-4 mr-1" />
          Ver oferta
        </button>
        
        {application.status === 'interview' && (
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
            Preparar entrevista
          </button>
        )}
      </div>
    </div>
  );
};

// Componente principal
const ApplicationsPage = () => {
  const router = useRouter();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setApplications(mockApplications);
      setIsLoading(false);
    }, 500);
  }, []);

  const filteredApplications = filter === 'all' 
    ? applications 
    : applications.filter(app => app.status === filter);

  const statusCounts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    viewed: applications.filter(a => a.status === 'viewed').length,
    interview: applications.filter(a => a.status === 'interview').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando aplicaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push('/marketplace')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al marketplace
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mis Postulaciones</h1>
              <p className="text-sm text-gray-600 mt-1">
                Seguimiento de todas tus aplicaciones a ofertas de trabajo
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{statusCounts.all}</p>
              <p className="text-sm text-gray-500">Total aplicaciones</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros de estado */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas ({statusCounts.all})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                filter === 'pending' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Clock className="w-4 h-4 mr-1" />
              Pendientes ({statusCounts.pending})
            </button>
            <button
              onClick={() => setFilter('viewed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                filter === 'viewed' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Eye className="w-4 h-4 mr-1" />
              Vistas ({statusCounts.viewed})
            </button>
            <button
              onClick={() => setFilter('interview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                filter === 'interview' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Entrevistas ({statusCounts.interview})
            </button>
            <button
              onClick={() => setFilter('accepted')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                filter === 'accepted' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Aceptadas ({statusCounts.accepted})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                filter === 'rejected' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Rechazadas ({statusCounts.rejected})
            </button>
          </div>
        </div>
      </div>

      {/* Lista de aplicaciones */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay aplicaciones {filter !== 'all' && `con estado "${statusCounts[filter as keyof typeof statusCounts]}"`}
            </h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all' 
                ? 'Comienza aplicando a ofertas de trabajo en el marketplace'
                : 'Intenta con otro filtro para ver tus aplicaciones'}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => router.push('/marketplace')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Explorar ofertas
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredApplications.map(application => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationsPage;
