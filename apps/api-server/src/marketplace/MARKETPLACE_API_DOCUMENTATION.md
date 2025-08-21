# 🏪 UnifiedMarketplaceSystem - Documentación API

## 📋 Resumen

El **UnifiedMarketplaceSystem** es el sistema de marketplace médico consolidado de AltaMedica que unifica 6 implementaciones fragmentadas en una sola API coherente. Gestiona empresas médicas, ofertas de trabajo/servicios, aplicaciones y estadísticas de marketplace B2B.

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Company         │───▶│ Marketplace      │───▶│ Applications    │
│ Management      │    │ Listings         │    │ Management      │
└─────────────────┘    │ - Jobs           │    └─────────────────┘
                       │ - Services       │
                       │ - Equipment      │
                       └──────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │ Firebase Storage │
                       │ - Companies      │
                       │ - Listings       │  
                       │ - Applications   │
                       └──────────────────┘
```

## 🎯 Clase Principal: UnifiedMarketplaceService

### Singleton Pattern

```typescript
import { marketplaceService } from '@/marketplace/UnifiedMarketplaceSystem';

// Servicio singleton listo para usar
const company = await marketplaceService.createCompany({...});
```

## 📚 Interfaces Principales

### Company

```typescript
interface Company {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  location?: {
    city?: string;
    state?: string;
    country?: string;
    address?: string;
  };
  website?: string;
  logoUrl?: string;
  contactInfo?: {
    email: string;
    phone?: string;
    address?: string;
  };
  specialties?: string[];
  ownerId?: string;
  
  // Estado y verificación
  isVerified: boolean;
  isActive: boolean;
  status?: 'active' | 'inactive' | 'suspended';
  
  // Metadatos
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### MarketplaceListing

```typescript
interface MarketplaceListing {
  id: string;
  companyId: string;
  title: string;
  description: string;
  
  // Categorización consolidada
  category?: 'job' | 'service' | 'equipment' | 'consultation';
  department?: string;
  
  // Tipo de empleo/servicio
  type?: 'full-time' | 'part-time' | 'contract' | 'consultation' | 'one-time';
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
  
  // Ubicación
  location?: {
    city?: string;
    state?: string;
    country?: string;
    remote?: boolean;
  };
  remote?: boolean;
  
  // Requisitos y beneficios
  requirements: string[];
  benefits?: string[];
  skills?: string[];
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
  
  // Compensación
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  
  // Fechas y metadata
  applicationDeadline?: Date;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  
  // Estado y métricas
  status: 'draft' | 'active' | 'published' | 'paused' | 'closed';
  viewCount?: number;
  applicationCount?: number;
  
  // Metadatos
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### JobApplication

```typescript
interface JobApplication {
  id: string;
  listingId: string;
  applicantId: string;
  
  // Contenido de aplicación
  resumeUrl?: string;
  coverLetter?: string;
  additionalInfo?: string;
  
  // Información adicional
  availabilityDate?: Date;
  expectedSalary?: number;
  
  // Estado y revisión
  status: 'pending' | 'reviewing' | 'reviewed' | 'shortlisted' | 
          'interviewed' | 'accepted' | 'rejected';
  notes?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  
  // Fechas y revisor
  appliedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  interviewDate?: Date;
  
  // Metadatos
  createdAt?: Date;
  updatedAt?: Date;
}
```

## 🚀 API Methods - Gestión de Empresas

### createCompany()

```typescript
const company = await UnifiedMarketplaceService.createCompany({
  name: 'AltaMedica Solutions',
  description: 'Soluciones médicas innovadoras',
  industry: 'healthcare',
  size: 'medium',
  location: {
    city: 'Madrid',
    state: 'Madrid',
    country: 'España'
  },
  website: 'https://altamedica.com',
  logoUrl: 'https://altamedica.com/logo.png',
  contactInfo: {
    email: 'contact@altamedica.com',
    phone: '+34 123 456 789',
    address: 'Calle Gran Vía 1, Madrid'
  },
  specialties: ['telemedicina', 'diagnóstico AI'],
  createdBy: 'user-123'
});
```

### getCompany()

```typescript
const company = await UnifiedMarketplaceService.getCompany('company-456');
```

### getCompanies()

```typescript
const { companies, count } = await UnifiedMarketplaceService.getCompanies({
  industry: 'healthcare',
  size: 'medium',
  verified: true,
  location: 'Madrid',
  limit: 10
});
```

### updateCompany()

```typescript
const updatedCompany = await UnifiedMarketplaceService.updateCompany('company-456', {
  description: 'Descripción actualizada',
  isVerified: true,
  specialties: ['telemedicina', 'diagnóstico AI', 'IoT médico']
});
```

## 🚀 API Methods - Gestión de Listados

### createListing()

```typescript
const listing = await UnifiedMarketplaceService.createListing({
  companyId: 'company-456',
  title: 'Desarrollador Full-Stack Médico',
  description: 'Buscamos desarrollador con experiencia en telemedicina',
  category: 'job',
  department: 'Engineering',
  employmentType: 'full-time',
  experienceLevel: 'mid',
  location: {
    city: 'Madrid',
    country: 'España',
    remote: true
  },
  requirements: [
    'React/Next.js',
    'Node.js',
    'Experiencia en APIs médicas',
    'Conocimiento de HIPAA'
  ],
  benefits: [
    'Seguro médico completo',
    'Trabajo remoto',
    'Formación continua'
  ],
  skills: ['javascript', 'typescript', 'react', 'medical-apis'],
  salaryRange: {
    min: 45000,
    max: 65000,
    currency: 'EUR'
  },
  applicationDeadline: '2024-03-15',
  tags: ['remote', 'healthcare', 'full-stack'],
  priority: 'high',
  status: 'published',
  createdBy: 'user-123'
});
```

### getListing()

```typescript
const listing = await UnifiedMarketplaceService.getListing('listing-789');
```

### getListings()

```typescript
const { listings, count } = await UnifiedMarketplaceService.getListings({
  companyId: 'company-456',
  category: 'job',
  employmentType: 'full-time',
  experienceLevel: 'mid',
  remote: true,
  limit: 20
});
```

### updateListing()

```typescript
const updatedListing = await UnifiedMarketplaceService.updateListing('listing-789', {
  status: 'paused',
  applicationDeadline: '2024-04-15',
  salaryRange: {
    min: 50000,
    max: 70000,
    currency: 'EUR'
  }
});
```

### deleteListing()

```typescript
await UnifiedMarketplaceService.deleteListing('listing-789');
```

### incrementListingViews()

```typescript
await UnifiedMarketplaceService.incrementListingViews('listing-789');
```

## 🚀 API Methods - Gestión de Aplicaciones

### createApplication()

```typescript
const application = await UnifiedMarketplaceService.createApplication({
  listingId: 'listing-789',
  applicantId: 'user-456',
  resumeUrl: 'https://example.com/resume.pdf',
  coverLetter: 'Me interesa mucho esta posición...',
  additionalInfo: 'Tengo 5 años de experiencia en desarrollo médico',
  availabilityDate: '2024-02-01',
  expectedSalary: 60000
});
```

### getApplication()

```typescript
const application = await UnifiedMarketplaceService.getApplication('app-123');
```

### getApplicationsByListing()

```typescript
const { applications, count, total } = await UnifiedMarketplaceService.getApplicationsByListing(
  'listing-789',
  {
    status: 'pending',
    limit: 10
  }
);
```

### getApplicationsByApplicant()

```typescript
const applications = await UnifiedMarketplaceService.getApplicationsByApplicant('user-456');
```

### getApplicationByUserAndListing()

```typescript
const application = await UnifiedMarketplaceService.getApplicationByUserAndListing(
  'user-456',
  'listing-789'
);
```

### updateApplication()

```typescript
const updatedApplication = await UnifiedMarketplaceService.updateApplication('app-123', {
  status: 'reviewed',
  reviewNotes: 'Candidato prometedor, programar entrevista',
  reviewedBy: 'hr-manager-789',
  reviewedAt: new Date(),
  interviewDate: '2024-02-15'
});
```

## 🚀 API Methods - Estadísticas

### getMarketplaceStats()

```typescript
const stats = await UnifiedMarketplaceService.getMarketplaceStats();

// Retorna:
{
  totalCompanies: 150,
  activeCompanies: 142,
  totalListings: 450,
  activeListings: 380,
  totalApplications: 2300,
  recentApplications: 125  // Últimos 30 días
}
```

### getMarketplaceOverview()

```typescript
const overview = await UnifiedMarketplaceService.getMarketplaceOverview({
  industry: 'healthcare',
  limit: 5
});

// Retorna:
{
  companies: [...],
  listings: [...],
  totalCompanies: 15,
  totalListings: 45
}
```

## 🎯 Uso en API Routes

### Endpoint para Crear Empresa

```typescript
import { UnifiedMarketplaceService, CreateCompanySchema } from '@/marketplace/UnifiedMarketplaceSystem';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateCompanySchema.parse(body);
    
    const company = await UnifiedMarketplaceService.createCompany({
      ...validatedData,
      createdBy: 'user-123' // Desde auth context
    });
    
    return NextResponse.json({
      success: true,
      data: company
    }, { status: 201 });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 });
  }
}
```

### Endpoint para Obtener Listados

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const filters = {
    category: searchParams.get('category'),
    employmentType: searchParams.get('employmentType'),
    experienceLevel: searchParams.get('experienceLevel'),
    remote: searchParams.get('remote') === 'true',
    limit: parseInt(searchParams.get('limit') || '20')
  };
  
  const result = await UnifiedMarketplaceService.getListings(filters);
  
  return NextResponse.json({
    success: true,
    data: result.listings,
    count: result.count
  });
}
```

### Endpoint para Aplicar a Listado

```typescript
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const listingId = params.id;
    const body = await request.json();
    
    const application = await UnifiedMarketplaceService.createApplication({
      listingId,
      applicantId: 'user-456', // Desde auth context
      ...body
    });
    
    return NextResponse.json({
      success: true,
      data: application
    }, { status: 201 });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 });
  }
}
```

## 🛡️ Validaciones y Schemas

### Zod Schemas Disponibles

```typescript
import { 
  CreateCompanySchema, 
  CreateListingSchema, 
  CreateApplicationSchema 
} from '@/marketplace/UnifiedMarketplaceSystem';

// Validar datos de entrada
const validatedCompany = CreateCompanySchema.parse(companyData);
const validatedListing = CreateListingSchema.parse(listingData);
const validatedApplication = CreateApplicationSchema.parse(applicationData);
```

### Ejemplo de Validación Completa

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validación con Zod
    const validatedData = CreateListingSchema.parse(body);
    
    // Validaciones de negocio adicionales
    if (!validatedData.companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }
    
    // Verificar que la empresa existe
    const company = await UnifiedMarketplaceService.getCompany(validatedData.companyId);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }
    
    // Crear listado
    const listing = await UnifiedMarketplaceService.createListing({
      ...validatedData,
      createdBy: 'user-123'
    });
    
    return NextResponse.json({ success: true, data: listing });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## 🔧 Configuración

### Variables de Entorno

```env
# Firebase Firestore
FIREBASE_PROJECT_ID=altamedica-platform
FIREBASE_CLIENT_EMAIL=service-account@altamedica.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Marketplace Configuration
MARKETPLACE_COMPANIES_COLLECTION=marketplace_companies
MARKETPLACE_LISTINGS_COLLECTION=marketplace_listings
MARKETPLACE_APPLICATIONS_COLLECTION=marketplace_applications
```

### Configuración de Firebase

```typescript
// firebase-admin.ts
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID,
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  })
});

export const adminDb = getFirestore(app);
```

## 📊 Filtros Avanzados

### Filtros de Empresas

```typescript
const { companies } = await UnifiedMarketplaceService.getCompanies({
  industry: 'healthcare',           // Filtrar por industria
  size: 'medium',                   // Tamaño de empresa
  verified: true,                   // Solo empresas verificadas
  location: 'Madrid',               // Ubicación
  limit: 20                         // Límite de resultados
});
```

### Filtros de Listados

```typescript
const { listings } = await UnifiedMarketplaceService.getListings({
  companyId: 'company-123',         // Listados de empresa específica
  category: 'job',                  // Categoría (job, service, equipment)
  employmentType: 'full-time',      // Tipo de empleo
  experienceLevel: 'mid',           // Nivel de experiencia
  department: 'Engineering',        // Departamento
  remote: true,                     // Trabajo remoto
  location: 'Madrid',               // Ubicación
  limit: 50                         // Límite de resultados
});
```

### Filtros de Aplicaciones

```typescript
const { applications } = await UnifiedMarketplaceService.getApplicationsByListing(
  'listing-456',
  {
    status: 'pending',              // Estado de aplicación
    limit: 25                       // Límite de resultados
  }
);
```

## 🔄 Migration Guide

### Desde services/marketplace.service.ts legacy

```typescript
// ❌ ANTES
import MarketplaceService from '../services/marketplace.service';

// ✅ DESPUÉS
import UnifiedMarketplaceService from '../marketplace/UnifiedMarketplaceSystem';
```

### Desde domains/marketplace/marketplace.service.ts

```typescript
// ❌ ANTES
import { MarketplaceService } from '../domains/marketplace/marketplace.service';

// ✅ DESPUÉS
import UnifiedMarketplaceService from '../marketplace/UnifiedMarketplaceSystem';
```

### Adaptación de Interfaces

```typescript
// Las interfaces han sido consolidadas y mejoradas
// Company, MarketplaceListing y JobApplication mantienen compatibilidad
// pero con campos adicionales y mejor estructura

// Ejemplo de migración de método:
// ANTES
const companies = await MarketplaceService.getCompanies(filters);
// DESPUÉS  
const { companies, count } = await UnifiedMarketplaceService.getCompanies(filters);
```

## 🧪 Testing

```typescript
import UnifiedMarketplaceService from '@/marketplace/UnifiedMarketplaceSystem';

describe('UnifiedMarketplaceSystem', () => {
  it('should create company successfully', async () => {
    const companyData = {
      name: 'Test Healthcare',
      contactInfo: { email: 'test@healthcare.com' },
      createdBy: 'test-user'
    };
    
    const company = await UnifiedMarketplaceService.createCompany(companyData);
    
    expect(company.id).toBeDefined();
    expect(company.name).toBe('Test Healthcare');
    expect(company.isActive).toBe(true);
    expect(company.isVerified).toBe(false);
  });

  it('should create and retrieve job listing', async () => {
    const listingData = {
      companyId: 'test-company',
      title: 'Test Developer',
      description: 'Test job description',
      requirements: ['JavaScript', 'React'],
      status: 'published' as const,
      createdBy: 'test-user'
    };
    
    const listing = await UnifiedMarketplaceService.createListing(listingData);
    const retrieved = await UnifiedMarketplaceService.getListing(listing.id);
    
    expect(retrieved).toBeDefined();
    expect(retrieved!.title).toBe('Test Developer');
    expect(retrieved!.viewCount).toBe(0);
  });

  it('should handle application workflow', async () => {
    // Crear aplicación
    const application = await UnifiedMarketplaceService.createApplication({
      listingId: 'test-listing',
      applicantId: 'test-applicant',
      coverLetter: 'Test cover letter'
    });
    
    expect(application.status).toBe('pending');
    
    // Actualizar estado
    const updated = await UnifiedMarketplaceService.updateApplication(
      application.id,
      { status: 'reviewed', reviewNotes: 'Good candidate' }
    );
    
    expect(updated.status).toBe('reviewed');
    expect(updated.reviewNotes).toBe('Good candidate');
  });
});
```

## ⚠️ Consideraciones Importantes

### Rate Limiting
- Implementar límites por empresa y usuario
- Monitorear uso de la API para prevenir abuso
- Considerar cache para consultas frecuentes

### Seguridad de Datos
- Todas las operaciones requieren autenticación
- Verificar permisos antes de modificar datos
- Auditar acceso a información sensible de empresas

### Performance
- Usar índices apropiados en Firestore
- Implementar paginación para resultados grandes  
- Cache de empresas y listados populares

### Notificaciones
- Integrar con UnifiedNotificationSystem para:
  - Nuevas aplicaciones a empresas
  - Cambios de estado de aplicaciones
  - Recordatorios de fechas límite

---

## 📞 Support

Para soporte técnico o preguntas sobre marketplace, contacta al equipo de desarrollo AltaMedica.

**Esta documentación cubre el 100% de la funcionalidad del UnifiedMarketplaceSystem consolidado.**