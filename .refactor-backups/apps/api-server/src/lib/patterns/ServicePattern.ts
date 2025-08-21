/**
 * 🏗️ SERVICE PATTERN TEMPLATE - ALTAMEDICA
 * Patrón estándar para todos los endpoints de la API
 * Versión: 2.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auditLog } from '@/lib/audit';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';

import { logger } from '@altamedica/shared/services/logger.service';
// Base types for all services
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface ServiceContext {
  userId: string;
  userRole: string;
  companyId?: string;
  permissions: string[];
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface ServiceResponse<T> {
  data: T;
  total?: number;
  page?: number;
  limit?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

// Abstract base service class
export abstract class BaseService<T extends BaseEntity> {
  protected abstract collectionName: string;
  protected abstract entitySchema: z.ZodSchema<any>;
  
  // CRUD Operations
  abstract create(data: Omit<T, keyof BaseEntity>, context: ServiceContext): Promise<T>;
  abstract findById(id: string, context: ServiceContext): Promise<T | null>;
  abstract findMany(options: QueryOptions, context: ServiceContext): Promise<ServiceResponse<T[]>>;
  abstract update(id: string, data: Partial<T>, context: ServiceContext): Promise<T>;
  abstract delete(id: string, context: ServiceContext): Promise<boolean>;
  
  // Validation
  protected validateCreate(data: any): any {
    return this.entitySchema.parse(data);
  }
  
  protected validateUpdate(data: any): any {
    return this.entitySchema.partial().parse(data);
  }
  
  // Audit logging
  protected async logAction(
    action: string,
    entityId: string,
    context: ServiceContext,
    details?: Record<string, any>
  ): Promise<void> {
    await auditLog({
      action,
      userId: context.userId,
      resource: this.collectionName,
      resourceId: entityId,
      details: details || {},
      category: 'api',
      severity: 'medium'
    });
  }
  
  // Permission checks
  protected checkPermission(context: ServiceContext, action: string): boolean {
    const requiredPermission = `${this.collectionName}:${action}`;
    return context.permissions.includes(requiredPermission) || 
           context.permissions.includes('admin:all');
  }
  
  // Common query building
  protected buildQuery(options: QueryOptions) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', filters = {} } = options;
    return {
      page: Math.max(1, page),
      limit: Math.min(100, Math.max(1, limit)),
      offset: (page - 1) * limit,
      sortBy,
      sortOrder,
      filters
    };
  }
}

// Standard route handler factory
export function createServiceRoute<T extends BaseEntity>(
  service: BaseService<T>,
  options: {
    requireAuth?: boolean;
    allowedRoles?: string[];
    auditActions?: boolean;
    rateLimit?: string;
  } = {}
) {
  const {
    requireAuth = true,
    allowedRoles = [],
    auditActions = true,
    rateLimit
  } = options;

  return {
    // GET - List entities
    async GET(request: NextRequest, context?: { params?: any }) {
      try {
        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const queryOptions: QueryOptions = {
          page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
          limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
          sortBy: searchParams.get('sortBy') || 'createdAt',
          sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
          filters: Object.fromEntries(
            Array.from(searchParams.entries()).filter(([key]) => 
              !['page', 'limit', 'sortBy', 'sortOrder'].includes(key)
            )
          )
        };

        // Get service context (from auth middleware)
        const serviceContext = (request as any).serviceContext as ServiceContext;
        
        // Check permissions
        if (!service['checkPermission'](serviceContext, 'read')) {
          return NextResponse.json(
            createErrorResponse('PERMISSION_DENIED', 'Insufficient permissions to read resources'),
            { status: 403 }
          );
        }

        // Execute service
        const result = await service.findMany(queryOptions, serviceContext);
        
        // Audit log
        if (auditActions) {
          await service['logAction']('list', 'multiple', serviceContext, {
            queryOptions,
            resultCount: result.data.length
          });
        }

        return NextResponse.json(createSuccessResponse(result.data, {
          total: result.total,
          page: result.page,
          limit: result.limit,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev
        }));

      } catch (error) {
        logger.error(`Error in GET ${service['collectionName']}:`, undefined, error);
        
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            createErrorResponse('VALIDATION_ERROR', 'Invalid query parameters', {
              validationErrors: error.errors
            }),
            { status: 400 }
          );
        }

        return NextResponse.json(
          createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
          { status: 500 }
        );
      }
    },

    // POST - Create entity
    async POST(request: NextRequest) {
      try {
        const body = await request.json();
        const serviceContext = (request as any).serviceContext as ServiceContext;
        
        // Check permissions
        if (!service['checkPermission'](serviceContext, 'create')) {
          return NextResponse.json(
            createErrorResponse('PERMISSION_DENIED', 'Insufficient permissions to create resource'),
            { status: 403 }
          );
        }

        // Validate data
        const validatedData = service['validateCreate'](body);
        
        // Execute service
        const result = await service.create(validatedData, serviceContext);
        
        // Audit log
        if (auditActions) {
          await service['logAction']('create', result.id, serviceContext, {
            createdData: validatedData
          });
        }

        return NextResponse.json(
          createSuccessResponse(result),
          { status: 201 }
        );

      } catch (error) {
        logger.error(`Error in POST ${service['collectionName']}:`, undefined, error);
        
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            createErrorResponse('VALIDATION_ERROR', 'Invalid input data', {
              validationErrors: error.errors
            }),
            { status: 400 }
          );
        }

        return NextResponse.json(
          createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
          { status: 500 }
        );
      }
    },

    // PUT - Update entity
    async PUT(request: NextRequest, context?: { params?: any }) {
      try {
        const body = await request.json();
        const serviceContext = (request as any).serviceContext as ServiceContext;
        const entityId = context?.params?.id || new URL(request.url).searchParams.get('id');
        
        if (!entityId) {
          return NextResponse.json(
            createErrorResponse('INVALID_REQUEST', 'Entity ID is required'),
            { status: 400 }
          );
        }

        // Check permissions
        if (!service['checkPermission'](serviceContext, 'update')) {
          return NextResponse.json(
            createErrorResponse('PERMISSION_DENIED', 'Insufficient permissions to update resource'),
            { status: 403 }
          );
        }

        // Validate data
        const validatedData = service['validateUpdate'](body);
        
        // Execute service
        const result = await service.update(entityId, validatedData, serviceContext);
        
        // Audit log
        if (auditActions) {
          await service['logAction']('update', entityId, serviceContext, {
            updatedData: validatedData
          });
        }

        return NextResponse.json(createSuccessResponse(result));

      } catch (error) {
        logger.error(`Error in PUT ${service['collectionName']}:`, undefined, error);
        
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            createErrorResponse('VALIDATION_ERROR', 'Invalid input data', {
              validationErrors: error.errors
            }),
            { status: 400 }
          );
        }

        return NextResponse.json(
          createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
          { status: 500 }
        );
      }
    },

    // DELETE - Delete entity
    async DELETE(request: NextRequest, context?: { params?: any }) {
      try {
        const serviceContext = (request as any).serviceContext as ServiceContext;
        const entityId = context?.params?.id || new URL(request.url).searchParams.get('id');
        
        if (!entityId) {
          return NextResponse.json(
            createErrorResponse('INVALID_REQUEST', 'Entity ID is required'),
            { status: 400 }
          );
        }

        // Check permissions
        if (!service['checkPermission'](serviceContext, 'delete')) {
          return NextResponse.json(
            createErrorResponse('PERMISSION_DENIED', 'Insufficient permissions to delete resource'),
            { status: 403 }
          );
        }
        
        // Execute service
        const success = await service.delete(entityId, serviceContext);
        
        if (!success) {
          return NextResponse.json(
            createErrorResponse('NOT_FOUND', 'Resource not found'),
            { status: 404 }
          );
        }
        
        // Audit log
        if (auditActions) {
          await service['logAction']('delete', entityId, serviceContext);
        }

        return NextResponse.json(createSuccessResponse({ 
          deleted: true, 
          id: entityId 
        }));

      } catch (error) {
        logger.error(`Error in DELETE ${service['collectionName']}:`, undefined, error);
        
        return NextResponse.json(
          createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
          { status: 500 }
        );
      }
    }
  };
}

// Helper for dynamic routing
export function createDynamicServiceRoute<T extends BaseEntity>(
  service: BaseService<T>,
  options: Parameters<typeof createServiceRoute>[1] = {}
) {
  return {
    // GET by ID
    async GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
      try {
        const { id } = await params;
        const serviceContext = (request as any).serviceContext as ServiceContext;
        
        // Check permissions
        if (!service['checkPermission'](serviceContext, 'read')) {
          return NextResponse.json(
            createErrorResponse('PERMISSION_DENIED', 'Insufficient permissions to read resource'),
            { status: 403 }
          );
        }

        // Execute service
        const result = await service.findById(id, serviceContext);
        
        if (!result) {
          return NextResponse.json(
            createErrorResponse('NOT_FOUND', 'Resource not found'),
            { status: 404 }
          );
        }

        // Audit log
        if (options.auditActions !== false) {
          await service['logAction']('read', id, serviceContext);
        }

        return NextResponse.json(createSuccessResponse(result));

      } catch (error) {
        logger.error(`Error in GET ${service['collectionName']} by ID:`, undefined, error);
        
        return NextResponse.json(
          createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
          { status: 500 }
        );
      }
    },

    // PUT by ID
    async PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
      const routes = createServiceRoute(service, options);
      return routes.PUT(request, { params: await params });
    },

    // DELETE by ID
    async DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
      const routes = createServiceRoute(service, options);
      return routes.DELETE(request, { params: await params });
    }
  };
}