/**
 * 🗄️ Prisma Client with Connection Pool
 * P1 Stability: Configured connection pool for production
 */

import { PrismaClient } from '@prisma/client';

import { logger } from '@altamedica/shared/services/logger.service';
// Declaración global para desarrollo en TypeScript
declare global {
  var prisma: PrismaClient | undefined;
}

// Evitar múltiples instancias en desarrollo
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// P1 Stability: Configure connection pool
const connectionUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/altamedica?schema=public';

// Add connection pool parameters to URL if not present
const pooledUrl = connectionUrl.includes('?')
  ? `${connectionUrl}&connection_limit=10&pool_timeout=30`
  : `${connectionUrl}?connection_limit=10&pool_timeout=30`;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'production' 
    ? ['error', 'warn'] 
    : ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: pooledUrl
    }
  },
  // Connection pool configuration
  // Note: These are applied via URL parameters above for PostgreSQL
  errorFormat: 'pretty'
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Connection management with retry logic
let connectionAttempts = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

async function connectWithRetry(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('✅ [Prisma] Database connected successfully');
    connectionAttempts = 0; // Reset on success
  } catch (error) {
    connectionAttempts++;
    logger.error(`❌ [Prisma] Connection attempt ${connectionAttempts} failed:`, undefined, error);
    
    if (connectionAttempts < MAX_RETRIES) {
      logger.info(`⏳ [Prisma] Retrying in ${RETRY_DELAY / 1000} seconds...`);
      setTimeout(connectWithRetry, RETRY_DELAY);
    } else {
      logger.error('🚨 [Prisma] Max connection retries reached. Database unavailable.');
      // Don't exit process - allow app to run with degraded functionality
    }
  }
}

// Initial connection
connectWithRetry();

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('[Prisma] Health check failed:', undefined, error);
    return false;
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  logger.info('🔄 [Prisma] Disconnecting from database...');
  await prisma.$disconnect();
});

// Handle termination signals
['SIGTERM', 'SIGINT'].forEach(signal => {
  process.on(signal, async () => {
    logger.info(`🛑 [Prisma] Received ${signal}, closing database connection...`);
    await prisma.$disconnect();
    process.exit(0);
  });
});

export default prisma;
