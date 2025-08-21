#!/usr/bin/env node

// Script para iniciar el servidor de señalización WebRTC
import { SignalingServer } from '../src/server/signalingServer.ts';

import { logger } from '@altamedica/shared/services/logger.service';
const port = parseInt(process.env.SIGNALING_PORT || '3001');

logger.info('🚀 Iniciando servidor de señalización WebRTC...');
logger.info(`📍 Puerto: ${port}`);
logger.info(`🔗 URL: ws://localhost:${port}`);

const server = new SignalingServer(port);

// Manejo de señales para cierre limpio
process.on('SIGINT', () => {
  logger.info('\n🛑 Cerrando servidor de señalización...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('\n🛑 Cerrando servidor de señalización...');
  process.exit(0);
});

logger.info('✅ Servidor de señalización iniciado correctamente');
logger.info('📊 Para ver estadísticas, visita: http://localhost:3001/stats'); 