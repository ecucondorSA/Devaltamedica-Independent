// apps/doctors/src/lib/firestore-stub.ts
import { logger } from '@altamedica/shared';

const fallbackMarketplaceOffers = [
  {
    id: '1',
    title: 'Cardiólogo Senior',
    company: 'Hospital Universitario Madrid',
    location: 'Madrid, España',
    specialty: 'Cardiología',
    type: 'job',
    salary: '€80,000 - €120,000',
    postedDate: '2024-01-20',
    applications: 15,
    rating: 4.5,
    urgent: true,
    description:
      'Buscamos un cardiólogo experimentado para nuestro departamento de cardiología. Responsabilidades incluyen diagnóstico y tratamiento de enfermedades cardiovasculares, interpretación de pruebas diagnósticas y colaboración con el equipo multidisciplinario.',
    requirements: [
      'Especialidad en Cardiología',
      '5+ años de experiencia',
      'Certificación europea',
      'Manejo de equipos de diagnóstico',
    ],
    benefits: [
      'Seguro médico completo',
      'Horario flexible',
      'Desarrollo profesional',
      'Bonificaciones por rendimiento',
    ],
    experience: '5+ años',
    schedule: 'Tiempo completo',
    remote: false,
    companySize: '500-1000 empleados',
    companyIndustry: 'Salud',
    companyLogo: '/api/placeholder/60/60',
  },
  // ... (add other fallback offers if needed)
];

export const marketplaceService = {
  getOffers: async (filters: any) => {
    logger.info('Firestore stub: getOffers called with filters:', filters);
    // Simulate filtering
    let filteredOffers = fallbackMarketplaceOffers;
    // (Add filtering logic here if you want to simulate it)
    return Promise.resolve(filteredOffers);
  },
  applyToOffer: async (application: any) => {
    logger.info('Firestore stub: applyToOffer called with application:', application);
    const applicationId = `app_${Date.now()}`;
    return Promise.resolve(applicationId);
  },
};