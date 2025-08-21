import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { MediasoupTelemedicineServer } from './mediasoup-server';
import { logMedicalAction } from '@/lib/logger';

import { logger } from '@altamedica/shared/services/logger.service';
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3001', 10);

// Configuración de Mediasoup
const MEDIASOUP_CONFIG = {
  workers: parseInt(process.env.MEDIASOUP_WORKERS || '2'),
  listenIp: process.env.MEDIASOUP_LISTEN_IP || '127.0.0.1',
  announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || null,
  rtcMinPort: parseInt(process.env.MEDIASOUP_RTC_MIN_PORT || '10000'),
  rtcMaxPort: parseInt(process.env.MEDIASOUP_RTC_MAX_PORT || '10100'),
  logLevel: process.env.MEDIASOUP_LOG_LEVEL || 'warn'
};

export async function startTelemedicineServer() {
  try {
    logger.info('🚀 Iniciando servidor de telemedicina AltaMedica...');
    
    // Crear servidor HTTP
    const app = next({ dev, hostname, port });
    const handle = app.getRequestHandler();
    
    await app.prepare();
    
    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url!, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        logger.error('Error occurred handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    // Inicializar servidor Mediasoup
    const mediasoupServer = new MediasoupTelemedicineServer(server);
    
    // Log de inicio
    logMedicalAction({
      timestamp: new Date().toISOString(),
      userId: 'system',
      action: 'TELEMEDICINE_SERVER_STARTED',
      resource: '/telemedicine-server',
      ipAddress: 'localhost',
      userAgent: 'telemedicine-server',
      success: true,
      metadata: {
        port,
        hostname,
        mediasoupConfig: MEDIASOUP_CONFIG,
        environment: process.env.NODE_ENV
      }
    });

    // Iniciar servidor
    server.listen(port, () => {
      logger.info(`✅ Servidor de telemedicina iniciado en http://${hostname}:${port}`);
      logger.info(`🎥 MediaSoup configurado con ${MEDIASOUP_CONFIG.workers} workers`);
      logger.info(`🔒 Modo: ${dev ? 'Desarrollo' : 'Producción'}`);
      logger.info(`📊 Monitoreo: http://${hostname}:${port}/api/health`);
    });

    // Manejo de señales de terminación
    process.on('SIGTERM', () => {
      logger.info('🛑 Recibida señal SIGTERM, cerrando servidor...');
      server.close(() => {
        logger.info('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('🛑 Recibida señal SIGINT, cerrando servidor...');
      server.close(() => {
        logger.info('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
    });

    // Manejo de errores no capturados
    process.on('uncaughtException', (error) => {
      logger.error('❌ Error no capturado:', undefined, error);
      
      logMedicalAction({
        timestamp: new Date().toISOString(),
        userId: 'system',
        action: 'UNCAUGHT_EXCEPTION',
        resource: '/telemedicine-server',
        ipAddress: 'localhost',
        userAgent: 'telemedicine-server',
        success: false,
        metadata: {
          error: error.message,
          stack: error.stack
        }
      });
      
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('❌ Promesa rechazada no manejada:', reason);
      
      logMedicalAction({
        timestamp: new Date().toISOString(),
        userId: 'system',
        action: 'UNHANDLED_REJECTION',
        resource: '/telemedicine-server',
        ipAddress: 'localhost',
        userAgent: 'telemedicine-server',
        success: false,
        metadata: {
          reason: String(reason),
          promise: String(promise)
        }
      });
    });

    return { server, mediasoupServer };
    
  } catch (error) {
    logger.error('❌ Error iniciando servidor de telemedicina:', undefined, error);
    
    logMedicalAction({
      timestamp: new Date().toISOString(),
      userId: 'system',
      action: 'TELEMEDICINE_SERVER_START_ERROR',
      resource: '/telemedicine-server',
      ipAddress: 'localhost',
      userAgent: 'telemedicine-server',
      success: false,
      metadata: {
        error: error.message,
        stack: error.stack
      }
    });
    
    throw error;
  }
}

// Función para verificar el estado del servidor
export function getServerStatus() {
  return {
    status: 'running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV,
    port,
    hostname
  };
}

// Función para obtener estadísticas de telemedicina
export function getTelemedicineStats(mediasoupServer: MediasoupTelemedicineServer) {
  return {
    activeSessions: mediasoupServer.getActiveSessionsCount(),
    timestamp: new Date().toISOString(),
    mediasoupConfig: MEDIASOUP_CONFIG
  };
}

// Exportar configuración
export { MEDIASOUP_CONFIG }; 