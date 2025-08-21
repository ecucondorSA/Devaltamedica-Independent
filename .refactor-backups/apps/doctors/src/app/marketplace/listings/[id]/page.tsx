'use client';

import { Button, Card, Input } from '@altamedica/ui';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@altamedica/shared/services/logger.service';
import { 
  ArrowLeft,
  MapPin, 
  DollarSign, 
  Clock, 
  Calendar,
  Building2,
  Users,
  Briefcase,
  GraduationCap,
  Globe,
  Shield,
  Heart,
  Star,
  Check,
  AlertCircle,
  Stethoscope,
  FileText,
  Send
} from 'lucide-react';

// Tipo completo de oferta médica
interface JobOfferDetails {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  companyDescription?: string;
  location: string;
  locationType: 'remote' | 'on-site' | 'hybrid';
  salary: string;
  contractType: 'full-time' | 'part-time' | 'contract' | 'locum';
  specialty: string;
  postedDate: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  requirements: string[];
  benefits: string[];
  applicants: number;
  matchScore?: number;
  description: string;
  experienceRequired: string;
  certifications: string[];
  languages: string[];
  shiftType?: string;
  patientVolume?: string;
  department?: string;
  teamSize?: string;
  equipment?: string[];
  responsibilities: string[];
  qualifications: string[];
  applicationDeadline?: string;
  startDate?: string;
  contactPerson?: string;
  contactEmail?: string;
}

// Mock data completo (en producción vendría del API)
const mockJobDetails: { [key: string]: JobOfferDetails } = {
  'job-001': {
    id: 'job-001',
    title: 'Cardiólogo Intervencionista - Urgente',
    company: 'Hospital Central Buenos Aires',
    companyDescription: 'Somos el hospital de referencia en cardiología de Argentina, con más de 50 años de experiencia y tecnología de última generación.',
    location: 'Buenos Aires, Argentina',
    locationType: 'on-site',
    salary: 'USD 8,000 - 12,000/mes',
    contractType: 'full-time',
    specialty: 'Cardiología',
    postedDate: '2025-01-28',
    urgencyLevel: 'high',
    requirements: [
      'Especialidad en Cardiología con subespecialidad en Hemodinamia',
      'Mínimo 5 años de experiencia en procedimientos intervencionistas',
      'Certificación vigente del Colegio de Médicos',
      'Disponibilidad inmediata para incorporación',
      'Experiencia en angioplastias coronarias complejas',
      'Manejo de IVUS y FFR'
    ],
    benefits: [
      'Seguro médico familiar premium con cobertura internacional',
      'Educación médica continua - USD 5,000 anuales',
      'Bonos trimestrales por desempeño (hasta 30% del salario)',
      'Guardias bien remuneradas (USD 500-800 por guardia)',
      'Vacaciones 30 días + conferencias médicas',
      'Pensión privada con aporte patronal 10%',
      'Gimnasio y wellness center en el hospital',
      'Estacionamiento gratuito'
    ],
    applicants: 8,
    matchScore: 92,
    description: 'Buscamos un cardiólogo intervencionista altamente calificado para unirse a nuestro equipo de élite en el servicio de Hemodinamia. Trabajarás con tecnología de punta incluyendo salas de cateterismo de última generación, IVUS, FFR y aterectomía rotacional. Nuestro servicio realiza más de 2000 procedimientos anuales incluyendo angioplastias primarias 24/7.',
    experienceRequired: '5-10 años',
    certifications: ['Board Certified en Cardiología', 'ACLS', 'BLS', 'Certificación en Hemodinamia'],
    languages: ['Español nativo', 'Inglés avanzado'],
    shiftType: 'Rotativo con guardias activas y pasivas',
    patientVolume: 'Alto (30-40 pacientes ambulatorios/día + procedimientos)',
    department: 'Servicio de Hemodinamia y Cardiología Intervencionista',
    teamSize: '15 cardiólogos, 8 fellows, 20 enfermeras especializadas',
    equipment: [
      'Salas de cateterismo Philips Azurion',
      'IVUS (Intravascular Ultrasound)',
      'FFR (Fractional Flow Reserve)',
      'Aterectomía rotacional',
      'OCT (Optical Coherence Tomography)',
      'Litotricia intravascular'
    ],
    responsibilities: [
      'Realizar procedimientos de cateterismo diagnóstico y terapéutico',
      'Angioplastias coronarias complejas incluyendo CTO',
      'Participar en el programa de angioplastia primaria 24/7',
      'Supervisar y formar fellows de cardiología intervencionista',
      'Participar en reuniones multidisciplinarias del Heart Team',
      'Contribuir a protocolos de investigación clínica',
      'Mantener estándares de calidad y seguridad del paciente'
    ],
    qualifications: [
      'Título de Médico con especialidad en Cardiología',
      'Subespecialidad certificada en Hemodinamia/Cardiología Intervencionista',
      'Registro activo en el Colegio Médico',
      'Sin antecedentes de mala praxis',
      'Publicaciones en revistas indexadas (deseable)',
      'Experiencia docente (valorada)'
    ],
    applicationDeadline: '2025-02-15',
    startDate: 'Inmediato',
    contactPerson: 'Dr. Roberto Fernández - Jefe de Cardiología',
    contactEmail: 'rrhh.cardiologia@hospitalcentral.com.ar'
  },
  'job-002': {
    id: 'job-002',
    title: 'Pediatra - Telemedicina Internacional',
    company: 'AltaMedica Global Network',
    companyDescription: 'La red de telemedicina más grande de Latinoamérica, conectando médicos con pacientes en 15 países.',
    location: 'Remoto - LATAM',
    locationType: 'remote',
    salary: 'USD 60-100/hora',
    contractType: 'contract',
    specialty: 'Pediatría',
    postedDate: '2025-01-26',
    urgencyLevel: 'medium',
    requirements: [
      'Especialidad completa en Pediatría',
      'Mínimo 2 años de experiencia clínica',
      'Experiencia previa en telemedicina (deseable)',
      'Equipo propio: computadora, cámara HD, internet estable',
      'Disponibilidad mínima 10 horas semanales',
      'Licencia médica vigente en su país'
    ],
    benefits: [
      'Trabajo 100% remoto desde cualquier lugar',
      'Pagos semanales vía transferencia internacional',
      'Capacitación completa en plataforma AltaMedica',
      'Sin mínimo de horas - total flexibilidad',
      'Acceso a segunda opinión con especialistas',
      'Educación médica continua online gratuita',
      'Seguro de mala praxis incluido',
      'Bonos por satisfacción del paciente'
    ],
    applicants: 24,
    matchScore: 88,
    description: 'Únete a la revolución de la telemedicina pediátrica. Atenderás pacientes de toda Latinoamérica desde la comodidad de tu hogar u oficina. Nuestra plataforma cuenta con historia clínica electrónica integrada, prescripción digital y herramientas de IA para apoyo diagnóstico.',
    experienceRequired: '2+ años',
    certifications: ['Especialidad en Pediatría', 'Licencia médica vigente'],
    languages: ['Español fluido', 'Portugués (valorado)'],
    shiftType: 'Flexible - Tú eliges tus horarios',
    patientVolume: 'Moderado (10-15 consultas/día)',
    responsibilities: [
      'Consultas pediátricas virtuales de 20-30 minutos',
      'Evaluación y manejo de patologías pediátricas comunes',
      'Orientación a padres sobre cuidados y desarrollo infantil',
      'Prescripción electrónica cuando sea necesario',
      'Derivación a especialistas cuando se requiera',
      'Documentación completa en historia clínica electrónica'
    ],
    qualifications: [
      'Título de Médico con especialidad en Pediatría',
      'Registro médico activo',
      'Habilidades de comunicación excelentes',
      'Empatía y paciencia con niños y familias',
      'Manejo básico de tecnología',
      'Capacidad de trabajar de forma independiente'
    ],
    startDate: 'Inicio inmediato tras capacitación (1 semana)',
    contactEmail: 'reclutamiento@altamedica.global'
  }
};

// Modal de aplicación
const ApplicationModal = ({ 
  isOpen, 
  onClose, 
  jobTitle, 
  onSubmit 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  jobTitle: string;
  onSubmit: (data: any) => void;
}) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [availability, setAvailability] = useState('immediate');
  const [expectedSalary, setExpectedSalary] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      coverLetter,
      availability,
      expectedSalary
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Aplicar a: {jobTitle}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Carta de Presentación
            </label>
            <textarea
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Explica por qué eres el candidato ideal para esta posición..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Disponibilidad
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            >
              <option value="immediate">Inmediata</option>
              <option value="2weeks">En 2 semanas</option>
              <option value="1month">En 1 mes</option>
              <option value="2months">En 2 meses</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expectativa Salarial (USD/mes)
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: 8000-10000"
              value={expectedSalary}
              onChange={(e) => setExpectedSalary(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar Aplicación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente principal
const ListingDetailsPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const [listing, setListing] = useState<JobOfferDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      const jobDetails = mockJobDetails[params.id];
      if (jobDetails) {
        setListing(jobDetails);
      }
      setIsLoading(false);
    }, 500);

    // Verificar si ya aplicó (en producción vendría del API)
    const appliedJobs = JSON.parse(localStorage.getItem('appliedJobs') || '[]');
    setHasApplied(appliedJobs.includes(params.id));
  }, [params.id]);

  const handleApply = async (applicationData: any) => {
    try {
      // Simular envío de aplicación
      logger.info('Aplicando a:', params.id, applicationData);
      
      // Guardar en localStorage (en producción sería API)
      const appliedJobs = JSON.parse(localStorage.getItem('appliedJobs') || '[]');
      appliedJobs.push(params.id);
      localStorage.setItem('appliedJobs', JSON.stringify(appliedJobs));
      
      setHasApplied(true);
      setShowApplicationModal(false);
      
      // Mostrar notificación de éxito
      alert('¡Aplicación enviada con éxito!');
    } catch (error) {
      logger.error('Error al aplicar:', error);
      alert('Error al enviar la aplicación');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando detalles...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Oferta no encontrada</h3>
          <button
            onClick={() => router.push('/marketplace')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Volver al marketplace
          </button>
        </div>
      </div>
    );
  }

  const urgencyColors = {
    emergency: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200'
  };

  const locationIcons = {
    remote: '🏠',
    'on-site': '🏥',
    hybrid: '🔄'
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => router.push('/marketplace')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al marketplace
            </button>

            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
                <div className="flex items-center text-gray-600 space-x-4 mb-4">
                  <span className="flex items-center">
                    <Building2 className="w-5 h-5 mr-2" />
                    {listing.company}
                  </span>
                  <span className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    {listing.location}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Publicado {new Date(listing.postedDate).toLocaleDateString('es-ES')}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${urgencyColors[listing.urgencyLevel]}`}>
                    {listing.urgencyLevel === 'emergency' ? '🚨 Urgente' :
                     listing.urgencyLevel === 'high' ? '⚡ Alta Prioridad' :
                     listing.urgencyLevel === 'medium' ? '⏰ Media' : '✓ Normal'}
                  </span>

                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">
                    {locationIcons[listing.locationType]} {
                      listing.locationType === 'remote' ? 'Remoto' :
                      listing.locationType === 'on-site' ? 'Presencial' : 'Híbrido'
                    }
                  </span>

                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                    <Stethoscope className="w-4 h-4 inline mr-1" />
                    {listing.specialty}
                  </span>

                  {listing.matchScore && (
                    <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                      {listing.matchScore}% Match
                    </span>
                  )}
                </div>
              </div>

              <div className="text-center ml-8">
                <p className="text-sm text-gray-500 mb-1">Postulantes</p>
                <p className="text-3xl font-bold text-gray-900">{listing.applicants}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Descripción de la empresa */}
              {listing.companyDescription && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold mb-3">Sobre {listing.company}</h2>
                  <p className="text-gray-600">{listing.companyDescription}</p>
                </div>
              )}

              {/* Descripción del puesto */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-3">Descripción del Puesto</h2>
                <p className="text-gray-600 whitespace-pre-line">{listing.description}</p>
              </div>

              {/* Responsabilidades */}
              {listing.responsibilities && listing.responsibilities.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold mb-3">Responsabilidades Principales</h2>
                  <ul className="space-y-2">
                    {listing.responsibilities.map((resp, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requisitos */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-3">Requisitos</h2>
                <ul className="space-y-2">
                  {listing.requirements.map((req, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Calificaciones */}
              {listing.qualifications && listing.qualifications.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold mb-3">Calificaciones</h2>
                  <ul className="space-y-2">
                    {listing.qualifications.map((qual, index) => (
                      <li key={index} className="flex items-start">
                        <GraduationCap className="w-5 h-5 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{qual}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Beneficios */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-3">Beneficios</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {listing.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start">
                      <Heart className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equipamiento disponible */}
              {listing.equipment && listing.equipment.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold mb-3">Equipamiento y Tecnología</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {listing.equipment.map((item, index) => (
                      <div key={index} className="flex items-center">
                        <Shield className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-gray-600">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Columna lateral */}
            <div className="space-y-6">
              {/* Información clave */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
                <h3 className="text-lg font-semibold mb-4">Información Clave</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Salario</p>
                    <p className="font-semibold text-green-600 flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {listing.salary}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Tipo de Contrato</p>
                    <p className="font-semibold">
                      {listing.contractType === 'full-time' ? 'Tiempo Completo' :
                       listing.contractType === 'part-time' ? 'Medio Tiempo' :
                       listing.contractType === 'contract' ? 'Por Contrato' : 'Locum/Temporal'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Experiencia Requerida</p>
                    <p className="font-semibold">{listing.experienceRequired}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Horario</p>
                    <p className="font-semibold">{listing.shiftType || 'Por definir'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Volumen de Pacientes</p>
                    <p className="font-semibold">{listing.patientVolume || 'Por definir'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Idiomas</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {listing.languages.map((lang, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Certificaciones</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {listing.certifications.map((cert, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>

                  {listing.applicationDeadline && (
                    <div>
                      <p className="text-sm text-gray-500">Fecha Límite</p>
                      <p className="font-semibold text-red-600">
                        {new Date(listing.applicationDeadline).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  )}

                  {listing.startDate && (
                    <div>
                      <p className="text-sm text-gray-500">Fecha de Inicio</p>
                      <p className="font-semibold">{listing.startDate}</p>
                    </div>
                  )}
                </div>

                {/* Botón de aplicar */}
                <div className="mt-6">
                  {hasApplied ? (
                    <button
                      disabled
                      className="w-full py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed flex items-center justify-center"
                    >
                      <Check className="w-5 h-5 mr-2" />
                      Ya Aplicaste
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowApplicationModal(true)}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center font-semibold"
                    >
                      <Briefcase className="w-5 h-5 mr-2" />
                      Aplicar Ahora
                    </button>
                  )}
                </div>

                {/* Información de contacto */}
                {(listing.contactPerson || listing.contactEmail) && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500 mb-2">Contacto</p>
                    {listing.contactPerson && (
                      <p className="text-sm font-medium">{listing.contactPerson}</p>
                    )}
                    {listing.contactEmail && (
                      <p className="text-sm text-blue-600">{listing.contactEmail}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de aplicación */}
      <ApplicationModal
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        jobTitle={listing.title}
        onSubmit={handleApply}
      />
    </>
  );
};

export default ListingDetailsPage;