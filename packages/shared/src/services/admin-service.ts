/**
import { logger } from './logger.service';

 * 🔐 ADMIN SERVICE - ALTAMEDICA
 * Servicio administrativo centralizado para gestión del sistema
 * Usado por: Admin Apps, API Server
 */

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  pendingApprovals: number;
  criticalAlerts: number;
  systemUptime: number;
  totalRevenue: number;
  monthlyGrowth: number;
  securityIncidents: number;
  totalDoctors: number;
  totalPatients: number;
  totalCompanies: number;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'DOCTOR' | 'PATIENT' | 'COMPANY' | 'MODERATOR';
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'INACTIVE';
  createdAt: string;
  lastLogin: string;
  isVerified: boolean;
  profilePicture?: string;
  metadata?: Record<string, any>;
}

export interface SystemHealth {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';
  uptime: number;
  responseTime: number;
  issues: Array<{
    id: string;
    type: 'ERROR' | 'WARNING' | 'INFO';
    message: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    timestamp: string;
    resolved: boolean;
  }>;
  lastCheck: string;
}

export interface AuditLog {
  id: string;
  type: 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED' | 'USER_ROLE_UPDATED' | 'USER_SUSPENDED' | 'USER_ACTIVATED' | 'SYSTEM_CONFIG_CHANGED' | 'SECURITY_INCIDENT' | 'DATA_EXPORT' | 'LOGIN_ATTEMPT';
  userId: string;
  targetUserId?: string;
  description: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface AuditEvent {
  type: string;
  userId: string;
  targetUserId?: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface SecurityAlert {
  id: string;
  type: 'LOGIN_ATTEMPT' | 'SUSPICIOUS_ACTIVITY' | 'DATA_BREACH' | 'SYSTEM_COMPROMISE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  timestamp: string;
  resolved: boolean;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  responseTime: number[];
  errorRate: number[];
  throughput: number[];
  timestamps: string[];
}

export interface SystemBackup {
  backupId: string;
  size: number;
  createdAt: string;
  downloadUrl: string;
}

/**
 * Servicio Administrativo Centralizado
 */
export class AdminService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    this.loadToken();
  }

  private loadToken() {
    if (typeof window !== 'undefined') {
      // Intentar obtener token de localStorage
      this.token = localStorage.getItem('auth_token');
      
      // Fallback para Firebase Auth token
      if (!this.token) {
        try {
          const firebaseUser = JSON.parse(
            localStorage.getItem('firebase:authUser:demo-api-key:[DEFAULT]') || '{}'
          );
          if (firebaseUser.stsTokenManager?.accessToken) {
            this.token = firebaseUser.stsTokenManager.accessToken;
          }
        } catch (error) {
          logger.warn('No se pudo obtener token de Firebase:', error);
        }
      }
    }
  }

  private getAuthHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Obtener estadísticas del sistema
   */
  async getStats(): Promise<AdminStats> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/admin/stats`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      const result = await this.handleResponse<{
        success: boolean;
        data: AdminStats;
      }>(response);

      return result.data;
    } catch (error) {
      logger.error('Error obteniendo estadísticas administrativas:', error);
      throw new Error('No se pudieron obtener las estadísticas del sistema');
    }
  }

  /**
   * Obtener usuarios recientes
   */
  async getRecentUsers(limit: number = 50): Promise<AdminUser[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/admin/users?limit=${limit}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      const result = await this.handleResponse<{
        success: boolean;
        data: AdminUser[];
      }>(response);

      return result.data;
    } catch (error) {
      logger.error('Error obteniendo usuarios:', error);
      throw new Error('No se pudieron obtener los usuarios');
    }
  }

  /**
   * Obtener salud del sistema
   */
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/admin/system/health`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      const result = await this.handleResponse<{
        success: boolean;
        data: SystemHealth;
      }>(response);

      return result.data;
    } catch (error) {
      logger.error('Error obteniendo salud del sistema:', error);
      throw new Error('No se pudo obtener la salud del sistema');
    }
  }

  /**
   * Obtener logs de auditoría
   */
  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/admin/audit/logs?limit=${limit}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      const result = await this.handleResponse<{
        success: boolean;
        data: AuditLog[];
      }>(response);

      return result.data;
    } catch (error) {
      logger.error('Error obteniendo logs de auditoría:', error);
      throw new Error('No se pudieron obtener los logs de auditoría');
    }
  }

  /**
   * Actualizar rol de usuario
   */
  async updateUserRole(userId: string, role: string): Promise<AdminUser> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/admin/users/${userId}/role`,
        {
          method: 'PATCH',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ role }),
        }
      );

      const result = await this.handleResponse<{
        success: boolean;
        data: AdminUser;
      }>(response);

      return result.data;
    } catch (error) {
      logger.error('Error actualizando rol de usuario:', error);
      throw new Error('No se pudo actualizar el rol del usuario');
    }
  }

  /**
   * Suspender usuario
   */
  async suspendUser(userId: string, reason: string): Promise<AdminUser> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/admin/users/${userId}/suspend`,
        {
          method: 'PATCH',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ reason }),
        }
      );

      const result = await this.handleResponse<{
        success: boolean;
        data: AdminUser;
      }>(response);

      return result.data;
    } catch (error) {
      logger.error('Error suspendiendo usuario:', error);
      throw new Error('No se pudo suspender el usuario');
    }
  }

  /**
   * Activar usuario
   */
  async activateUser(userId: string): Promise<AdminUser> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/admin/users/${userId}/activate`,
        {
          method: 'PATCH',
          headers: this.getAuthHeaders(),
        }
      );

      const result = await this.handleResponse<{
        success: boolean;
        data: AdminUser;
      }>(response);

      return result.data;
    } catch (error) {
      logger.error('Error activando usuario:', error);
      throw new Error('No se pudo activar el usuario');
    }
  }

  /**
   * Registrar evento de auditoría
   */
  async logAuditEvent(event: AuditEvent): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/admin/audit/events`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(event),
        }
      );

      await this.handleResponse(response);
    } catch (error) {
      logger.error('Error registrando evento de auditoría:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  /**
   * Exportar reporte
   */
  async exportReport(type: string, dateRange: string): Promise<Blob> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/admin/reports/export?type=${type}&dateRange=${dateRange}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      logger.error('Error exportando reporte:', error);
      throw new Error('No se pudo exportar el reporte');
    }
  }

  /**
   * Obtener configuración del sistema
   */
  async getSystemConfig(): Promise<Record<string, any>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/admin/system/config`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      const result = await this.handleResponse<{
        success: boolean;
        data: Record<string, any>;
      }>(response);

      return result.data;
    } catch (error) {
      logger.error('Error obteniendo configuración del sistema:', error);
      throw new Error('No se pudo obtener la configuración del sistema');
    }
  }

  /**
   * Actualizar configuración del sistema
   */
  async updateSystemConfig(config: Record<string, any>): Promise<Record<string, any>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/admin/system/config`,
        {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(config),
        }
      );

      const result = await this.handleResponse<{
        success: boolean;
        data: Record<string, any>;
      }>(response);

      return result.data;
    } catch (error) {
      logger.error('Error actualizando configuración del sistema:', error);
      throw new Error('No se pudo actualizar la configuración del sistema');
    }
  }

  /**
   * Obtener métricas de rendimiento
   */
  async getPerformanceMetrics(period: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<PerformanceMetrics> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/admin/system/performance?period=${period}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      const result = await this.handleResponse<{
        success: boolean;
        data: PerformanceMetrics;
      }>(response);

      return result.data;
    } catch (error) {
      logger.error('Error obteniendo métricas de rendimiento:', error);
      throw new Error('No se pudieron obtener las métricas de rendimiento');
    }
  }

  /**
   * Obtener alertas de seguridad
   */
  async getSecurityAlerts(): Promise<SecurityAlert[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/admin/security/alerts`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      const result = await this.handleResponse<{
        success: boolean;
        data: SecurityAlert[];
      }>(response);

      return result.data;
    } catch (error) {
      logger.error('Error obteniendo alertas de seguridad:', error);
      throw new Error('No se pudieron obtener las alertas de seguridad');
    }
  }

  /**
   * Resolver alerta de seguridad
   */
  async resolveSecurityAlert(alertId: string, resolution: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/admin/security/alerts/${alertId}/resolve`,
        {
          method: 'PATCH',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ resolution }),
        }
      );

      await this.handleResponse(response);
    } catch (error) {
      logger.error('Error resolviendo alerta de seguridad:', error);
      throw new Error('No se pudo resolver la alerta de seguridad');
    }
  }

  /**
   * Crear backup del sistema
   */
  async createSystemBackup(): Promise<SystemBackup> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/admin/system/backup`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
        }
      );

      const result = await this.handleResponse<{
        success: boolean;
        data: SystemBackup;
      }>(response);

      return result.data;
    } catch (error) {
      logger.error('Error creando backup del sistema:', error);
      throw new Error('No se pudo crear el backup del sistema');
    }
  }

  /**
   * Restaurar sistema desde backup
   */
  async restoreSystemFromBackup(backupId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/admin/system/restore/${backupId}`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
        }
      );

      await this.handleResponse(response);
    } catch (error) {
      logger.error('Error restaurando sistema:', error);
      throw new Error('No se pudo restaurar el sistema');
    }
  }

  /**
   * Actualizar token de autenticación
   */
  updateToken(token: string | null): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }
}

// Singleton para uso global
let adminServiceInstance: AdminService | null = null;

export const getAdminService = (): AdminService => {
  if (!adminServiceInstance) {
    adminServiceInstance = new AdminService();
  }
  return adminServiceInstance;
};

// Export por defecto
export default getAdminService();