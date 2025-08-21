import { NextRequest, NextResponse } from 'next/server';
import { UnifiedAuth } from '@/auth/UnifiedAuthSystem';
import { AuditLogRepository } from '@altamedica/database';
import { z } from 'zod';

import { logger } from '@altamedica/shared/services/logger.service';
/**
 * Audit Logs Query API
 * Provides secure access to audit trail for compliance reporting
 * Argentina Ley 26.529 & HIPAA compliant
 */

// Query parameters schema
const AuditQuerySchema = z.object({
  actorId: z.string().uuid().optional(),
  resource: z.string().optional(),
  action: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20)
});

// Public DTO schema (excludes sensitive fields)
const AuditLogDTOSchema = z.object({
  id: z.string(),
  actorId: z.string(),
  actorType: z.string(),
  resource: z.string(),
  action: z.string(),
  timestamp: z.date(),
  metadata: z.record(z.any()).optional()
});

type AuditLogDTO = z.infer<typeof AuditLogDTOSchema>;
type AuditQuery = z.infer<typeof AuditQuerySchema>;

class AuditLogsService {
  private auditRepo: AuditLogRepository;

  constructor() {
    this.auditRepo = new AuditLogRepository();
  }

  /**
   * Query audit logs with pagination and filters
   */
  async queryAuditLogs(query: AuditQuery): Promise<{
    data: AuditLogDTO[];
    nextCursor?: string;
    hasMore: boolean;
    total: number;
  }> {
    try {
      // Build filter conditions
      const filters: any = {};
      
      if (query.actorId) {
        filters.actorId = query.actorId;
      }
      
      if (query.resource) {
        filters.resource = query.resource;
      }
      
      if (query.action) {
        filters.action = query.action;
      }
      
      // Date range filter
      if (query.startDate || query.endDate) {
        filters.timestamp = {};
        if (query.startDate) {
          filters.timestamp.$gte = new Date(query.startDate);
        }
        if (query.endDate) {
          filters.timestamp.$lte = new Date(query.endDate);
        }
      }

      // Fetch from repository with pagination
      const result = await this.auditRepo.findMany({
        where: filters,
        orderBy: { timestamp: 'desc' },
        limit: query.limit + 1, // Fetch one extra to check if there's more
        cursor: query.cursor
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch audit logs');
      }

      const logs = result.data || [];
      const hasMore = logs.length > query.limit;
      
      // Remove the extra item if present
      if (hasMore) {
        logs.pop();
      }

      // Map to DTO (remove sensitive fields like IP)
      const dtoLogs: AuditLogDTO[] = logs.map(log => ({
        id: log.id,
        actorId: log.actorId,
        actorType: log.actorType,
        resource: log.resource,
        action: log.action,
        timestamp: log.timestamp,
        metadata: log.metadata
      }));

      // Generate next cursor
      const nextCursor = hasMore && logs.length > 0 
        ? logs[logs.length - 1].id 
        : undefined;

      // Get total count for the query
      const countResult = await this.auditRepo.count({ where: filters });
      const total = countResult.success ? (countResult.data || 0) : logs.length;

      return {
        data: dtoLogs,
        nextCursor,
        hasMore,
        total
      };
    } catch (error) {
      logger.error('Error querying audit logs:', undefined, error);
      throw error;
    }
  }

  /**
   * Get audit log statistics
   */
  async getAuditStats(query: Partial<AuditQuery>): Promise<{
    totalEvents: number;
    uniqueActors: number;
    topActions: Array<{ action: string; count: number }>;
    recentActivity: Array<{ hour: string; count: number }>;
  }> {
    try {
      const stats = await this.auditRepo.getStats({
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        actorId: query.actorId,
        resource: query.resource
      });

      if (!stats.success) {
        throw new Error(stats.error || 'Failed to get audit stats');
      }

      return stats.data;
    } catch (error) {
      logger.error('Error getting audit stats:', undefined, error);
      throw error;
    }
  }
}

// Service instance
const auditLogsService = new AuditLogsService();

/**
 * GET /api/v1/audit-logs
 * Query audit logs with filters and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Only admins can view audit logs
    const authResult = await UnifiedAuth(request, ['admin']);
    if (!authResult.success) return authResult.response;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      actorId: searchParams.get('actorId') || undefined,
      resource: searchParams.get('resource') || undefined,
      action: searchParams.get('action') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      cursor: searchParams.get('cursor') || undefined,
      limit: searchParams.get('limit') || '20'
    };

    // Validate query parameters
    const validatedQuery = AuditQuerySchema.parse(queryParams);

    // Query audit logs
    const result = await auditLogsService.queryAuditLogs(validatedQuery);

    // Add CORS headers for admin dashboard
    const headers = {
      'Cache-Control': 'no-store, max-age=0',
      'X-Total-Count': result.total.toString()
    };

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
        total: result.total,
        limit: validatedQuery.limit
      }
    }, { headers });

  } catch (error) {
    logger.error('Error fetching audit logs:', undefined, error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid query parameters',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/audit-logs/stats
 * Get audit log statistics
 */
export async function getStats(request: NextRequest) {
  try {
    // Only admins can view audit stats
    const authResult = await UnifiedAuth(request, ['admin']);
    if (!authResult.success) return authResult.response;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = {
      actorId: searchParams.get('actorId') || undefined,
      resource: searchParams.get('resource') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined
    };

    // Get statistics
    const stats = await auditLogsService.getAuditStats(query);

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error fetching audit stats:', undefined, error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit statistics' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/audit-logs/export
 * Export audit logs as CSV
 */
export async function exportLogs(request: NextRequest) {
  try {
    // Only admins can export audit logs
    const authResult = await UnifiedAuth(request, ['admin']);
    if (!authResult.success) return authResult.response;

    // Parse query parameters (same as GET but with higher limit)
    const { searchParams } = new URL(request.url);
    const queryParams = {
      actorId: searchParams.get('actorId') || undefined,
      resource: searchParams.get('resource') || undefined,
      action: searchParams.get('action') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: '1000' // Higher limit for export
    };

    const validatedQuery = AuditQuerySchema.parse(queryParams);

    // Query audit logs
    const result = await auditLogsService.queryAuditLogs(validatedQuery);

    // Convert to CSV
    const csvHeaders = ['ID', 'Timestamp', 'Actor ID', 'Actor Type', 'Action', 'Resource', 'Metadata'];
    const csvRows = result.data.map(log => [
      log.id,
      log.timestamp.toISOString(),
      log.actorId,
      log.actorType,
      log.action,
      log.resource,
      JSON.stringify(log.metadata || {})
    ]);

    // Build CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Return CSV response
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    logger.error('Error exporting audit logs:', undefined, error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to export audit logs' },
      { status: 500 }
    );
  }
}