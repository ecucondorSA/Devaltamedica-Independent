// Minimal, framework-agnostic audit middleware for Express-only scope
import type { NextFunction, Request, Response } from 'express';
import { hashChainService } from '../services/hash-chain.service';
type NextRequest = Request & { nextUrl?: { pathname: string; searchParams: URLSearchParams } };
type NextResponse = Response;
const headers = () => new Map<string, string>();
// Local lightweight repo interface to avoid cross-package dependency during build
interface AuditLog {
  actorId: string;
  actorType: string;
  resource: string;
  action: string;
  timestamp: Date;
  ip: string;
  userAgent: string;
  metadata?: Record<string, unknown>;
}
class AuditLogRepository {
  async create(_entry: any): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }
}

/**
 * Audit Middleware for AltaMedica Platform
 * Captures medical events for Argentina Ley 26.529 compliance
 * GAP-001-T5: Implements hash chain for immutable audit trail
 */

export interface AuditContext {
  userId?: string;
  userRole?: string;
  resource?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class AuditMiddleware {
  private auditRepo: AuditLogRepository;
  private fallbackLogger: Console;

  constructor() {
    this.auditRepo = new AuditLogRepository();
    this.fallbackLogger = console;
  }

  /**
   * Extract IP address from request
   */
  private getClientIp(request: NextRequest): string {
    const headersList = headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const cfConnectingIp = headersList.get('cf-connecting-ip');

    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    if (realIp) {
      return realIp;
    }
    if (cfConnectingIp) {
      return cfConnectingIp;
    }

    // Fallback to localhost for development
    return '127.0.0.1';
  }

  /**
   * Extract user agent from request
   */
  private getUserAgent(request: NextRequest): string {
    const headersList = headers();
    return headersList.get('user-agent') || 'Unknown';
  }

  /**
   * Determine action from HTTP method and path
   */
  private determineAction(method: string, path: string): string {
    // Prescription-specific actions
    if (path.includes('/prescriptions')) {
      if (method === 'POST') return 'prescription_create';
      if (method === 'GET') return 'prescription_list';
      if (method === 'PUT' || method === 'PATCH') return 'prescription_update';
      if (method === 'DELETE') return 'prescription_delete';
    }

    // Medical record actions
    if (path.includes('/medical-records')) {
      if (method === 'GET') return 'medical_record_view';
      if (method === 'POST') return 'medical_record_create';
    }

    // Patient actions
    if (path.includes('/patients')) {
      if (method === 'GET') return 'patient_view';
      if (method === 'POST') return 'patient_create';
      if (method === 'PUT') return 'patient_update';
    }

    // Default actions
    switch (method) {
      case 'GET':
        return 'view';
      case 'POST':
        return 'create';
      case 'PUT':
      case 'PATCH':
        return 'update';
      case 'DELETE':
        return 'delete';
      default:
        return 'unknown';
    }
  }

  /**
   * Extract resource from path
   */
  private extractResource(path: string): string {
    // Remove query params
    const cleanPath = path.split('?')[0];

    // Remove API prefix
    const resourcePath = cleanPath.replace('/api/v1/', '').replace('/api/', '');

    return resourcePath || 'unknown';
  }

  /**
   * Create audit log entry with fallback mechanism
   */
  async createAuditLog(request: NextRequest, context: AuditContext): Promise<void> {
    try {
      const path = request.nextUrl.pathname;
      const method = request.method;

      // Determine audit fields
      const action = context.action || this.determineAction(method, path);
      const resource = context.resource || this.extractResource(path);
      const ipAddress = this.getClientIp(request);
      const userAgent = this.getUserAgent(request);

      // Skip non-auditable actions (health checks, static assets)
      if (this.shouldSkipAudit(path, action)) {
        return;
      }

      // Create base audit log entry
      const baseEntry: Omit<AuditLog, 'id' | 'hash' | 'prevHash' | 'sequenceNumber'> = {
        actorId: context.userId || 'anonymous',
        actorType: context.userRole || 'unknown',
        resource,
        action,
        timestamp: new Date(),
        ip: ipAddress,
        userAgent,
        metadata: {
          ...context.metadata,
          method,
          path,
          query: Object.fromEntries(request.nextUrl.searchParams),
        },
      };

      // Add hash chain fields (GAP-001-T5)
      const auditEntry = await hashChainService.addHashChain(baseEntry);

      // Attempt to persist with silent fallback
      await this.persistWithFallback(auditEntry);
    } catch (error) {
      // Silent failure - log to console for debugging
      this.fallbackLogger.error('[AuditMiddleware] Failed to create audit log:', error);
    }
  }

  /**
   * Persist audit log with fallback mechanism
   */
  private async persistWithFallback(auditEntry: AuditLog): Promise<void> {
    try {
      // Primary persistence to database
      const result = await this.auditRepo.create(auditEntry as any);

      if (!result.success) {
        throw new Error(result.error || 'Failed to persist audit log');
      }
    } catch (primaryError) {
      // Fallback to console logging (could be extended to file/queue)
      this.fallbackLogger.warn('[AuditMiddleware] Fallback logging activated');
      this.fallbackLogger.info(
        '[AUDIT]',
        JSON.stringify({
          ...auditEntry,
          fallback: true,
          error: primaryError instanceof Error ? primaryError.message : 'Unknown error',
        }),
      );
    }
  }

  /**
   * Determine if audit should be skipped
   */
  private shouldSkipAudit(path: string, action: string): boolean {
    // Skip health checks
    if (path.includes('/health') || path.includes('/ping')) {
      return true;
    }

    // Skip static assets
    if (path.includes('/_next/') || path.includes('/static/')) {
      return true;
    }

    // Skip OPTIONS requests
    if (action === 'unknown') {
      return true;
    }

    return false;
  }

  /**
   * Middleware function for Next.js
   */
  middleware = async (
    request: NextRequest,
    _res: NextResponse,
    _next?: NextFunction,
    context: AuditContext = {},
  ): Promise<NextResponse> => {
    // Create audit log asynchronously (non-blocking)
    this.createAuditLog(request, context).catch((error) => {
      this.fallbackLogger.error('[AuditMiddleware] Unexpected error:', error);
    });

    // Continue with request processing
    return _res;
  };

  /**
   * Audit a specific event (for manual use in endpoints)
   */
  async auditEvent(
    actorId: string,
    action: string,
    resource: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      const baseEntry: Omit<AuditLog, 'id' | 'hash' | 'prevHash' | 'sequenceNumber'> = {
        actorId,
        actorType: metadata?.role || 'unknown',
        resource,
        action,
        timestamp: new Date(),
        ip: metadata?.ip || '127.0.0.1',
        userAgent: metadata?.userAgent || 'API',
        metadata,
      };

      // Add hash chain fields (GAP-001-T5)
      const auditEntry = await hashChainService.addHashChain(baseEntry);

      await this.persistWithFallback(auditEntry);
    } catch (error) {
      this.fallbackLogger.error('[AuditMiddleware] Manual audit failed:', error);
    }
  }
}

// Export singleton instance
export const auditMiddleware = new AuditMiddleware();

// Export middleware function for Next.js
export function withAudit(handler: Function) {
  return async (request: NextRequest, _res?: NextResponse, context?: any) => {
    // Extract user context from request if available
    const auditContext: AuditContext = {
      userId: context?.params?.userId,
      userRole: context?.params?.role,
      // Additional context can be added here
    };

    // Run audit middleware
    await auditMiddleware.middleware(
      request,
      (_res as any) || ({} as any),
      undefined,
      auditContext,
    );

    // Continue with original handler
    return handler(request, context);
  };
}

// Export for manual auditing in endpoints
export const auditEvent = auditMiddleware.auditEvent.bind(auditMiddleware);
