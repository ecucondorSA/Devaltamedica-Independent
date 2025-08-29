// import { QueryProvider, apiClient } from '@altamedica/api-client';
// import { services } from '@altamedica/api-client';

const QueryProvider: any = {};
const apiClient: any = {};
const services: any = {};

// apps/doctors/src/services.ts
import useAuth from '@altamedica/auth';

import { logger } from '@altamedica/shared';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Interfaces para marketplace unificado
interface MarketplaceListing {
  id: string;
  companyId: string;
  title: string;
  description: string;
  category?: 'job' | 'service' | 'equipment' | 'consultation';
  department?: string;
  type?: 'full-time' | 'part-time' | 'contract' | 'consultation' | 'one-time';
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
  location?: {
    city?: string;
    state?: string;
    country?: string;
    remote?: boolean;
  };
  requirements: string[];
  benefits?: string[];
  skills?: string[];
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  status: 'draft' | 'active' | 'published' | 'paused' | 'closed';
  viewCount?: number;
  applicationCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ListingsResponse {
  data: MarketplaceListing[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface ApplicationData {
  listingId: string;
  resumeUrl?: string;
  coverLetter?: string;
  additionalInfo?: string;
  availabilityDate?: Date;
  expectedSalary?: number;
}

// Función para obtener token de autenticación
async function getAuthToken() {
  // Implementar obtención de token según tu sistema de auth
  // Por ahora usamos localStorage como fallback
  const token = localStorage.getItem('auth-token') || localStorage.getItem('altamedica_token');
  return token;
}

export const getAvailableListings = async (filters?: {
  category?: string;
  employmentType?: string;
  location?: string;
  remote?: boolean;
  experienceLevel?: string;
  limit?: number;
  offset?: number;
}) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Token de autenticación no disponible');
    }

    // Construir parámetros de query
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    // Usar endpoint unificado del marketplace
    const url = `${API_URL}/api/v1/marketplace/listings?status=active&${queryParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
      throw new Error(`Error del servidor: ${response.status}`);
    }

    const result: ListingsResponse = await response.json();
    return result.data || [];

  } catch (error) {
    logger.error('Error fetching marketplace listings:', String(error));
    // Fallback a datos mock en caso de error
    return [
      { 
        id: '1', 
        title: 'Cardiologist Needed', 
        company: 'Some Hospital',
        description: 'Looking for experienced cardiologist',
        category: 'job',
        employmentType: 'full-time',
        location: { city: 'New York', state: 'NY', country: 'USA' },
        requirements: ['MD in Cardiology', '5+ years experience'],
        experienceLevel: 'senior'
      },
      { 
        id: '2', 
        title: 'Dermatologist for Telemedicine', 
        company: 'Another Clinic',
        description: 'Remote dermatology consultations',
        category: 'job',
        employmentType: 'part-time',
        location: { remote: true },
        requirements: ['MD in Dermatology', 'Telemedicine experience'],
        experienceLevel: 'mid'
      },
      { 
        id: '3', 
        title: 'General Practitioner (Part-Time)', 
        company: 'Telemedicine Platform',
        description: 'Part-time GP for online consultations',
        category: 'job',
        employmentType: 'part-time',
        location: { remote: true },
        requirements: ['MD', '2+ years experience'],
        experienceLevel: 'mid'
      },
    ];
  }
};

export const getListingDetails = async (listingId: string) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Token de autenticación no disponible');
    }

    const url = `${API_URL}/api/v1/marketplace/listings/${listingId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
      if (response.status === 404) {
        throw new Error('Listing no encontrado.');
      }
      throw new Error(`Error del servidor: ${response.status}`);
    }

    const result = await response.json();
    return result.data;

  } catch (error) {
    logger.error('Error fetching listing details:', String(error));
    // Fallback a datos mock
    return {
      id: listingId,
      title: 'Cardiologist Needed',
      company: 'Some Hospital',
      specialty: 'Cardiology',
      location: 'New York, NY',
      hoursPerWeek: 20,
      remuneration: '$100/hour',
      description: 'Detailed description of the job.',
      requirements: ['MD in Cardiology', '5+ years experience'],
      benefits: ['Health insurance', 'Flexible schedule'],
      experienceLevel: 'senior'
    };
  }
};

export const applyToListing = async (applicationData: ApplicationData) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Token de autenticación no disponible');
    }

    const url = `${API_URL}/api/v1/marketplace/listings/${applicationData.listingId}/apply`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(applicationData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
      if (response.status === 400) {
        const error = await response.json();
        throw new Error(error.message || 'Datos de aplicación inválidos.');
      }
      throw new Error(`Error del servidor: ${response.status}`);
    }

    const result = await response.json();
    return result.data;

  } catch (error) {
    logger.error('Error applying to listing:', String(error));
    throw error; // Re-throw para que el componente maneje el error
  }
};

// Nuevas funciones para integración completa
export const getUserApplications = async () => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Token de autenticación no disponible');
    }

    const url = `${API_URL}/api/v1/marketplace/applications/my-applications`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];

  } catch (error) {
    logger.error('Error fetching user applications:', String(error));
    return [];
  }
};

export const getMarketplaceStats = async () => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Token de autenticación no disponible');
    }

    const url = `${API_URL}/api/v1/marketplace/stats`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }

    const result = await response.json();
    return result.data;

  } catch (error) {
    logger.error('Error fetching marketplace stats:', String(error));
    return {
      totalCompanies: 0,
      activeListings: 0,
      totalApplications: 0,
      recentApplications: 0
    };
  }
};
