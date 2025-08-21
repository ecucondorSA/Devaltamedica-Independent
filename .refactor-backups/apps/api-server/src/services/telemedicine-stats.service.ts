/**
 * 📊 TELEMEDICINE STATS SERVICE - ALTAMEDICA
 * Servicio para la gestión de estadísticas y métricas de telemedicina.
 */
import { adminDb } from '@/lib/firebase-admin';
import { z } from 'zod';
import { ServiceContext } from '@/lib/patterns/ServicePattern';

// Esquema para registrar métricas de una sesión
export const RecordMetricsSchema = z.object({
  sessionId: z.string(),
  metrics: z.object({
    fps: z.number().optional(),
    latency: z.number().optional(),
    packetLoss: z.number().optional(),
    bandwidth: z.number().optional(),
    cpuUsage: z.number().optional(),
    memoryUsage: z.number().optional(),
    connectionQuality: z.enum(['excellent', 'good', 'poor', 'unknown']).optional(),
  }),
});

class TelemedicineStatsService {
  private sessionsCollection = 'telemedicine_sessions';
  private metricsCollection = 'telemedicine_metrics';

  /**
   * Obtiene un dashboard de estadísticas generales de telemedicina.
   */
  async getDashboardStats(context: ServiceContext): Promise<any> {
    // Solo roles administrativos pueden ver estadísticas generales.
    if (context.userRole !== 'admin' && context.userRole !== 'doctor') {
      throw new Error('FORBIDDEN');
    }

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const yesterday = new Date(new Date().setDate(now.getDate() - 1));

    // Usar Promise.all para ejecutar consultas en paralelo
    const [
      activeSessionsPromise,
      totalTodayPromise,
      completedLast24hPromise,
      sessionsByTypePromise,
    ] = [
      adminDb.collection(this.sessionsCollection).where('status', '==', 'in-progress').get(),
      adminDb.collection(this.sessionsCollection).where('createdAt', '>=', todayStart).get(),
      adminDb.collection(this.sessionsCollection).where('status', '==', 'completed').where('endTime', '>=', yesterday).get(),
      adminDb.collection(this.sessionsCollection).where('createdAt', '>=', yesterday).get(),
    ];

    const [
        activeSessionsSnapshot,
        totalTodaySnapshot,
        completedSessions,
        sessionsByTypeSnapshot,
    ] = await Promise.all([
        activeSessionsPromise,
        totalTodayPromise,
        completedLast24hPromise,
        sessionsByTypePromise,
    ]);

    // Calcular duración promedio
    const totalDuration = completedSessions.docs.reduce((acc, doc) => acc + (doc.data().durationMinutes || 0), 0);
    const averageDuration = completedSessions.size > 0 ? totalDuration / completedSessions.size : 0;

    // Calcular sesiones por tipo
    const sessionsByType = sessionsByTypeSnapshot.docs.reduce((acc, doc) => {
        const type = doc.data().type || 'consultation'; // 'type' debería venir de la cita asociada
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Simulación de otras métricas
    const participantsOnline = activeSessionsSnapshot.size * 2;
    const connectionQuality = { excellent: 85, good: 12, poor: 3 };
    const systemHealth = { status: 'healthy', cpu: 45, memory: 60, network: 15 };

    return {
      activeSessions: activeSessionsSnapshot.size,
      totalSessionsToday: totalTodaySnapshot.size,
      averageDuration: Math.round(averageDuration),
      participantsOnline,
      connectionQuality,
      sessionsByType,
      systemHealth,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Registra las métricas de una sesión de telemedicina específica.
   */
  async recordSessionMetrics(data: z.infer<typeof RecordMetricsSchema>, context: ServiceContext): Promise<string> {
    const { sessionId, metrics } = data;

    // Validar que el usuario que reporta las métricas está en la sesión
    const sessionDoc = await adminDb.collection(this.sessionsCollection).doc(sessionId).get();
    if (!sessionDoc.exists) {
        throw new Error('NOT_FOUND');
    }
    const sessionData = sessionDoc.data()!;
    if (sessionData.patientId !== context.userId && sessionData.doctorId !== context.userId) {
        throw new Error('FORBIDDEN');
    }

    const metricsPayload = {
      ...metrics,
      sessionId,
      userId: context.userId,
      recordedAt: new Date(),
    };

    const docRef = await adminDb.collection(this.metricsCollection).add(metricsPayload);
    return docRef.id;
  }
}

export const telemedicineStatsService = new TelemedicineStatsService();
