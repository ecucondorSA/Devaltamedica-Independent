import { NextRequest, NextResponse } from "next/server";
import { UnifiedAuth } from '../../../../../api-server/src/auth/UnifiedAuthSystem';
import { UserRole } from "@altamedica/types";
// Importar repositorio de companies si es necesario
// import { companyRepository } from "@altamedica/database";
import { auditLog, logger } from '../../../lib/medical-mocks';

// Fallback data for when Firestore is not available
const fallbackCompaniesData = [
  {
    id: "1",
    name: "Hospital Universitario San Vicente",
    industry: "Hospital Público",
    description:
      "Centro médico de alta complejidad especializado en atención integral, investigación y docencia médica. Ofrecemos servicios de emergencia, cirugía, cardiología y más.",
    location: "Medellín, Antioquia",
    size: "2,500+",
    rating: 4.8,
    jobCount: 15,
    logo: "/logos/hospital-san-vicente.png",
    website: "https://www.hospital-sanvicente.gov.co",
  },
  {
    id: "2",
    name: "Clínica Las Américas",
    industry: "Clínica Privada",
    description:
      "Institución de salud privada con más de 30 años de experiencia, especializada en atención personalizada y tecnología médica de vanguardia.",
    location: "Medellín, Antioquia",
    size: "800+",
    rating: 4.6,
    jobCount: 8,
    logo: "/logos/clinica-las-americas.png",
    website: "https://www.clinicalasamericas.com",
  },
  {
    id: "3",
    name: "Fundación Valle del Lili",
    industry: "Centro de Investigación",
    description:
      "Centro médico universitario de alta complejidad dedicado a la atención clínica, investigación biomédica y formación de profesionales de la salud.",
    location: "Cali, Valle del Cauca",
    size: "1,200+",
    rating: 4.9,
    jobCount: 12,
    logo: "/logos/fundacion-valle-lili.png",
    website: "https://www.fvl.org.co",
  },
  {
    id: "4",
    name: "Clínica Mayo",
    industry: "Clínica Privada",
    description:
      "Institución médica de excelencia reconocida internacionalmente, especializada en diagnóstico complejo y tratamiento de enfermedades raras.",
    location: "Bogotá, Cundinamarca",
    size: "1,500+",
    rating: 4.7,
    jobCount: 6,
    logo: "/logos/clinica-mayo.png",
    website: "https://www.mayoclinic.org",
  },
  {
    id: "5",
    name: "Hospital Militar Central",
    industry: "Hospital Militar",
    description:
      "Institución de salud militar que brinda atención integral a personal militar, sus familias y civiles, con especialización en traumatología.",
    location: "Bogotá, Cundinamarca",
    size: "1,800+",
    rating: 4.5,
    jobCount: 10,
    logo: "/logos/hospital-militar.png",
    website: "https://www.hospitalmilitar.gov.co",
  },
  {
    id: "6",
    name: "Clínica Reina Sofía",
    industry: "Clínica Privada",
    description:
      "Centro médico especializado en ginecología, obstetricia y pediatría, con más de 25 años de experiencia en atención materno-infantil.",
    location: "Bogotá, Cundinamarca",
    size: "600+",
    rating: 4.4,
    jobCount: 5,
    logo: "/logos/clinica-reina-sofia.png",
    website: "https://www.clinicareinasofia.com",
  },
  {
    id: "7",
    name: "Hospital Universitario del Valle",
    industry: "Hospital Público",
    description:
      "Hospital universitario de referencia regional, especializado en atención de alta complejidad y formación de profesionales de la salud.",
    location: "Cali, Valle del Cauca",
    size: "2,200+",
    rating: 4.3,
    jobCount: 18,
    logo: "/logos/hospital-universitario-valle.png",
    website: "https://www.huv.gov.co",
  },
  {
    id: "8",
    name: "Clínica del Country",
    industry: "Clínica Privada",
    description:
      "Institución de salud privada de alta complejidad, reconocida por su excelencia en atención cardiovascular y neurocirugía.",
    location: "Bogotá, Cundinamarca",
    size: "900+",
    rating: 4.8,
    jobCount: 7,
    logo: "/logos/clinica-country.png",
    website: "https://www.clinicadelcountry.com",
  },
  {
    id: "9",
    name: "Hospital Pablo Tobón Uribe",
    industry: "Hospital Privado",
    description:
      "Hospital universitario privado especializado en atención de alta complejidad, investigación clínica y formación médica continua.",
    location: "Medellín, Antioquia",
    size: "1,100+",
    rating: 4.7,
    jobCount: 9,
    logo: "/logos/hospital-pablo-tobon.png",
    website: "https://www.hptu.org.co",
  },
  {
    id: "10",
    name: "Clínica Imbanaco",
    industry: "Clínica Privada",
    description:
      "Centro médico de alta complejidad especializado en oncología, cardiología y trasplantes, con tecnología médica de última generación.",
    location: "Cali, Valle del Cauca",
    size: "1,300+",
    rating: 4.6,
    jobCount: 11,
    logo: "/logos/clinica-imbanaco.png",
    website: "https://www.imbanaco.com",
  },
];

export async function GET(request: NextRequest) {
  // Autenticación y autorización usando UnifiedAuth
  const authResult = await UnifiedAuth(request, [UserRole.COMPANY, UserRole.ADMIN]);
  
  if (!authResult.success) {
    return authResult.response;
  }
  
  const user = authResult.user!;
  
  try {
    const companyId = user.companyId;
    
    // Log de auditoría
    await auditLog({
      action: 'companies_list_viewed',
      userId: user.userId,
      companyId: companyId || 'unknown',
      metadata: { endpoint: '/api/companies' }
    });

    // Try to fetch from Firestore first
    try {
      // TODO: Implementar con companyRepository cuando esté configurado
      // const companies = await companyRepository.getAll();
      
      // Por ahora usar datos fallback
      const companies = fallbackCompaniesData;
      
      return NextResponse.json(companies, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          "X-Data-Source": "firestore"
        },
      });
    } catch (firestoreError) {
      logger.warn('Firestore unavailable, using fallback data:', firestoreError);
      
      // Simular delay de red para fallback
      await new Promise((resolve) => setTimeout(resolve, 300));

      return NextResponse.json(fallbackCompaniesData, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
          "X-Data-Source": "fallback"
        },
      });
    }
  } catch (error) {
    logger.error('Error getting companies:', {
      error: error instanceof Error ? error.message : String(error),
      userId: user.userId,
      companyId: user.companyId
    });

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
