/**
 * @fileoverview Adaptadores para Admin App - Capa de Adaptador
 * @description Convierte tipos complejos de packages a tipos simples para UI
 */

import {
  AdminAdapter,
  AdminStats,
  AuditLogEntry,
  ServiceHealth,
  SimpleUser,
  SystemAlert,
  SystemHealth,
  SystemMetrics,
} from '../types';

// Importar tipos complejos de packages (simulados para evitar errores de compilación)
type ComplexUserProfile = {
  id: string;
  personalInfo?: {
    fullName?: string;
    firstName?: string;
    lastName?: string;
  };
  contactInfo?: {
    primaryEmail?: string;
  };
  authorization?: {
    role?: string;
  };
  status?: 'active' | 'inactive' | 'suspended';
  metadata?: {
    lastActivity?: string;
    createdAt?: string;
  };
};

type ComplexSystemData = {
  services: {
    name: string;
    health: {
      status: 'up' | 'down' | 'degraded';
      responseTime?: number;
      uptime?: number;
      lastCheck: string;
    };
    port?: number;
  }[];
  metrics: {
    system: {
      cpu: { usage: number };
      memory: { usage: number };
      disk: { usage: number };
      network: { latency: number };
    };
    connections: { active: number };
  };
  alerts: {
    id: string;
    level: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
    resolved: boolean;
    source?: string;
  }[];
};

type ComplexAuditLog = {
  id: string;
  timestamp: string;
  actor: {
    userId: string;
    userName?: string;
    email?: string;
  };
  action: {
    type: string;
    resource: string;
    details: Record<string, unknown>;
  };
  context: {
    ipAddress: string;
    userAgent: string;
  };
  severity: 'info' | 'warning' | 'error';
};

interface AnalyticsData {
  users?: {
    total?: number;
    active?: number;
    new24h?: number;
  };
  appointments?: {
    total?: number;
    active?: number;
    completed?: number;
  };
  system?: {
    health?: 'up' | 'down' | 'degraded' | 'critical';
    errorRate?: number;
    responseTime?: number;
  };
}

// ==================== ADAPTADORES DE USUARIO ====================

export class UserAdapter implements AdminAdapter<ComplexUserProfile, SimpleUser> {
  toSimple(complex: ComplexUserProfile): SimpleUser {
    return {
      id: complex.id,
      name: this.buildFullName(complex),
      email: complex.contactInfo?.primaryEmail || 'No email',
      role: this.normalizeRole(complex.authorization?.role),
      status: complex.status || 'inactive',
      lastActivity: complex.metadata?.lastActivity || 'Never',
      createdAt: complex.metadata?.createdAt || 'Unknown',
    };
  }

  fromSimple(simple: SimpleUser): ComplexUserProfile {
    const [firstName, ...lastNameParts] = simple.name.split(' ');

    return {
      id: simple.id,
      personalInfo: {
        firstName: firstName || '',
        lastName: lastNameParts.join(' ') || '',
        fullName: simple.name,
      },
      contactInfo: {
        primaryEmail: simple.email,
      },
      authorization: {
        role: simple.role,
      },
      status: simple.status,
      metadata: {
        lastActivity: simple.lastActivity,
        createdAt: simple.createdAt,
      },
    };
  }

  validateSimple(simple: SimpleUser): boolean {
    return !!(
      simple.id &&
      simple.name &&
      simple.email &&
      simple.role &&
      ['active', 'inactive', 'suspended'].includes(simple.status)
    );
  }

  private buildFullName(complex: ComplexUserProfile): string {
    if (complex.personalInfo?.fullName) {
      return complex.personalInfo.fullName;
    }

    const firstName = complex.personalInfo?.firstName || '';
    const lastName = complex.personalInfo?.lastName || '';

    return `${firstName} ${lastName}`.trim() || 'Unnamed User';
  }

  private normalizeRole(role?: string): string {
    if (!role) return 'user';

    const roleMap: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin',
      ADMIN: 'Admin',
      DOCTOR: 'Doctor',
      PATIENT: 'Patient',
      COMPANY: 'Company',
      STAFF: 'Staff',
      super_admin: 'Super Admin',
      admin: 'Admin',
      doctor: 'Doctor',
      patient: 'Patient',
      company: 'Company',
      staff: 'Staff',
    };

    return roleMap[role] || role;
  }
}

// ==================== ADAPTADORES DE SISTEMA ====================

export class SystemAdapter implements AdminAdapter<ComplexSystemData, SystemHealth> {
  toSimple(complex: ComplexSystemData): SystemHealth {
    const services = complex.services.map((service) => this.convertService(service));
    const overallStatus = this.calculateOverallStatus(services);

    return {
      status: overallStatus,
      services,
      metrics: this.convertMetrics(complex.metrics),
      alerts: complex.alerts.map((alert) => this.convertAlert(alert)),
    };
  }

  fromSimple(simple: SystemHealth): ComplexSystemData {
    return {
      services: simple.services.map((service) => ({
        name: service.name,
        health: {
          status: service.status,
          responseTime: service.responseTime,
          uptime: service.uptime,
          lastCheck: service.lastCheck,
        },
        port: service.port,
      })),
      metrics: {
        system: {
          cpu: { usage: simple.metrics.cpuUsage },
          memory: { usage: simple.metrics.memoryUsage },
          disk: { usage: simple.metrics.diskUsage },
          network: { latency: simple.metrics.networkLatency },
        },
        connections: { active: simple.metrics.activeConnections },
      },
      alerts: simple.alerts.map((alert) => ({
        id: alert.id,
        level: alert.severity,
        message: alert.message,
        timestamp: alert.timestamp,
        resolved: alert.resolved,
        source: alert.service,
      })),
    };
  }

  validateSimple(simple: SystemHealth): boolean {
    return !!(
      simple.status &&
      Array.isArray(simple.services) &&
      simple.metrics &&
      Array.isArray(simple.alerts)
    );
  }

  private convertService(service: ComplexSystemData['services'][0]): ServiceHealth {
    return {
      name: service.name,
      status: service.health.status,
      port: service.port,
      responseTime: service.health.responseTime,
      lastCheck: service.health.lastCheck,
      uptime: service.health.uptime,
    };
  }

  private convertMetrics(metrics: ComplexSystemData['metrics']): SystemMetrics {
    return {
      cpuUsage: Math.round(metrics.system.cpu.usage),
      memoryUsage: Math.round(metrics.system.memory.usage),
      diskUsage: Math.round(metrics.system.disk.usage),
      networkLatency: Math.round(metrics.system.network.latency),
      activeConnections: metrics.connections.active,
    };
  }

  private convertAlert(alert: ComplexSystemData['alerts'][0]): SystemAlert {
    return {
      id: alert.id,
      severity: alert.level,
      message: alert.message,
      timestamp: alert.timestamp,
      resolved: alert.resolved,
      service: alert.source,
    };
  }

  private calculateOverallStatus(services: ServiceHealth[]): 'up' | 'down' | 'degraded' {
    if (services.length === 0) return 'down';

    const downServices = services.filter((s) => s.status === 'down').length;
    const degradedServices = services.filter((s) => s.status === 'degraded').length;

    if (downServices > services.length / 2) return 'down';
    if (degradedServices > 0 || downServices > 0) return 'degraded';
    return 'up';
  }
}

// ==================== ADAPTADORES DE AUDITORÍA ====================

export class AuditAdapter implements AdminAdapter<ComplexAuditLog, AuditLogEntry> {
  toSimple(complex: ComplexAuditLog): AuditLogEntry {
    return {
      id: complex.id,
      timestamp: complex.timestamp,
      userId: complex.actor.userId,
      userName: complex.actor.userName || complex.actor.email || 'Unknown User',
      action: complex.action.type,
      resource: complex.action.resource,
      details: this.formatDetails(complex.action.details),
      ipAddress: complex.context.ipAddress,
      userAgent: this.formatUserAgent(complex.context.userAgent),
      severity: complex.severity,
    };
  }

  fromSimple(simple: AuditLogEntry): ComplexAuditLog {
    return {
      id: simple.id,
      timestamp: simple.timestamp,
      actor: {
        userId: simple.userId,
        userName: simple.userName,
      },
      action: {
        type: simple.action,
        resource: simple.resource,
        details: { description: simple.details },
      },
      context: {
        ipAddress: simple.ipAddress,
        userAgent: simple.userAgent,
      },
      severity: simple.severity,
    };
  }

  validateSimple(simple: AuditLogEntry): boolean {
    return !!(
      simple.id &&
      simple.timestamp &&
      simple.userId &&
      simple.action &&
      simple.resource &&
      ['info', 'warning', 'error'].includes(simple.severity)
    );
  }

  private formatDetails(details: Record<string, unknown>): string {
    if (!details || typeof details !== 'object') {
      return 'No details available';
    }

    try {
      const formatted = Object.entries(details)
        .map(([key, value]) => {
          if (
            key === 'changes' &&
            Array.isArray(value) &&
            value.every(
              (item): item is { field: string; from: string; to: string } =>
                typeof item === 'object' &&
                item !== null &&
                'field' in item &&
                'from' in item &&
                'to' in item,
            )
          ) {
            return value
              .map((change) => `${change.field}: ${change.from} → ${change.to}`)
              .join(', ');
          }
          return `${key}: ${String(value)}`;
        })
        .join(' | ');

      return formatted || 'Action performed';
    } catch {
      return 'Details formatting error';
    }
  }

  private formatUserAgent(userAgent: string): string {
    if (!userAgent) return 'Unknown';

    // Simplificar user agent para mostrar solo lo esencial
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';

    return userAgent.substring(0, 50) + (userAgent.length > 50 ? '...' : '');
  }
}

// ==================== ADAPTADORES DE ESTADÍSTICAS ====================

export class StatsAdapter {
  static createDefaultStats(): AdminStats {
    return {
      totalUsers: 0,
      activeUsers: 0,
      newUsers24h: 0,
      totalAppointments: 0,
      activeAppointments: 0,
      completedAppointments: 0,
      systemHealth: 'critical',
      errorRate: 0,
      averageResponseTime: 0,
    };
  }

  private static mapHealthStatus(
    status?: 'up' | 'down' | 'degraded' | 'critical',
  ): 'healthy' | 'warning' | 'critical' {
    switch (status) {
      case 'up':
        return 'healthy';
      case 'degraded':
        return 'warning';
      case 'down':
        return 'critical';
      case 'critical':
        return 'critical';
      default:
        return 'critical';
    }
  }

  static fromAnalyticsData(data: AnalyticsData): AdminStats {
    const totalUsers = data?.users?.total ?? 0;
    const activeUsers = data?.users?.active ?? 0;
    const newUsers24h = data?.users?.new24h ?? 0;
    const totalAppointments = data?.appointments?.total ?? 0;
    const activeAppointments = data?.appointments?.active ?? 0;
    const completedAppointments = data?.appointments?.completed ?? 0;
    const systemHealth = this.mapHealthStatus(data?.system?.health);
    const errorRate = data?.system?.errorRate ?? 0;
    const averageResponseTime = data?.system?.responseTime ?? 0;

    return {
      totalUsers,
      activeUsers,
      newUsers24h,
      totalAppointments,
      activeAppointments,
      completedAppointments,
      systemHealth,
      errorRate,
      averageResponseTime,
    };
  }
}

// ==================== INSTANCIAS DE ADAPTADORES ====================

export const userAdapter = new UserAdapter();
export const systemAdapter = new SystemAdapter();
export const auditAdapter = new AuditAdapter();

// ==================== UTILIDADES DE ADAPTADOR ====================

export const AdapterUtils = {
  /**
   * Convierte una fecha ISO a formato legible
   */
  formatDate(isoDate: string): string {
    try {
      return new Date(isoDate).toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  },

  /**
   * Convierte bytes a formato legible
   */
  formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / 1024 ** i)} ${sizes[i]}`;
  },

  /**
   * Convierte milisegundos a formato legible
   */
  formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${Math.round(ms / 3600000)}h`;
  },

  /**
   * Sanitiza strings para prevenir XSS
   */
  sanitizeString(str: string): string {
    if (!str) return '';
    return str.replace(/[<>]/g, '').substring(0, 1000); // Limitar longitud
  },

  /**
   * Valida que un objeto tenga las propiedades requeridas
   */
  hasRequiredProperties<T extends object>(obj: unknown, props: (keyof T)[]): obj is T {
    if (!obj || typeof obj !== 'object') return false;
    return props.every((prop) => prop in obj);
  },
};
