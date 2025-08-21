import Script from 'next/script';

interface JsonLdSchemaProps {
  type?: 'Organization' | 'WebSite' | 'MedicalOrganization';
}

export default function JsonLdSchema({ type = 'MedicalOrganization' }: JsonLdSchemaProps) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalOrganization',
    name: 'ALTAMEDICA',
    alternateName: 'AltaMedica Portal Médico',
    url: 'https://altamedica.com',
    logo: 'https://altamedica.com/logo.png',
    description: 'Plataforma médica digital líder en Argentina. Telemedicina 24/7, historia clínica digital, especialistas certificados.',
    sameAs: [
      'https://www.facebook.com/altamedica',
      'https://www.instagram.com/altamedica',
      'https://www.linkedin.com/company/altamedica',
      'https://twitter.com/altamedica'
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'AR',
      addressRegion: 'Buenos Aires'
    },
    medicalSpecialty: [
      'GeneralPractice',
      'Cardiology',
      'Dermatology',
      'Gynecology',
      'InternalMedicine',
      'Neurology',
      'Pediatrics',
      'Psychiatry'
    ],
    availableService: {
      '@type': 'MedicalProcedure',
      name: 'Telemedicina',
      description: 'Consultas médicas online 24/7 con especialistas certificados'
    }
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ALTAMEDICA',
    url: 'https://altamedica.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://altamedica.com/search?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: 'https://altamedica.com'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Servicios',
        item: 'https://altamedica.com/servicios'
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Especialistas',
        item: 'https://altamedica.com/especialistas'
      }
    ]
  };

  const schemas = [organizationSchema, websiteSchema, breadcrumbSchema];

  return (
    <>
      {schemas.map((schema, index) => (
        <Script
          key={index}
          id={`json-ld-${index}`}
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema)
          }}
        />
      ))}
    </>
  );
}