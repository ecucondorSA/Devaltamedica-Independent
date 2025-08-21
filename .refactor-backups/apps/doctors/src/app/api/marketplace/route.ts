import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '../../../lib/auth-middleware';
import { marketplaceService } from '../../../lib/firestore';

import { logger } from '@altamedica/shared/services/logger.service';
// Fallback data for when Firestore is not available
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
    description: 'Buscamos un cardiólogo experimentado para nuestro departamento de cardiología. Responsabilidades incluyen diagnóstico y tratamiento de enfermedades cardiovasculares, interpretación de pruebas diagnósticas y colaboración con el equipo multidisciplinario.',
    requirements: ['Especialidad en Cardiología', '5+ años de experiencia', 'Certificación europea', 'Manejo de equipos de diagnóstico'],
    benefits: ['Seguro médico completo', 'Horario flexible', 'Desarrollo profesional', 'Bonificaciones por rendimiento'],
    experience: '5+ años',
    schedule: 'Tiempo completo',
    remote: false,
    companySize: '500-1000 empleados',
    companyIndustry: 'Salud',
    companyLogo: '/api/placeholder/60/60'
  },
  {
    id: '2',
    title: 'Pediatra - Consulta Privada',
    company: 'Clínica Infantil Barcelona',
    location: 'Barcelona, España',
    specialty: 'Pediatría',
    type: 'contract',
    salary: '€60,000 - €90,000',
    postedDate: '2024-01-18',
    applications: 8,
    rating: 4.8,
    urgent: false,
    description: 'Oportunidad para un pediatra en nuestra clínica especializada en atención infantil. Ambiente familiar y equipo de apoyo completo.',
    requirements: ['Especialidad en Pediatría', '3+ años de experiencia', 'Buen trato con niños', 'Disponibilidad para guardias'],
    benefits: ['Horario de lunes a viernes', 'Vacaciones pagadas', 'Formación continua', 'Ambiente familiar'],
    experience: '3+ años',
    schedule: 'Tiempo completo',
    remote: false,
    companySize: '50-100 empleados',
    companyIndustry: 'Salud',
    companyLogo: '/api/placeholder/60/60'
  },
  {
    id: '3',
    title: 'Dermatólogo - Telemedicina',
    company: 'MedTech Solutions',
    location: 'Remoto',
    specialty: 'Dermatología',
    type: 'consultation',
    salary: '€70,000 - €100,000',
    postedDate: '2024-01-15',
    applications: 12,
    rating: 4.2,
    urgent: true,
    description: 'Dermatólogo para consultas de telemedicina. Plataforma tecnológica avanzada y horario flexible.',
    requirements: ['Especialidad en Dermatología', 'Experiencia en telemedicina', 'Manejo de plataformas digitales', 'Disponibilidad horaria flexible'],
    benefits: ['Trabajo remoto', 'Horario flexible', 'Tecnología de vanguardia', 'Ingresos por comisión'],
    experience: '2+ años',
    schedule: 'Tiempo parcial',
    remote: true,
    companySize: '100-500 empleados',
    companyIndustry: 'Tecnología de la Salud',
    companyLogo: '/api/placeholder/60/60'
  },
  {
    id: '4',
    title: 'Ginecólogo - Hospital Privado',
    company: 'Centro Médico Valencia',
    location: 'Valencia, España',
    specialty: 'Ginecología',
    type: 'job',
    salary: '€90,000 - €130,000',
    postedDate: '2024-01-12',
    applications: 6,
    rating: 4.6,
    urgent: false,
    description: 'Ginecólogo para nuestro centro médico privado. Equipamiento de última generación y equipo de apoyo completo.',
    requirements: ['Especialidad en Ginecología', '7+ años de experiencia', 'Certificación en ecografía', 'Disponibilidad para urgencias'],
    benefits: ['Salario competitivo', 'Equipamiento avanzado', 'Cobertura de seguros', 'Desarrollo profesional'],
    experience: '7+ años',
    schedule: 'Tiempo completo',
    remote: false,
    companySize: '200-500 empleados',
    companyIndustry: 'Salud',
    companyLogo: '/api/placeholder/60/60'
  },
  {
    id: '5',
    title: 'Psiquiatra - Centro de Salud Mental',
    company: 'Instituto de Salud Mental Madrid',
    location: 'Madrid, España',
    specialty: 'Psiquiatría',
    type: 'partnership',
    salary: '€75,000 - €110,000',
    postedDate: '2024-01-10',
    applications: 10,
    rating: 4.4,
    urgent: false,
    description: 'Psiquiatra para nuestro centro especializado en salud mental. Enfoque en terapia cognitivo-conductual y medicación.',
    requirements: ['Especialidad en Psiquiatría', '4+ años de experiencia', 'Certificación en terapias específicas', 'Buenas habilidades de comunicación'],
    benefits: ['Entorno de trabajo tranquilo', 'Formación continua', 'Horario regular', 'Apoyo psicológico'],
    experience: '4+ años',
    schedule: 'Tiempo completo',
    remote: false,
    companySize: '100-200 empleados',
    companyIndustry: 'Salud Mental',
    companyLogo: '/api/placeholder/60/60'
  }
];

export const GET = requireRole(['doctor'], async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const specialty = searchParams.get('specialty') || '';
    const type = searchParams.get('type') || '';
    const location = searchParams.get('location') || '';
    const urgent = searchParams.get('urgent') === 'true';
    const remote = searchParams.get('remote') === 'true';

    // Try to fetch from Firestore first
    try {
      const filters = {
        search: search || undefined,
        specialty: specialty || undefined,
        type: type || undefined,
        location: location || undefined,
        urgent: urgent || undefined,
        remote: remote || undefined
      };

      const offers = await marketplaceService.getOffers(filters);

      return NextResponse.json({
        success: true,
        data: offers,
        total: offers.length,
        source: 'firestore',
        filters
      });
    } catch (firestoreError) {
      logger.warn('Firestore unavailable, using fallback data:', firestoreError);
      
      // Fallback to mock data with filtering
      let filteredOffers = fallbackMarketplaceOffers;

    if (search) {
      filteredOffers = filteredOffers.filter(offer =>
        offer.title.toLowerCase().includes(search.toLowerCase()) ||
        offer.company.toLowerCase().includes(search.toLowerCase()) ||
        offer.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (specialty) {
      filteredOffers = filteredOffers.filter(offer =>
        offer.specialty.toLowerCase() === specialty.toLowerCase()
      );
    }

    if (type) {
      filteredOffers = filteredOffers.filter(offer =>
        offer.type.toLowerCase() === type.toLowerCase()
      );
    }

    if (location) {
      filteredOffers = filteredOffers.filter(offer =>
        offer.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    if (urgent) {
      filteredOffers = filteredOffers.filter(offer => offer.urgent);
    }

    if (remote) {
      filteredOffers = filteredOffers.filter(offer => offer.remote);
    }

      return NextResponse.json({
        success: true,
        data: filteredOffers,
        total: filteredOffers.length,
        source: 'fallback',
        filters: {
          search,
          specialty,
          type,
          location,
          urgent,
          remote
        }
      });
    }

  } catch (error) {
    logger.error('Error obteniendo ofertas del marketplace:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        data: fallbackMarketplaceOffers // Fallback a datos simulados
      },
      { status: 500 }
    );
  }
});

export const POST = requireRole(['doctor'], async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    
    const { offerId, coverLetter, resume } = body;
    const doctorId = user.uid;

    if (!offerId) {
      return NextResponse.json(
        { success: false, error: 'ID de oferta requerido' },
        { status: 400 }
      );
    }

    try {
      // Try to save to Firestore
      const applicationId = await marketplaceService.applyToOffer({
        offerId,
        doctorId,
        coverLetter,
        resume,
        doctorProfile: {
          uid: user.uid,
          email: user.email,
          name: user.name || user.email?.split('@')[0]
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Aplicación enviada exitosamente',
        data: {
          id: applicationId,
          offerId,
          doctorId,
          status: 'pending',
          appliedAt: new Date().toISOString()
        }
      });
    } catch (firestoreError) {
      logger.warn('Firestore unavailable, simulating application:', firestoreError);
      
      // Fallback simulation
      const application = {
        id: `app_${Date.now()}`,
        offerId,
        doctorId,
        coverLetter,
        resume,
        status: 'pending',
        appliedAt: new Date().toISOString(),
        companyResponse: null
      };

      return NextResponse.json({
        success: true,
        message: 'Aplicación enviada exitosamente (modo simulación)',
        data: application
      });
    }

  } catch (error) {
    logger.error('Error procesando aplicación:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}); 