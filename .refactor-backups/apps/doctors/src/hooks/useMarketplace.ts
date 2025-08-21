import { useState, useEffect, useCallback } from 'react';
import { matchingApiService } from '../services/matching-api.service';
import { notificationService } from '../services/notification.service';

import { logger } from '@altamedica/shared/services/logger.service';
interface JobOffer {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
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
  responsibilities?: string[];
  qualifications?: string[];
  applicationDeadline?: string;
  startDate?: string;
  contactPerson?: string;
  contactEmail?: string;
}

interface DoctorProfile {
  id: string;
  name: string;
  specialties: string[];
  certifications: string[];
  experience_years: number;
  location: {
    city: string;
    state: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  languages: string[];
  availability: 'immediate' | 'negotiable' | 'not_available';
  preferred_work_type: ('remote' | 'on-site' | 'hybrid')[];
  salary_expectations?: {
    min: number;
    max: number;
    currency: string;
  };
}

// Convertir resultado de matching a JobOffer
function convertMatchToJobOffer(match: any): JobOffer {
  const pricing = match.pricing_estimate;
  const salaryStr = pricing 
    ? `${pricing.currency} ${pricing.amount.toLocaleString()}${pricing.period ? '/' + pricing.period : ''}`
    : 'A convenir';

  return {
    id: match.match_id,
    title: `Oportunidad en ${match.company.name}`,
    company: match.company.name,
    companyLogo: match.company.logo,
    location: `${match.distance_km}km de tu ubicación`,
    locationType: match.distance_km > 50 ? 'remote' : 'on-site',
    salary: salaryStr,
    contractType: 'full-time', // Por defecto
    specialty: match.specialties_match[0] || 'General',
    postedDate: new Date().toISOString(),
    urgencyLevel: 'medium',
    requirements: match.match_reasons,
    benefits: match.next_steps,
    applicants: Math.floor(Math.random() * 20) + 1,
    matchScore: Math.round(match.score),
    description: `Oportunidad profesional en ${match.company.name}. ${match.match_reasons.join('. ')}.`,
    experienceRequired: '3+ años',
    certifications: [],
    languages: ['Español'],
    shiftType: 'Por definir',
    patientVolume: 'Moderado'
  };
}

export function useMarketplace() {
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);

  // Cargar perfil del doctor
  useEffect(() => {
    loadDoctorProfile();
  }, []);

  // Cargar ofertas cuando el perfil esté listo
  useEffect(() => {
    if (doctorProfile) {
      loadJobOffers();
      
      // Conectar a actualizaciones en tiempo real
      matchingApiService.connectToRealTimeUpdates(doctorProfile.id, handleRealtimeUpdate);
      
      return () => {
        matchingApiService.disconnect();
      };
    }
  }, [doctorProfile]);

  const loadDoctorProfile = async () => {
    try {
      // Cargar del localStorage o API
      const savedProfile = localStorage.getItem('doctorProfile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        setDoctorProfile({
          id: profile.id || 'doc_123',
          name: `${profile.firstName} ${profile.lastName}`,
          specialties: profile.specialties || [],
          certifications: profile.certifications?.map((c: any) => c.name) || [],
          experience_years: profile.yearsOfExperience || 0,
          location: {
            city: profile.location?.city || 'Buenos Aires',
            state: profile.location?.state || 'Buenos Aires',
            country: profile.location?.country || 'Argentina',
            latitude: -34.6037,
            longitude: -58.3816
          },
          languages: profile.languages?.map((l: any) => l.language) || ['Español'],
          availability: profile.availability === 'immediate' ? 'immediate' : 'negotiable',
          preferred_work_type: profile.workPreferences?.remote ? ['remote', 'hybrid'] : ['on-site'],
          salary_expectations: profile.salaryExpectations
        });
      } else {
        // Perfil por defecto
        setDoctorProfile({
          id: 'doc_123',
          name: 'Dr. Carlos López',
          specialties: ['Cardiología'],
          certifications: ['Board Certified'],
          experience_years: 10,
          location: {
            city: 'Buenos Aires',
            state: 'Buenos Aires',
            country: 'Argentina',
            latitude: -34.6037,
            longitude: -58.3816
          },
          languages: ['Español', 'Inglés'],
          availability: 'immediate',
          preferred_work_type: ['on-site', 'hybrid'],
          salary_expectations: {
            min: 8000,
            max: 12000,
            currency: 'USD'
          }
        });
      }
    } catch (error) {
      logger.error('Error loading doctor profile:', error);
    }
  };

  const loadJobOffers = async () => {
    if (!doctorProfile) return;

    setIsLoading(true);
    setError(null);

    try {
      // Obtener ofertas de la API de matching
      const matches = await matchingApiService.findJobOpportunities(doctorProfile);
      
      if (matches.length > 0) {
        const jobOffers = matches.map(convertMatchToJobOffer);
        setJobs(jobOffers);
        
        // Notificar sobre ofertas con alto match score
        jobOffers.forEach(job => {
          if (job.matchScore && job.matchScore >= 80) {
            notificationService.notifyJobMatch({
              id: job.id,
              title: job.title,
              company: job.company,
              matchScore: job.matchScore,
              salary: job.salary
            });
          }
        });
      } else {
        // Si no hay matches, usar datos mock
        setJobs(getMockJobs());
      }
    } catch (error) {
      logger.error('Error loading job offers:', error);
      setError('Error al cargar las ofertas');
      // Usar datos mock como fallback
      setJobs(getMockJobs());
    } finally {
      setIsLoading(false);
    }
  };

  const handleRealtimeUpdate = (data: any) => {
    logger.info('Realtime update received:', data);
    // Actualizar ofertas si hay nuevas
    if (data.type === 'new_match' && data.match) {
      const newJob = convertMatchToJobOffer(data.match);
      setJobs(prev => [newJob, ...prev]);
      
      // Notificar sobre la nueva oferta
      if (newJob.matchScore && newJob.matchScore >= 80) {
        notificationService.notifyJobMatch({
          id: newJob.id,
          title: newJob.title,
          company: newJob.company,
          matchScore: newJob.matchScore,
          salary: newJob.salary
        });
      }
    }
  };

  const applyToJob = useCallback(async (
    jobId: string,
    applicationData: {
      coverLetter: string;
      availability: string;
      expectedSalary: string;
    }
  ) => {
    if (!doctorProfile) {
      return { success: false, error: 'Perfil no encontrado' };
    }

    try {
      const result = await matchingApiService.applyToJob(
        doctorProfile.id,
        jobId,
        applicationData
      );
      
      if (result.success) {
        // Guardar aplicación localmente
        const applications = JSON.parse(localStorage.getItem('jobApplications') || '[]');
        applications.push({
          id: result.applicationId,
          jobId,
          doctorId: doctorProfile.id,
          appliedDate: new Date().toISOString(),
          status: 'pending',
          ...applicationData
        });
        localStorage.setItem('jobApplications', JSON.stringify(applications));
      }
      
      return result;
    } catch (error) {
      logger.error('Error applying to job:', error);
      return { success: false, error: 'Error al enviar la aplicación' };
    }
  }, [doctorProfile]);

  const refreshJobs = useCallback(() => {
    loadJobOffers();
  }, [doctorProfile]);

  return {
    jobs,
    isLoading,
    error,
    doctorProfile,
    applyToJob,
    refreshJobs
  };
}

// Datos mock como fallback
function getMockJobs(): JobOffer[] {
  return [
    {
      id: 'job-001',
      title: 'Cardiólogo Intervencionista - Urgente',
      company: 'Hospital Central Buenos Aires',
      location: 'Buenos Aires, Argentina',
      locationType: 'on-site',
      salary: 'USD 8,000 - 12,000/mes',
      contractType: 'full-time',
      specialty: 'Cardiología',
      postedDate: '2025-01-28',
      urgencyLevel: 'high',
      requirements: [
        'Especialidad en Cardiología',
        '5+ años en procedimientos intervencionistas',
        'Certificación vigente',
        'Disponibilidad inmediata'
      ],
      benefits: [
        'Seguro médico familiar premium',
        'Educación continua pagada',
        'Bonos por desempeño',
        'Guardias bien remuneradas'
      ],
      applicants: 8,
      matchScore: 92,
      description: 'Buscamos cardiólogo especializado en procedimientos intervencionistas para unirse a nuestro equipo de élite.',
      experienceRequired: '5-10 años',
      certifications: ['Board Certified', 'ACLS', 'BLS'],
      languages: ['Español', 'Inglés'],
      shiftType: 'Rotativo con guardias',
      patientVolume: 'Alto (30-40 pacientes/día)'
    },
    {
      id: 'job-002',
      title: 'Pediatra - Telemedicina Internacional',
      company: 'AltaMedica Global Network',
      location: 'Remoto - LATAM',
      locationType: 'remote',
      salary: 'USD 60-100/hora',
      contractType: 'contract',
      specialty: 'Pediatría',
      postedDate: '2025-01-26',
      urgencyLevel: 'medium',
      requirements: [
        'Especialidad en Pediatría',
        'Experiencia en telemedicina',
        'Equipo propio para videollamadas',
        'Horario flexible'
      ],
      benefits: [
        'Trabajo 100% remoto',
        'Pagos semanales',
        'Capacitación en plataforma',
        'Sin mínimo de horas'
      ],
      applicants: 24,
      matchScore: 88,
      description: 'Únete a la red de telemedicina más grande de Latinoamérica. Atiende pacientes desde la comodidad de tu hogar.',
      experienceRequired: '2+ años',
      certifications: ['Licencia médica vigente'],
      languages: ['Español', 'Portugués (deseable)'],
      shiftType: 'Flexible - Tu eliges',
      patientVolume: 'Moderado (10-15 consultas/día)'
    }
  ];
}