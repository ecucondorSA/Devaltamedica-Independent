import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '@altamedica/shared/services/logger.service';

const router = Router();

// 📊 SCHEMAS DE VALIDACIÓN
const AuditEventSchema = z.object({
  userId: z.string().min(1),
  userRole: z.string().min(1),
  action: z.string().min(1),
  resource: z.string().min(1),
  resourceId: z.string().optional(),
  details: z.record(z.any()).default({}),
  ipAddress: z.string().default('unknown'),
  userAgent: z.string().default('unknown'),
  sessionId: z.string().min(1),
  success: z.boolean().default(true),
  errorMessage: z.string().optional(),
});

const AuditFilterSchema = z.object({
  userId: z.string().optional(),
  userRole: z.string().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().min(1).max(1000).default(50),
  offset: z.number().min(0).default(0),
});

// 📋 ALMACENAMIENTO TEMPORAL (EN PRODUCCIÓN: Firebase/PostgreSQL)
interface AuditEvent {
  id: string;
  userId: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  sessionId: string;
  success: boolean;
  errorMessage?: string;
}

// Simulación de base de datos en memoria
const auditEvents: AuditEvent[] = [];

// POST /api/v1/audit/events - Registrar evento de auditoría
router.post('/events', async (req: Request, res: Response) => {
  try {
    const validation = AuditEventSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Datos de auditoría inválidos',
        details: validation.error.errors
      });
    }

    const eventData = validation.data;
    
    // Crear evento de auditoría
    const auditEvent: AuditEvent = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...eventData,
      timestamp: new Date().toISOString(),
      ipAddress: req.ip || eventData.ipAddress,
      userAgent: req.headers['user-agent'] || eventData.userAgent,
    };

    // Guardar en "base de datos" temporal
    auditEvents.push(auditEvent);

    // Log crítico para HIPAA
    logger.info('AUDIT_EVENT_LOGGED', {
      auditId: auditEvent.id,
      userId: auditEvent.userId,
      action: auditEvent.action,
      resource: auditEvent.resource,
      timestamp: auditEvent.timestamp
    });

    // En producción: también enviar a sistema de compliance externo
    // await complianceService.logEvent(auditEvent);

    return res.status(201).json({
      success: true,
      data: {
        id: auditEvent.id,
        timestamp: auditEvent.timestamp,
        logged: true
      }
    });

  } catch (error) {
    logger.error('Error logging audit event:', undefined, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to log audit event'
    });
  }
});

// GET /api/v1/audit/events - Obtener trail de auditoría
router.get('/events', async (req: Request, res: Response) => {
  try {
    const validation = AuditFilterSchema.safeParse(req.query);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Filtros inválidos',
        details: validation.error.errors
      });
    }

    const filters = validation.data;

    // Filtrar eventos
    let filteredEvents = auditEvents;

    if (filters.userId) {
      filteredEvents = filteredEvents.filter(e => e.userId === filters.userId);
    }

    if (filters.userRole) {
      filteredEvents = filteredEvents.filter(e => e.userRole === filters.userRole);
    }

    if (filters.action) {
      filteredEvents = filteredEvents.filter(e => e.action === filters.action);
    }

    if (filters.resource) {
      filteredEvents = filteredEvents.filter(e => e.resource === filters.resource);
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filteredEvents = filteredEvents.filter(e => new Date(e.timestamp) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filteredEvents = filteredEvents.filter(e => new Date(e.timestamp) <= endDate);
    }

    // Ordenar por timestamp descendente (más recientes primero)
    filteredEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Paginación
    const total = filteredEvents.length;
    const paginatedEvents = filteredEvents.slice(filters.offset, filters.offset + filters.limit);

    return res.json({
      success: true,
      data: {
        events: paginatedEvents,
        total,
        offset: filters.offset,
        limit: filters.limit,
        hasMore: filters.offset + filters.limit < total
      }
    });

  } catch (error) {
    logger.error('Error getting audit events:', undefined, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get audit events'
    });
  }
});

// GET /api/v1/audit/users/:userId/activity - Actividad específica de usuario
router.get('/users/:userId/activity', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId es requerido'
      });
    }

    // Filtrar por usuario y fecha
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const userEvents = auditEvents.filter(event => 
      event.userId === userId && 
      new Date(event.timestamp) >= cutoffDate
    );

    // Análisis de actividad
    const totalEvents = userEvents.length;
    const actionsBreakdown = userEvents.reduce((acc, event) => {
      acc[event.action] = (acc[event.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentActivity = userEvents
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    return res.json({
      success: true,
      data: {
        totalEvents,
        actionsBreakdown,
        recentActivity,
        periodDays: days,
        userId
      }
    });

  } catch (error) {
    logger.error('Error getting user activity:', undefined, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get user activity'
    });
  }
});

// GET /api/v1/audit/compliance/report - Reporte de compliance
router.get('/compliance/report', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate y endDate son requeridos'
      });
    }

    // Filtrar eventos en el rango de fechas
    const start = new Date(startDate);
    const end = new Date(endDate);

    const periodEvents = auditEvents.filter(event => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= start && eventDate <= end;
    });

    // Análisis de compliance
    const metrics = {
      totalAccesses: periodEvents.length,
      unauthorizedAttempts: periodEvents.filter(e => !e.success).length,
      dataExports: periodEvents.filter(e => e.action.includes('export')).length,
      sensitiveOperations: periodEvents.filter(e => 
        ['delete', 'modify', 'access_sensitive'].includes(e.action)
      ).length,
      uniqueUsers: new Set(periodEvents.map(e => e.userId)).size,
      resourcesAccessed: new Set(periodEvents.map(e => e.resource)).size,
    };

    // Riesgos detectados
    const risks = [];
    
    if (metrics.unauthorizedAttempts > 0) {
      risks.push({
        type: 'unauthorized_access',
        level: 'high',
        count: metrics.unauthorizedAttempts,
        description: 'Intentos de acceso no autorizado detectados'
      });
    }

    if (metrics.dataExports > 50) {
      risks.push({
        type: 'excessive_exports',
        level: 'medium',
        count: metrics.dataExports,
        description: 'Alto número de exportaciones de datos'
      });
    }

    return res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        metrics,
        risks,
        events: periodEvents.slice(0, 100), // Últimos 100 eventos
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error generating compliance report:', undefined, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate compliance report'
    });
  }
});

// DELETE /api/v1/audit/events/:eventId - Eliminar evento (solo admin)
router.delete('/events/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    // En producción: verificar permisos de admin aquí
    // const authResult = await UnifiedAuth(req, ['ADMIN']);

    const eventIndex = auditEvents.findIndex(e => e.id === eventId);

    if (eventIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Evento de auditoría no encontrado'
      });
    }

    // Registrar eliminación antes de eliminar
    logger.warn('AUDIT_EVENT_DELETION', {
      deletedEventId: eventId,
      deletedBy: 'system', // En producción: req.user.uid
      timestamp: new Date().toISOString()
    });

    // Eliminar evento
    auditEvents.splice(eventIndex, 1);

    return res.json({
      success: true,
      message: 'Evento de auditoría eliminado'
    });

  } catch (error) {
    logger.error('Error deleting audit event:', undefined, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete audit event'
    });
  }
});

// GET /api/v1/audit/stats - Estadísticas generales
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const last24h = new Date();
    last24h.setHours(last24h.getHours() - 24);

    const last7d = new Date();
    last7d.setDate(last7d.getDate() - 7);

    const eventsLast24h = auditEvents.filter(e => new Date(e.timestamp) >= last24h);
    const eventsLast7d = auditEvents.filter(e => new Date(e.timestamp) >= last7d);

    const stats = {
      total: auditEvents.length,
      last24h: eventsLast24h.length,
      last7d: eventsLast7d.length,
      uniqueUsers: new Set(auditEvents.map(e => e.userId)).size,
      topActions: Object.entries(
        auditEvents.reduce((acc, e) => {
          acc[e.action] = (acc[e.action] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).sort(([,a], [,b]) => b - a).slice(0, 10),
      topResources: Object.entries(
        auditEvents.reduce((acc, e) => {
          acc[e.resource] = (acc[e.resource] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).sort(([,a], [,b]) => b - a).slice(0, 10)
    };

    return res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error getting audit stats:', undefined, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get audit stats'
    });
  }
});

export default router;