/**
 * 🏪 MARKETPLACE REPOSITORY - ALTAMEDICA
 * Repository para gestión de ofertas del marketplace B2B médico
 */

import { BaseRepository, BaseEntity, ServiceContext, QueryOptions, RepositoryResult } from './BaseRepository';
import { z } from 'zod';
import { dbConnection } from '../core/DatabaseConnection';

import { logger } from '@altamedica/shared/services/logger.service';
// Schema Zod para MarketplaceOffer
export const MarketplaceOfferSchema = z.object({
  companyId: z.string().min(1, "El ID de empresa es requerido"),
  title: z.string().min(5, "El título debe tener al menos 5 caracteres"),
  description: z.string().min(20, "La descripción debe tener al menos 20 caracteres"),
  type: z.enum(['job', 'service', 'product', 'partnership']),
  category: z.string(),
  specialties: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  location: z.object({
    type: z.enum(['onsite', 'remote', 'hybrid']),
    address: z.string().optional(),
    city: z.string(),
    state: z.string(),
    country: z.string().default('Mexico')
  }),
  compensation: z.object({
    type: z.enum(['fixed', 'hourly', 'commission', 'negotiable']),
    amount: z.number().optional(),
    currency: z.string().default('MXN'),
    frequency: z.enum(['hour', 'day', 'week', 'month', 'year', 'project']).optional(),
    details: z.string().optional()
  }).optional(),
  duration: z.object({
    type: z.enum(['permanent', 'temporary', 'contract', 'project']),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    hoursPerWeek: z.number().optional()
  }).optional(),
  applicationDeadline: z.date().optional(),
  maxApplications: z.number().optional(),
  applications: z.number().default(0),
  views: z.number().default(0),
  tags: z.array(z.string()).default([]),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  visibility: z.enum(['public', 'private', 'verified_only']).default('public')
});

export interface MarketplaceOffer extends BaseEntity {
  companyId: string;
  title: string;
  description: string;
  type: 'job' | 'service' | 'product' | 'partnership';
  category: string;
  specialties: string[];
  requirements: string[];
  benefits: string[];
  location: {
    type: 'onsite' | 'remote' | 'hybrid';
    address?: string;
    city: string;
    state: string;
    country: string;
  };
  compensation?: {
    type: 'fixed' | 'hourly' | 'commission' | 'negotiable';
    amount?: number;
    currency: string;
    frequency?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'project';
    details?: string;
  };
  duration?: {
    type: 'permanent' | 'temporary' | 'contract' | 'project';
    startDate?: Date;
    endDate?: Date;
    hoursPerWeek?: number;
  };
  applicationDeadline?: Date;
  maxApplications?: number;
  applications: number;
  views: number;
  tags: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  visibility: 'public' | 'private' | 'verified_only';
}

// Schema para Application
export const ApplicationSchema = z.object({
  offerId: z.string().min(1),
  doctorId: z.string().min(1),
  companyId: z.string().min(1),
  coverLetter: z.string().optional(),
  proposedRate: z.number().optional(),
  availability: z.string().optional(),
  experience: z.string().optional(),
  attachments: z.array(z.string()).default([]),
  status: z.enum(['pending', 'reviewing', 'accepted', 'rejected', 'withdrawn']).default('pending'),
  companyResponse: z.object({
    status: z.enum(['accepted', 'rejected', 'interview']),
    message: z.string().optional(),
    interviewDate: z.date().optional(),
    respondedAt: z.date()
  }).optional()
});

export interface Application extends BaseEntity {
  offerId: string;
  doctorId: string;
  companyId: string;
  coverLetter?: string;
  proposedRate?: number;
  availability?: string;
  experience?: string;
  attachments: string[];
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'withdrawn';
  companyResponse?: {
    status: 'accepted' | 'rejected' | 'interview';
    message?: string;
    interviewDate?: Date;
    respondedAt: Date;
  };
}

export class MarketplaceRepository extends BaseRepository<MarketplaceOffer> {
  protected collectionName = 'marketplace_offers';
  protected entitySchema = MarketplaceOfferSchema;

  /**
   * Verifica permisos de acceso a una oferta
   */
  private async checkOfferAccess(offerId: string, context: ServiceContext): Promise<boolean> {
    try {
      const offer = await super.findById(offerId, context);
      if (!offer) return false;

      // Admins tienen acceso completo
      if (context.userRole === 'admin') return true;

      // La empresa propietaria tiene acceso completo
      if (context.userRole === 'company') {
        const db = await this.ensureFirestore();
        const companyDoc = await db.collection('companies')
          .where('firebaseUid', '==', context.userId)
          .limit(1)
          .get();
        
        if (!companyDoc.empty && companyDoc.docs[0].id === offer.companyId) {
          return true;
        }
      }

      // Ofertas públicas son visibles para doctores verificados
      if (context.userRole === 'doctor' && offer.visibility === 'public') return true;

      return false;
    } catch (error) {
      logger.error('Error checking offer access:', error);
      return false;
    }
  }

  /**
   * Crea una nueva oferta
   */
  public async create(data: Omit<MarketplaceOffer, keyof BaseEntity>, context: ServiceContext): Promise<MarketplaceOffer> {
    // Solo empresas pueden crear ofertas
    if (context.userRole !== 'company' && context.userRole !== 'admin') {
      throw new Error('FORBIDDEN: Only companies can create marketplace offers');
    }

    // Verificar que la empresa existe y coincide con el usuario
    if (context.userRole === 'company') {
      const db = await this.ensureFirestore();
      const companyDoc = await db.collection('companies')
        .where('firebaseUid', '==', context.userId)
        .limit(1)
        .get();
      
      if (companyDoc.empty || companyDoc.docs[0].id !== data.companyId) {
        throw new Error('FORBIDDEN: Company mismatch');
      }
    }

    return super.create(data, context);
  }

  /**
   * Encuentra ofertas activas
   */
  public async findActiveOffers(
    options: QueryOptions = {}, 
    context: ServiceContext
  ): Promise<RepositoryResult<MarketplaceOffer>> {
    const now = new Date();
    
    const queryOptions = {
      ...options,
      filters: {
        ...options.filters,
        status: 'active'
      }
    };

    // Filtrar por fecha de expiración en memoria después de obtener resultados
    const result = await this.findMany(queryOptions, context);
    
    result.data = result.data.filter(offer => 
      !offer.applicationDeadline || offer.applicationDeadline > now
    );

    return result;
  }

  /**
   * Encuentra ofertas por empresa
   */
  public async findByCompanyId(
    companyId: string, 
    context: ServiceContext, 
    options: QueryOptions = {}
  ): Promise<RepositoryResult<MarketplaceOffer>> {
    // Verificar permisos
    if (context.userRole === 'company') {
      const db = await this.ensureFirestore();
      const companyDoc = await db.collection('companies')
        .where('firebaseUid', '==', context.userId)
        .limit(1)
        .get();
      
      if (companyDoc.empty || companyDoc.docs[0].id !== companyId) {
        return { data: [], total: 0, hasMore: false };
      }
    }

    const queryOptions = {
      ...options,
      filters: {
        ...options.filters,
        companyId
      }
    };

    return this.findMany(queryOptions, context);
  }

  /**
   * Busca ofertas por especialidad
   */
  public async findBySpecialty(
    specialty: string, 
    context: ServiceContext, 
    options: QueryOptions = {}
  ): Promise<RepositoryResult<MarketplaceOffer>> {
    // Solo usuarios autenticados pueden buscar
    if (!context.userId) {
      return { data: [], total: 0, hasMore: false };
    }

    const result = await this.findActiveOffers(options, context);
    
    // Filtrar por especialidad en memoria
    result.data = result.data.filter(offer => 
      offer.specialties.includes(specialty)
    );

    return result;
  }

  /**
   * Incrementa el contador de vistas
   */
  public async incrementViews(offerId: string, context: ServiceContext): Promise<void> {
    const offer = await this.findById(offerId, context);
    if (!offer) return;

    await this.update(offerId, {
      views: offer.views + 1
    }, context);
  }

  /**
   * Incrementa el contador de aplicaciones
   */
  public async incrementApplications(offerId: string, context: ServiceContext): Promise<void> {
    const offer = await this.findById(offerId, context);
    if (!offer) return;

    // Verificar si se alcanzó el máximo de aplicaciones
    if (offer.maxApplications && offer.applications >= offer.maxApplications) {
      // TODO: Implement proper status change method in base repository
      // For now, just skip the status update
      return;
    }

    await this.update(offerId, {
      applications: offer.applications + 1
    }, context);
  }

  /**
   * Busca ofertas con filtros avanzados
   */
  public async searchOffers(
    filters: {
      keyword?: string;
      type?: MarketplaceOffer['type'];
      location?: string;
      compensationMin?: number;
      compensationMax?: number;
      specialties?: string[];
      tags?: string[];
    },
    context: ServiceContext,
    options: QueryOptions = {}
  ): Promise<RepositoryResult<MarketplaceOffer>> {
    let result = await this.findActiveOffers(options, context);

    // Aplicar filtros en memoria
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      result.data = result.data.filter(offer => 
        offer.title.toLowerCase().includes(keyword) ||
        offer.description.toLowerCase().includes(keyword) ||
        offer.tags.some(tag => tag.toLowerCase().includes(keyword))
      );
    }

    if (filters.type) {
      result.data = result.data.filter(offer => offer.type === filters.type);
    }

    if (filters.location) {
      const location = filters.location.toLowerCase();
      result.data = result.data.filter(offer => 
        offer.location.city.toLowerCase().includes(location) ||
        offer.location.state.toLowerCase().includes(location)
      );
    }

    if (filters.compensationMin !== undefined || filters.compensationMax !== undefined) {
      result.data = result.data.filter(offer => {
        if (!offer.compensation?.amount) return false;
        if (filters.compensationMin && offer.compensation.amount < filters.compensationMin) return false;
        if (filters.compensationMax && offer.compensation.amount > filters.compensationMax) return false;
        return true;
      });
    }

    if (filters.specialties && filters.specialties.length > 0) {
      result.data = result.data.filter(offer => 
        filters.specialties!.some(specialty => offer.specialties.includes(specialty))
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      result.data = result.data.filter(offer => 
        filters.tags!.some(tag => offer.tags.includes(tag))
      );
    }

    return result;
  }

  /**
   * Obtiene estadísticas del marketplace
   */
  public async getStatistics(context: ServiceContext): Promise<{
    totalOffers: number;
    activeOffers: number;
    offersByType: Record<string, number>;
    averageCompensation: Record<string, number>;
    topCategories: Array<{ category: string; count: number }>;
  }> {
    if (context.userRole !== 'admin') {
      throw new Error('FORBIDDEN: Insufficient permissions');
    }

    const startTime = Date.now();
    const db = await this.ensureFirestore();

    try {
      const [totalSnapshot, activeSnapshot, allOffersSnapshot] = await Promise.all([
        db.collection(this.collectionName).where('status', '!=', 'archived').count().get(),
        db.collection(this.collectionName).where('status', '==', 'active').count().get(),
        db.collection(this.collectionName).where('status', '!=', 'archived').get()
      ]);

      const offersByType: Record<string, number> = {};
      const compensationByType: Record<string, { total: number; count: number }> = {};
      const categoryCounts: Record<string, number> = {};

      allOffersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Contar por tipo
        if (data.type) {
          offersByType[data.type] = (offersByType[data.type] || 0) + 1;
        }

        // Calcular compensación promedio por tipo
        if (data.type && data.compensation?.amount) {
          if (!compensationByType[data.type]) {
            compensationByType[data.type] = { total: 0, count: 0 };
          }
          compensationByType[data.type].total += data.compensation.amount;
          compensationByType[data.type].count += 1;
        }

        // Contar categorías
        if (data.category) {
          categoryCounts[data.category] = (categoryCounts[data.category] || 0) + 1;
        }
      });

      // Calcular promedios
      const averageCompensation: Record<string, number> = {};
      Object.entries(compensationByType).forEach(([type, data]) => {
        averageCompensation[type] = Math.round(data.total / data.count);
      });

      // Top categorías
      const topCategories = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([category, count]) => ({ category, count }));

      const duration = Date.now() - startTime;
      dbConnection.recordQuery(`statistics_${this.collectionName}`, duration, true);

      return {
        totalOffers: totalSnapshot.data().count,
        activeOffers: activeSnapshot.data().count,
        offersByType,
        averageCompensation,
        topCategories
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      dbConnection.recordQuery(`statistics_${this.collectionName}`, duration, false);
      throw error;
    }
  }
}

// Repository para aplicaciones
export class ApplicationRepository extends BaseRepository<Application> {
  protected collectionName = 'marketplace_applications';
  protected entitySchema = ApplicationSchema;

  /**
   * Crea una nueva aplicación
   */
  public async create(data: Omit<Application, keyof BaseEntity>, context: ServiceContext): Promise<Application> {
    // Solo doctores pueden aplicar
    if (context.userRole !== 'doctor') {
      throw new Error('FORBIDDEN: Only doctors can apply to offers');
    }

    // Verificar que no haya aplicado antes
    const db = await this.ensureFirestore();
    const existingApplication = await db.collection(this.collectionName)
      .where('offerId', '==', data.offerId)
      .where('doctorId', '==', data.doctorId)
      .limit(1)
      .get();

    if (!existingApplication.empty) {
      throw new Error('DUPLICATE_APPLICATION: You have already applied to this offer');
    }

    return super.create(data, context);
  }

  /**
   * Encuentra aplicaciones por oferta
   */
  public async findByOfferId(
    offerId: string, 
    context: ServiceContext, 
    options: QueryOptions = {}
  ): Promise<RepositoryResult<Application>> {
    // Solo la empresa propietaria o admin puede ver aplicaciones
    const db = await this.ensureFirestore();
    const offer = await db.collection('marketplace_offers').doc(offerId).get();
    
    if (!offer.exists) {
      return { data: [], total: 0, hasMore: false };
    }

    const offerData = offer.data();
    if (context.userRole === 'company') {
      const companyDoc = await db.collection('companies')
        .where('firebaseUid', '==', context.userId)
        .limit(1)
        .get();
      
      if (companyDoc.empty || companyDoc.docs[0].id !== offerData?.companyId) {
        return { data: [], total: 0, hasMore: false };
      }
    } else if (context.userRole !== 'admin') {
      return { data: [], total: 0, hasMore: false };
    }

    const queryOptions = {
      ...options,
      filters: {
        ...options.filters,
        offerId
      }
    };

    return this.findMany(queryOptions, context);
  }

  /**
   * Encuentra aplicaciones por doctor
   */
  public async findByDoctorId(
    doctorId: string, 
    context: ServiceContext, 
    options: QueryOptions = {}
  ): Promise<RepositoryResult<Application>> {
    // Solo el propio doctor o admin puede ver sus aplicaciones
    if (context.userRole !== 'admin' && 
        (context.userRole !== 'doctor' || context.userId !== doctorId)) {
      return { data: [], total: 0, hasMore: false };
    }

    const queryOptions = {
      ...options,
      filters: {
        ...options.filters,
        doctorId
      }
    };

    return this.findMany(queryOptions, context);
  }
}

// Instancias singleton
export const marketplaceRepository = new MarketplaceRepository();
export const applicationRepository = new ApplicationRepository();