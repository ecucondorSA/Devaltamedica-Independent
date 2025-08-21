/**
 * 🏢 COMPANY REPOSITORY - ALTAMEDICA
 * Repository especializado para gestión de empresas con validaciones B2B
 * y funcionalidades específicas para marketplace médico
 */

import { BaseRepository, BaseEntity, ServiceContext, QueryOptions, RepositoryResult } from './BaseRepository';
import { z } from 'zod';
import { dbConnection } from '../core/DatabaseConnection';

import { logger } from '@altamedica/shared/services/logger.service';
// Schema Zod para Company
export const CompanySchema = z.object({
  firebaseUid: z.string().min(1, "El UID de Firebase es requerido"),
  name: z.string().min(2, "El nombre de la empresa es requerido"),
  email: z.string().email("El email no es válido"),
  phoneNumber: z.string().optional(),
  website: z.string().url().optional(),
  logo: z.string().url().optional(),
  description: z.string().optional(),
  industry: z.enum(['hospital', 'clinic', 'laboratory', 'pharmacy', 'insurance', 'other']),
  size: z.enum(['small', 'medium', 'large', 'enterprise']).optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string().default('Mexico')
  }).optional(),
  businessInfo: z.object({
    taxId: z.string().optional(),
    businessLicense: z.string().optional(),
    foundedYear: z.number().optional(),
    employeeCount: z.number().optional()
  }).optional(),
  marketplaceInfo: z.object({
    isActive: z.boolean().default(true),
    rating: z.number().min(0).max(5).default(0),
    reviewCount: z.number().default(0),
    jobCount: z.number().default(0),
    hiredCount: z.number().default(0),
    responseTime: z.string().optional(), // e.g., "within 24 hours"
    verificationStatus: z.enum(['pending', 'verified', 'rejected']).default('pending')
  }).optional(),
  compliance: z.object({
    hipaaCompliant: z.boolean().default(false),
    certificates: z.array(z.object({
      name: z.string(),
      issuer: z.string(),
      issueDate: z.date(),
      expiryDate: z.date().optional(),
      documentUrl: z.string().optional()
    })).default([])
  }).optional(),
  preferences: z.object({
    language: z.string().default('es'),
    timezone: z.string().default('America/Mexico_City'),
    currency: z.string().default('MXN'),
    communicationPreferences: z.object({
      email: z.boolean().default(true),
      sms: z.boolean().default(true),
      push: z.boolean().default(true)
    }).default({})
  }).optional()
});

export interface Company extends BaseEntity {
  firebaseUid: string;
  name: string;
  email: string;
  phoneNumber?: string;
  website?: string;
  logo?: string;
  description?: string;
  industry: 'hospital' | 'clinic' | 'laboratory' | 'pharmacy' | 'insurance' | 'other';
  size?: 'small' | 'medium' | 'large' | 'enterprise';
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  businessInfo?: {
    taxId?: string;
    businessLicense?: string;
    foundedYear?: number;
    employeeCount?: number;
  };
  marketplaceInfo?: {
    isActive: boolean;
    rating: number;
    reviewCount: number;
    jobCount: number;
    hiredCount: number;
    responseTime?: string;
    verificationStatus: 'pending' | 'verified' | 'rejected';
  };
  compliance?: {
    hipaaCompliant: boolean;
    certificates: Array<{
      name: string;
      issuer: string;
      issueDate: Date;
      expiryDate?: Date;
      documentUrl?: string;
    }>;
  };
  preferences?: {
    language: string;
    timezone: string;
    currency: string;
    communicationPreferences: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
}

export class CompanyRepository extends BaseRepository<Company> {
  protected collectionName = 'companies';
  protected entitySchema = CompanySchema;

  /**
   * Verifica permisos de acceso a datos de empresa
   */
  private async checkCompanyAccess(companyId: string, context: ServiceContext): Promise<boolean> {
    try {
      const company = await super.findById(companyId, context);
      if (!company) return false;

      // Administradores tienen acceso completo
      if (context.userRole === 'admin') return true;

      // Las empresas pueden acceder a sus propios datos
      if (context.userRole === 'company' && company.firebaseUid === context.userId) return true;

      // Doctores pueden ver información pública de empresas
      if (context.userRole === 'doctor' && company.marketplaceInfo?.isActive) return true;

      return false;
    } catch (error) {
      logger.error('Error checking company access:', error);
      return false;
    }
  }

  /**
   * Override findById con verificación de permisos
   */
  public async findById(id: string, context: ServiceContext): Promise<Company | null> {
    const hasAccess = await this.checkCompanyAccess(id, context);
    if (!hasAccess) {
      await this.logAudit('access_denied', id, context);
      return null;
    }

    return super.findById(id, context);
  }

  /**
   * Encuentra empresa por firebaseUid
   */
  public async findByFirebaseUid(firebaseUid: string, context: ServiceContext): Promise<Company | null> {
    const startTime = Date.now();
    const db = await this.ensureFirestore();

    try {
      const query = db.collection(this.collectionName)
        .where('firebaseUid', '==', firebaseUid)
        .where('status', '!=', 'archived')
        .limit(1);

      const snapshot = await query.get();

      if (snapshot.empty) {
        const duration = Date.now() - startTime;
        dbConnection.recordQuery(`findByFirebaseUid_${this.collectionName}`, duration, true);
        return null;
      }

      const company = this.documentToEntity(snapshot.docs[0]);

      // Verificar permisos
      const hasAccess = await this.checkCompanyAccess(company.id, context);
      if (!hasAccess) {
        await this.logAudit('access_denied', company.id, context);
        return null;
      }

      await this.logAudit('read', company.id, context);

      const duration = Date.now() - startTime;
      dbConnection.recordQuery(`findByFirebaseUid_${this.collectionName}`, duration, true);

      return company;
    } catch (error) {
      const duration = Date.now() - startTime;
      dbConnection.recordQuery(`findByFirebaseUid_${this.collectionName}`, duration, false);
      throw error;
    }
  }

  /**
   * Encuentra empresas activas en el marketplace
   */
  public async findActiveMarketplaceCompanies(
    options: QueryOptions = {}, 
    context: ServiceContext
  ): Promise<RepositoryResult<Company>> {
    // Solo usuarios autenticados pueden ver el marketplace
    if (!context.userId) {
      await this.logAudit('access_denied', 'marketplace', context);
      return { data: [], total: 0, hasMore: false };
    }

    const queryOptions = {
      ...options,
      filters: {
        ...options.filters,
        'marketplaceInfo.isActive': true,
        'marketplaceInfo.verificationStatus': 'verified'
      },
      sortBy: options.sortBy || 'marketplaceInfo.rating',
      sortOrder: options.sortOrder || 'desc'
    };

    return this.findMany(queryOptions, context);
  }

  /**
   * Busca empresas por industria
   */
  public async findByIndustry(
    industry: Company['industry'], 
    context: ServiceContext, 
    options: QueryOptions = {}
  ): Promise<RepositoryResult<Company>> {
    const queryOptions = {
      ...options,
      filters: {
        ...options.filters,
        industry,
        'marketplaceInfo.isActive': true
      }
    };

    return this.findMany(queryOptions, context);
  }

  /**
   * Busca empresas por email (para verificación de duplicados)
   */
  public async findByEmail(email: string, context: ServiceContext): Promise<Company | null> {
    if (context.userRole !== 'admin') {
      return null;
    }

    const startTime = Date.now();
    const db = await this.ensureFirestore();

    try {
      const query = db.collection(this.collectionName)
        .where('email', '==', email.toLowerCase())
        .where('status', '!=', 'archived')
        .limit(1);

      const snapshot = await query.get();

      if (snapshot.empty) {
        const duration = Date.now() - startTime;
        dbConnection.recordQuery(`findByEmail_${this.collectionName}`, duration, true);
        return null;
      }

      const company = this.documentToEntity(snapshot.docs[0]);

      const duration = Date.now() - startTime;
      dbConnection.recordQuery(`findByEmail_${this.collectionName}`, duration, true);

      return company;
    } catch (error) {
      const duration = Date.now() - startTime;
      dbConnection.recordQuery(`findByEmail_${this.collectionName}`, duration, false);
      throw error;
    }
  }

  /**
   * Crea una nueva empresa con validaciones adicionales
   */
  public async create(data: Omit<Company, keyof BaseEntity>, context: ServiceContext): Promise<Company> {
    // Solo admins o el mismo usuario empresa pueden crear
    if (context.userRole !== 'admin' && 
        (context.userRole !== 'company' || context.userId !== data.firebaseUid)) {
      throw new Error('FORBIDDEN: Insufficient permissions to create company');
    }

    // Verificar si el email ya existe
    const existingCompany = await this.findByEmail(data.email, context);
    if (existingCompany) {
      throw new Error('DUPLICATE_EMAIL: A company with this email already exists');
    }

    // Normalizar email
    (data as any).email = data.email.toLowerCase();

    // Inicializar valores por defecto para marketplace
    if (!data.marketplaceInfo) {
      (data as any).marketplaceInfo = {
        isActive: false,
        rating: 0,
        reviewCount: 0,
        jobCount: 0,
        hiredCount: 0,
        verificationStatus: 'pending'
      };
    }

    return super.create(data, context);
  }

  /**
   * Actualiza información de la empresa con validaciones
   */
  public async update(
    id: string, 
    data: Partial<Omit<Company, keyof BaseEntity>>, 
    context: ServiceContext
  ): Promise<Company | null> {
    const hasAccess = await this.checkCompanyAccess(id, context);
    if (!hasAccess) {
      throw new Error('FORBIDDEN: Insufficient permissions to update this company');
    }

    // Normalizar email si se está actualizando
    if (data.email) {
      (data as any).email = data.email.toLowerCase();
      
      // Verificar duplicados
      const existingCompany = await this.findByEmail(data.email, context);
      if (existingCompany && existingCompany.id !== id) {
        throw new Error('DUPLICATE_EMAIL: Another company with this email already exists');
      }
    }

    // Solo admins pueden cambiar el estado de verificación
    if (data.marketplaceInfo?.verificationStatus && context.userRole !== 'admin') {
      delete (data.marketplaceInfo as any).verificationStatus;
    }

    return super.update(id, data, context);
  }

  /**
   * Actualiza el rating de la empresa
   */
  public async updateRating(
    companyId: string, 
    newRating: number, 
    context: ServiceContext
  ): Promise<Company | null> {
    // Solo el sistema o admins pueden actualizar ratings
    if (context.userRole !== 'admin') {
      throw new Error('FORBIDDEN: Only admins can update ratings');
    }

    const company = await this.findById(companyId, context);
    if (!company) return null;

    const currentRating = company.marketplaceInfo?.rating || 0;
    const currentCount = company.marketplaceInfo?.reviewCount || 0;
    
    // Calcular nuevo rating promedio
    const totalRating = (currentRating * currentCount) + newRating;
    const newCount = currentCount + 1;
    const averageRating = totalRating / newCount;

    return this.update(companyId, {
      marketplaceInfo: {
        isActive: company.marketplaceInfo?.isActive ?? true,
        rating: Math.round(averageRating * 10) / 10, // Redondear a 1 decimal
        reviewCount: newCount,
        jobCount: company.marketplaceInfo?.jobCount ?? 0,
        hiredCount: company.marketplaceInfo?.hiredCount ?? 0,
        responseTime: company.marketplaceInfo?.responseTime,
        verificationStatus: company.marketplaceInfo?.verificationStatus ?? 'pending'
      }
    }, context);
  }

  /**
   * Incrementa el contador de trabajos publicados
   */
  public async incrementJobCount(companyId: string, context: ServiceContext): Promise<Company | null> {
    const company = await this.findById(companyId, context);
    if (!company) return null;

    return this.update(companyId, {
      marketplaceInfo: {
        isActive: company.marketplaceInfo?.isActive ?? true,
        rating: company.marketplaceInfo?.rating ?? 0,
        reviewCount: company.marketplaceInfo?.reviewCount ?? 0,
        jobCount: (company.marketplaceInfo?.jobCount || 0) + 1,
        hiredCount: company.marketplaceInfo?.hiredCount ?? 0,
        responseTime: company.marketplaceInfo?.responseTime,
        verificationStatus: company.marketplaceInfo?.verificationStatus ?? 'pending'
      }
    }, context);
  }

  /**
   * Obtiene estadísticas de empresas
   */
  public async getStatistics(context: ServiceContext): Promise<{
    totalCompanies: number;
    activeCompanies: number;
    companiesByIndustry: Record<string, number>;
    verifiedCompanies: number;
    averageRating: number;
  }> {
    if (context.userRole !== 'admin') {
      throw new Error('FORBIDDEN: Insufficient permissions');
    }

    const startTime = Date.now();
    const db = await this.ensureFirestore();

    try {
      const [totalSnapshot, activeSnapshot, allCompaniesSnapshot] = await Promise.all([
        db.collection(this.collectionName).where('status', '!=', 'archived').count().get(),
        db.collection(this.collectionName)
          .where('marketplaceInfo.isActive', '==', true)
          .count().get(),
        db.collection(this.collectionName).where('status', '!=', 'archived').get()
      ]);

      const companiesByIndustry: Record<string, number> = {};
      let totalRating = 0;
      let ratingCount = 0;
      let verifiedCount = 0;

      allCompaniesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Contar por industria
        if (data.industry) {
          companiesByIndustry[data.industry] = (companiesByIndustry[data.industry] || 0) + 1;
        }

        // Contar verificadas
        if (data.marketplaceInfo?.verificationStatus === 'verified') {
          verifiedCount++;
        }

        // Calcular rating promedio
        if (data.marketplaceInfo?.rating && data.marketplaceInfo?.reviewCount > 0) {
          totalRating += data.marketplaceInfo.rating;
          ratingCount++;
        }
      });

      const duration = Date.now() - startTime;
      dbConnection.recordQuery(`statistics_${this.collectionName}`, duration, true);

      return {
        totalCompanies: totalSnapshot.data().count,
        activeCompanies: activeSnapshot.data().count,
        companiesByIndustry,
        verifiedCompanies: verifiedCount,
        averageRating: ratingCount > 0 ? Math.round((totalRating / ratingCount) * 10) / 10 : 0
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      dbConnection.recordQuery(`statistics_${this.collectionName}`, duration, false);
      throw error;
    }
  }
}

// Instancia singleton para uso global
export const companyRepository = new CompanyRepository();