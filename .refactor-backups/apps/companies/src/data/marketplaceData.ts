import type { LatLngTuple } from 'leaflet';
import type { MarketplaceDoctor, MarketplaceCompany, DoctorService } from '@/contexts/MarketplaceContext';

// Médicos disponibles en el marketplace
export const marketplaceDoctors: MarketplaceDoctor[] = [
  {
    id: 'dr-martinez-001',
    name: 'Dr. Carlos Martínez',
    specialties: ['Cardiología', 'Medicina Interna'],
    location: {
      city: 'Buenos Aires',
      country: 'Argentina',
      coordinates: [-34.6037, -58.3816] as LatLngTuple,
    },
    rating: 4.8,
    experience: 12,
    hourlyRate: 85,
    availableForHiring: true,
    responseTime: 2,
    totalHires: 47,
    isUrgentAvailable: true,
    profileImage: '/doctor-martinez.jpg',
    isOnline: true,
    lastActive: '2025-08-09T10:30:00Z',
    workArrangement: 'hybrid',
    languages: ['Español', 'Inglés'],
    verificationStatus: 'verified',
    // Solo disponible para contratación, no publica servicios directos
    offersDirectServices: false,
  },
  {
    id: 'dr-lopez-002',
    name: 'Dra. María López',
    specialties: ['Pediatría', 'Neonatología'],
    location: {
      city: 'Córdoba',
      country: 'Argentina',
      coordinates: [-31.4135, -64.1811] as LatLngTuple,
    },
    rating: 4.9,
    experience: 8,
    hourlyRate: 75,
    availableForHiring: true,
    responseTime: 1.5,
    totalHires: 32,
    isUrgentAvailable: false,
    profileImage: '/doctor-lopez.jpg',
    isOnline: true,
    lastActive: '2025-08-09T09:15:00Z',
    workArrangement: 'remote',
    languages: ['Español', 'Portugués'],
    verificationStatus: 'verified',
    // Solo disponible para contratación
    offersDirectServices: false,
  },
  {
    id: 'dr-rodriguez-003',
    name: 'Dr. Alejandro Rodríguez',
    specialties: ['Neurología', 'Neurocirugía'],
    location: {
      city: 'Rosario',
      country: 'Argentina',
      coordinates: [-32.9442, -60.6505] as LatLngTuple,
    },
    rating: 4.7,
    experience: 15,
    hourlyRate: 120,
    availableForHiring: true,
    responseTime: 3,
    totalHires: 58,
    isUrgentAvailable: true,
    profileImage: '/doctor-rodriguez.jpg',
    isOnline: false,
    lastActive: '2025-08-01T08:45:00Z',
    workArrangement: 'on_site',
    languages: ['Español', 'Inglés', 'Francés'],
    verificationStatus: 'verified',
    // Solo disponible para contratación
    offersDirectServices: false,
  },
  {
    id: 'dr-garcia-004',
    name: 'Dr. Roberto García',
    specialties: ['Dermatología', 'Cirugía Dermatológica'],
    location: {
      city: 'Mendoza',
      country: 'Argentina',
      coordinates: [-32.8908, -68.8272] as LatLngTuple,
    },
    rating: 4.6,
    experience: 7,
    hourlyRate: 65,
    availableForHiring: true,
    responseTime: 4,
    totalHires: 23,
    isUrgentAvailable: false,
    profileImage: '/doctor-garcia.jpg',
    isOnline: false,
    lastActive: '2025-08-09T14:20:00Z',
    workArrangement: 'on_site',
    languages: ['Español'],
    verificationStatus: 'verified',
    // Este doctor SÍ publica servicios directos
    offersDirectServices: true,
    publishedServices: [
      {
        id: 'service-garcia-001',
        title: 'Consulta Dermatológica Preventiva',
        description: 'Chequeo dermatológico completo para detección temprana de lesiones.',
        category: 'consultation',
        price: {
          amount: 60,
          currency: 'USD',
          type: 'per_session'
        },
        availability: {
          schedule: 'Martes y Jueves 16:00-18:00',
          timeSlots: ['16:00', '16:30', '17:00', '17:30']
        },
        deliveryMethod: 'in_person',
        postedDate: '2025-08-09',
        isActive: true
      }
    ]
  },
  {
    id: 'dr-silva-005',
    name: 'Dra. Ana Silva',
    specialties: ['Psiquiatría', 'Psicoterapia'],
    location: {
      city: 'Montevideo',
      country: 'Uruguay',
      coordinates: [-34.9011, -56.1645] as LatLngTuple,
    },
    rating: 4.9,
    experience: 10,
    hourlyRate: 80,
    availableForHiring: true,
    responseTime: 1,
    totalHires: 65,
    isUrgentAvailable: true,
    profileImage: '/doctor-silva.jpg',
    isOnline: true,
    lastActive: '2025-08-09T11:45:00Z',
    workArrangement: 'flexible',
    languages: ['Español', 'Inglés', 'Portugués'],
    verificationStatus: 'verified',
    // Esta doctora SÍ publica servicios directos
    offersDirectServices: true,
    publishedServices: [
      {
        id: 'service-silva-001',
        title: 'Consulta Psiquiátrica Online',
        description: 'Evaluación psiquiátrica completa por videollamada segura. Diagnóstico y plan de tratamiento personalizado.',
        category: 'consultation',
        price: {
          amount: 80,
          currency: 'USD',
          type: 'per_session'
        },
        availability: {
          schedule: 'Lunes a Viernes 9:00-17:00, Sábados 9:00-13:00',
          timeSlots: ['09:00', '10:30', '12:00', '14:00', '15:30']
        },
        deliveryMethod: 'telemedicine',
        postedDate: '2025-08-09',
        isActive: true
      },
      {
        id: 'service-silva-002', 
        title: 'Segunda Opinión Psiquiátrica',
        description: 'Revisión de diagnóstico existente y recomendaciones de tratamiento alternativo.',
        category: 'second_opinion',
        price: {
          amount: 120,
          currency: 'USD',
          type: 'fixed_price'
        },
        availability: {
          schedule: 'Disponible en 24-48 horas',
          timeSlots: ['flexible']
        },
        deliveryMethod: 'telemedicine',
        postedDate: '2025-08-09',
        isActive: true
      }
    ]
  },
];

// Datos unificados de empresas para el marketplace
export const marketplaceCompanies: MarketplaceCompany[] = [
  // AltaMedica - Servicios B2B de tecnología médica
  {
    id: "altamedica-services-001",
    name: "AltaMedica - Servicios Tecnológicos",
    industry: "Tecnología Médica",
    location: {
      city: "Buenos Aires",
      country: "Argentina",
      coordinates: [-34.6118, -58.3960] as LatLngTuple
    },
    rating: 4.9,
    size: "50-100 empleados",
    activeJobs: 4,
    urgentJobs: 1,
    isActivelyHiring: false, // Proveedor de servicios, no contratante
    averageResponseTime: 2,
    totalHires: 0,
    companyType: 'startup',
    jobs: [
      {
        id: "am-telemedicine-setup",
        title: "Implementación de Telemedicina para Clínicas",
        company: "AltaMedica - Servicios Tecnológicos", 
        companyId: "altamedica-services-001",
        location: "Remoto - Latinoamérica",
        specialty: "Tecnología Médica",
        type: "consultation",
        salary: "USD 5,000 - 15,000 por proyecto",
        postedDate: "2025-08-09",
        applications: 0,
        rating: 4.9,
        urgent: false,
        description: "Implementamos plataformas completas de telemedicina con videollamadas seguras, cumplimiento HIPAA y latencia <100ms.",
        requirements: [],
        benefits: [
          "Setup completo en 2-4 semanas",
          "Soporte técnico 24/7",
          "Capacitación del personal incluida",
          "Cumplimiento HIPAA garantizado"
        ],
        experience: "Servicio",
        schedule: "Por proyecto",
        remote: true,
        status: 'active'
      },
      {
        id: "am-medical-ai-integration",
        title: "Integración de IA para Diagnósticos",
        company: "AltaMedica - Servicios Tecnológicos",
        companyId: "altamedica-services-001", 
        location: "Remoto - Latinoamérica",
        specialty: "Inteligencia Artificial Médica",
        type: "consultation",
        salary: "USD 8,000 - 25,000 por proyecto",
        postedDate: "2025-08-09",
        applications: 0,
        rating: 4.9,
        urgent: true,
        description: "Implementamos sistemas de IA para asistir en diagnósticos médicos, análisis de síntomas y predicciones de salud.",
        requirements: [],
        benefits: [
          "IA entrenada con datos médicos certificados",
          "Integración con sistemas existentes",
          "Análisis predictivo avanzado",
          "ROI comprobado del 40-60%"
        ],
        experience: "Servicio",
        schedule: "Por proyecto",
        remote: true,
        status: 'active'
      }
    ]
  },
  {
    id: "hospital-san-vicente-001",
    name: "Hospital San Vicente",
    industry: "Salud y Medicina",
    location: {
      city: "Buenos Aires",
      country: "Argentina",
      coordinates: [-34.6037, -58.3816] as LatLngTuple
    },
    rating: 4.8,
    size: "Grande (500+ empleados)",
    activeJobs: 15,
    urgentJobs: 3,
    isActivelyHiring: true,
    averageResponseTime: 2.4,
    totalHires: 127,
    companyType: 'hospital',
    jobs: [
      {
        id: "hsv-cardio-001",
        title: "Cardiólogo Intervencionista Senior",
        company: "Hospital San Vicente",
        companyId: "hospital-san-vicente-001",
        location: "Buenos Aires, Argentina",
        specialty: "Cardiología",
        type: "job",
        salary: "USD 12,000 - 18,000",
        postedDate: "2025-07-28",
        applications: 23,
        rating: 4.9,
        urgent: true,
        description: "Buscamos cardiólogo intervencionista con amplia experiencia en cateterismo cardíaco y angioplastias.",
        requirements: [
          "Especialización en Cardiología",
          "8+ años experiencia",
          "Certificación en Hemodinamia"
        ],
        benefits: [
          "Obra social premium",
          "Capacitación continua",
          "Horarios flexibles"
        ],
        experience: "Senior (8+ años)",
        schedule: "Tiempo completo con guardias",
        remote: false,
        status: 'active'
      },
      {
        id: "hsv-pediatra-002",
        title: "Pediatra - Telemedicina",
        company: "Hospital San Vicente",
        companyId: "hospital-san-vicente-001",
        location: "Buenos Aires, Argentina (Remoto)",
        specialty: "Pediatría",
        type: "contract",
        salary: "USD 4,500 - 6,500",
        postedDate: "2025-07-29",
        applications: 41,
        rating: 4.7,
        urgent: false,
        description: "Oportunidad de telemedicina para atención pediátrica virtual.",
        requirements: [
          "Especialización en Pediatría",
          "3+ años experiencia",
          "Experiencia en telemedicina"
        ],
        benefits: [
          "Trabajo remoto",
          "Tecnología de punta",
          "Flexibilidad horaria"
        ],
        experience: "Semi-senior (3-7 años)",
        schedule: "Flexible",
        remote: true,
        status: 'active'
      },
      {
        id: "hsv-neurologia-003",
        title: "Neurólogo - Urgencias",
        company: "Hospital San Vicente",
        companyId: "hospital-san-vicente-001",
        location: "Buenos Aires, Argentina",
        specialty: "Neurología",
        type: "job",
        salary: "USD 10,000 - 14,000",
        postedDate: "2025-07-30",
        applications: 8,
        rating: 4.8,
        urgent: true,
        description: "Neurólogo para área de emergencias con disponibilidad inmediata.",
        requirements: [
          "Especialización en Neurología",
          "5+ años experiencia",
          "Disponibilidad guardias"
        ],
        benefits: [
          "Excelente remuneración",
          "Equipo multidisciplinario",
          "Tecnología avanzada"
        ],
        experience: "Senior (5+ años)",
        schedule: "Guardias rotativas",
        remote: false,
        status: 'active'
      }
    ]
  },
  {
    id: "hospital-italiano-001",
    name: "Hospital Italiano de Buenos Aires",
    industry: "Salud",
    location: {
      city: "Buenos Aires",
      country: "Argentina",
      coordinates: [-34.5990, -58.3974] as LatLngTuple
    },
    rating: 4.9,
    size: "1000+ empleados",
    activeJobs: 5,
    urgentJobs: 2,
    isActivelyHiring: true,
    averageResponseTime: 24,
    totalHires: 150,
    companyType: 'hospital',
    jobs: [
      {
        id: "hi-cardio-001",
        title: "Cardiólogo Intervencionista",
        company: "Hospital Italiano de Buenos Aires",
        companyId: "hospital-italiano-001",
        location: "Buenos Aires, Argentina",
        specialty: "Cardiología",
        type: "job",
        salary: "USD 8,000 - 12,000",
        postedDate: "2025-01-15",
        applications: 12,
        rating: 4.9,
        urgent: true,
        description: "Buscamos cardiólogo especializado en procedimientos intervencionistas para nuestro departamento de cardiología.",
        requirements: [
          "Especialidad en Cardiología",
          "Experiencia mínima 5 años",
          "Certificación en procedimientos intervencionistas"
        ],
        benefits: [
          "Seguro médico familiar",
          "Capacitación continua",
          "Horario flexible"
        ],
        experience: "5-10 años",
        schedule: "Tiempo completo",
        remote: false,
        status: 'active'
      }
    ]
  },
  {
    id: "hospital-metropolitano-001",
    name: "Hospital Metropolitano",
    industry: "Salud",
    location: {
      city: "Quito",
      country: "Ecuador",
      coordinates: [-0.1807, -78.4678] as LatLngTuple
    },
    rating: 4.8,
    size: "500-1000 empleados",
    activeJobs: 3,
    urgentJobs: 1,
    isActivelyHiring: true,
    averageResponseTime: 36,
    totalHires: 98,
    companyType: 'hospital',
    jobs: [
      {
        id: "hm-oncologo-001",
        title: "Oncólogo Médico",
        company: "Hospital Metropolitano",
        companyId: "hospital-metropolitano-001",
        location: "Quito, Ecuador",
        specialty: "Oncología",
        type: "job",
        salary: "USD 5,000 - 8,000",
        postedDate: "2025-01-08",
        applications: 11,
        rating: 4.8,
        description: "Oncólogo para nuestro departamento de oncología con experiencia en tratamientos innovadores.",
        requirements: [
          "Especialidad en Oncología",
          "Experiencia en tratamientos innovadores",
          "Certificación internacional"
        ],
        benefits: [
          "Equipamiento de última generación",
          "Capacitación internacional",
          "Investigación clínica"
        ],
        experience: "3-7 años",
        schedule: "Tiempo completo",
        remote: true,
        status: 'active'
      },
      {
        id: "hm-pediatra-001",
        title: "Pediatra - Telemedicina",
        company: "Hospital Metropolitano",
        companyId: "hospital-metropolitano-001",
        location: "Remoto - Latinoamérica",
        specialty: "Pediatría",
        type: "contract",
        salary: "USD 50 - 80 por hora",
        postedDate: "2025-01-20",
        applications: 45,
        rating: 4.7,
        description: "Pediatra para consultas de telemedicina con disponibilidad flexible.",
        requirements: [
          "Especialidad en Pediatría",
          "Experiencia en telemedicina",
          "Disponibilidad mínima 20 horas/semana"
        ],
        benefits: [
          "Horario flexible",
          "Trabajo 100% remoto",
          "Bonos por productividad"
        ],
        experience: "2-5 años",
        schedule: "Medio tiempo",
        remote: true,
        status: 'active'
      }
    ]
  }
];