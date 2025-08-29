// Servicio para integración con Medical Matching Engine API
import { logger } from '@altamedica/shared';

interface MatchRequest {
  company_id: string;
  match_type: 'referral' | 'emergency' | 'equipment' | 'partnership' | 'job';
  specialty_needed: string;
  location: {
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
    country?: string;
  };
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  budget_range?: {
    min: number;
    max: number;
    currency: string;
  };
  equipment_needed?: string[];
  additional_requirements?: string[];
}

interface MatchResult {
  match_id: string;
  company: {
    id: string;
    name: string;
    type: string;
    logo?: string;
  };
  score: number;
  match_reasons: string[];
  specialties_match: string[];
  distance_km: number;
  estimated_response_time?: string;
  pricing_estimate?: {
    amount: number;
    currency: string;
    period?: string;
  };
  next_steps: string[];
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
  equipment_expertise?: string[];
  research_interests?: string[];
  publications?: number;
}

interface JobMatch {
  job_id: string;
  match_score: number;
  match_reasons: string[];
  requirements_met: string[];
  requirements_missing: string[];
  salary_match: boolean;
  location_match: boolean;
  recommended_action: 'apply' | 'review' | 'skip';
}

class MatchingApiService {
  private baseUrl: string;
  private wsConnection: WebSocket | null = null;

  constructor() {
    // Cambiar a usar el api-server unificado en lugar del puerto 8889 externo
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  // Encontrar oportunidades de trabajo para un médico
  async findJobOpportunities(doctorProfile: DoctorProfile): Promise<MatchResult[]> {
    try {
      const matchRequest: MatchRequest = {
        company_id: doctorProfile.id,
        match_type: 'job',
        specialty_needed: doctorProfile.specialties[0], // Usar especialidad principal
        location: {
          latitude: doctorProfile.location.latitude || 0,
          longitude: doctorProfile.location.longitude || 0,
          city: doctorProfile.location.city,
          state: doctorProfile.location.state,
          country: doctorProfile.location.country
        },
        urgency_level: doctorProfile.availability === 'immediate' ? 'high' : 'medium',
        budget_range: doctorProfile.salary_expectations,
        additional_requirements: [
          `Experience: ${doctorProfile.experience_years} years`,
          `Languages: ${doctorProfile.languages.join(', ')}`,
          ...doctorProfile.certifications.map(cert => `Certification: ${cert}`)
        ]
      };

      // Obtener token de autenticación
      const token = localStorage.getItem('auth-token') || localStorage.getItem('altamedica_token');
      
      // Usar endpoint unificado del marketplace
      const response = await fetch(`${this.baseUrl}/api/v1/marketplace/match-opportunities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify(matchRequest)
      });

      if (!response.ok) {
        throw new Error(`Matching API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.matches || [];
    } catch (error) {
      logger.error('Error finding job opportunities:', String(error));
      return [];
    }
  }

  // Calcular compatibilidad con una oferta específica
  async calculateJobCompatibility(
    doctorProfile: DoctorProfile, 
    jobId: string
  ): Promise<JobMatch> {
    try {
      // Por ahora, simulamos el cálculo localmente
      // En producción, esto debería llamar a un endpoint específico
      const mockJobMatch: JobMatch = {
        job_id: jobId,
        match_score: Math.random() * 100,
        match_reasons: [
          'Especialidad coincide perfectamente',
          'Ubicación dentro del rango preferido',
          'Experiencia requerida cumplida'
        ],
        requirements_met: [
          'Certificación en Cardiología',
          '5+ años de experiencia',
          'Disponibilidad inmediata'
        ],
        requirements_missing: [
          'Certificación ACLS actualizada'
        ],
        salary_match: true,
        location_match: true,
        recommended_action: 'apply'
      };

      return mockJobMatch;
    } catch (error) {
      logger.error('Error calculating job compatibility:', String(error));
      throw error;
    }
  }

  // Obtener recomendaciones personalizadas
  async getPersonalizedRecommendations(
    doctorId: string, 
    limit: number = 5
  ): Promise<MatchResult[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/matching/companies/${doctorId}/recommendations?limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        // Si el endpoint no está implementado, usar el principal
        logger.warn('Recommendations endpoint not implemented, using main matching');
        return [];
      }

      const data = await response.json();
      return data.recommendations || [];
    } catch (error) {
      logger.error('Error getting recommendations:', String(error));
      return [];
    }
  }

  // Conectar WebSocket para actualizaciones en tiempo real
  connectToRealTimeUpdates(doctorId: string, onUpdate: (data: any) => void): void {
    if (this.wsConnection) {
      this.wsConnection.close();
    }

    // Usar WebSocket del api-server unificado
    const wsUrl = `ws://localhost:3001/ws/marketplace/matching/${doctorId}`;
    this.wsConnection = new WebSocket(wsUrl);

    this.wsConnection.onopen = () => {
      logger.info('Connected to matching updates');
    };

    this.wsConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onUpdate(data);
      } catch (error) {
        logger.error('Error parsing WebSocket message:', String(error));
      }
    };

    this.wsConnection.onerror = (error) => {
      logger.error('WebSocket error:', String(error));
    };

    this.wsConnection.onclose = () => {
      logger.info('WebSocket connection closed');
      // Intentar reconectar después de 5 segundos
      setTimeout(() => {
        if (this.wsConnection?.readyState === WebSocket.CLOSED) {
          this.connectToRealTimeUpdates(doctorId, onUpdate);
        }
      }, 5000);
    };
  }

  // Desconectar WebSocket
  disconnect(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  // Crear aplicación a trabajo
  async applyToJob(
    doctorId: string, 
    jobId: string, 
    applicationData: {
      coverLetter: string;
      availability: string;
      expectedSalary: string;
    }
  ): Promise<{ success: boolean; applicationId?: string; error?: string }> {
    try {
      // Por ahora simulamos la aplicación
      // En producción, esto debería enviar a un endpoint del API server
      const applicationId = `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Aquí iría la llamada real al API
      logger.info('Applying to job:', JSON.stringify({ doctorId, jobId, applicationData }, null, 2));
      
      return {
        success: true,
        applicationId
      };
    } catch (error) {
      logger.error('Error applying to job:', String(error));
      return {
        success: false,
        error: 'Failed to submit application'
      };
    }
  }
}

// Singleton instance
export const matchingApiService = new MatchingApiService();