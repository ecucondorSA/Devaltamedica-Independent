/**
 * 🏗️ SERVICE PATTERN BASE - ALTAMEDICA
 * Patrón base para servicios en arquitectura orientada a dominios
 */

export interface ServiceContext {
  userId?: string;
  userRole?: string;
  companyId?: string;
  permissions?: string[];
  ipAddress?: string;
  userAgent?: string;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Base class for domain services
 */
export abstract class BaseService {
  protected context?: ServiceContext;

  constructor(context?: ServiceContext) {
    this.context = context;
  }

  protected createSuccess<T>(data: T): ServiceResult<T> {
    return {
      success: true,
      data
    };
  }

  protected createError(error: string, code?: string): ServiceResult<never> {
    return {
      success: false,
      error,
      code
    };
  }

  protected hasPermission(permission: string): boolean {
    if (!this.context?.permissions) return false;
    return this.context.permissions.includes(permission) || 
           this.context.userRole === 'ADMIN';
  }

  protected checkPermissions(requiredPermissions: string[]): void {
    for (const permission of requiredPermissions) {
      if (!this.hasPermission(permission)) {
        throw new Error(`Insufficient permissions: ${permission} required`);
      }
    }
  }

  protected checkRole(allowedRoles: string[]): void {
    if (!this.context?.userRole) {
      throw new Error('User role not provided in context');
    }

    if (!allowedRoles.includes(this.context.userRole) && this.context.userRole !== 'ADMIN') {
      throw new Error(`Insufficient role permissions. Required: ${allowedRoles.join(', ')}`);
    }
  }
}

/**
 * Utility functions for service pattern
 */
export const ServiceUtils = {
  /**
   * Create paginated result
   */
  createPaginatedResult<T>(
    items: T[], 
    total: number, 
    page: number = 1, 
    limit: number = 50
  ): PaginatedResult<T> {
    return {
      items,
      total,
      page,
      limit,
      hasMore: (page * limit) < total
    };
  },

  /**
   * Validate required fields
   */
  validateRequired(data: Record<string, any>, requiredFields: string[]): void {
    const missingFields = requiredFields.filter(field => 
      data[field] === undefined || data[field] === null || data[field] === ''
    );

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  },

  /**
   * Sanitize query options
   */
  sanitizeQueryOptions(options: QueryOptions = {}): QueryOptions {
    return {
      page: Math.max(1, options.page || 1),
      limit: Math.min(100, Math.max(1, options.limit || 50)),
      sortBy: options.sortBy || 'createdAt',
      sortOrder: options.sortOrder === 'asc' ? 'asc' : 'desc',
      filters: options.filters || {}
    };
  }
};