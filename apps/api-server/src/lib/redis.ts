/**
 * 💾 Redis Client with Retry Strategy
 * P1 Stability: Automatic reconnection and health checks
 */

import Redis from 'ioredis';

import { logger } from '@altamedica/shared';
// P1 Stability: Retry strategy configuration
const RETRY_CONFIG = {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy: (times: number) => {
    // Exponential backoff with max delay of 30 seconds
    const delay = Math.min(times * 1000, 30000);
    logger.info(`⏳ [Redis] Retry attempt ${times}, waiting ${delay}ms...`);
    return delay;
  },
  reconnectOnError: (err: Error) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Only reconnect when the error contains "READONLY"
      logger.warn('[Redis] Reconnecting due to READONLY error');
      return true;
    }
    return false;
  }
};

// Create Redis client with retry strategy
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  ...RETRY_CONFIG,
  lazyConnect: false, // Connect immediately
  maxRetriesPerRequest: 3,
  showFriendlyErrorStack: process.env.NODE_ENV !== 'production',

  // Connection options
  connectTimeout: 10000, // 10 seconds
  commandTimeout: 5000,  // 5 seconds
  keepAlive: 30000,      // 30 seconds

  // Security
  password: process.env.REDIS_PASSWORD,

  // Performance
  enableOfflineQueue: true,
  enableAutoPipelining: true,
});

// Connection event handlers
redis.on('connect', () => {
  logger.info('✅ [Redis] Connected successfully');
});

redis.on('ready', () => {
  logger.info('✅ [Redis] Ready to accept commands');
});

redis.on('error', (error) => {
  logger.error('❌ [Redis] Connection error:', error.message);
  // Don't exit - allow app to run without cache
});

redis.on('close', () => {
  logger.warn('⚠️ [Redis] Connection closed');
});

redis.on('reconnecting', (delay: number) => {
  logger.info(`🔄 [Redis] Reconnecting in ${delay}ms...`);
});

redis.on('end', () => {
  logger.info('🛑 [Redis] Connection ended');
});

/**
 * Health check for Redis
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch (error) {
    logger.error('[Redis] Health check failed:', undefined, error);
    return false;
  }
}

/**
 * Cache helper functions
 */
export const cache = {
  /**
   * Get cached value with JSON parsing
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`[Redis] Error getting key ${key}:`, undefined, error);
      return null;
    }
  },

  /**
   * Set cached value with TTL
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    try {
      const stringValue = JSON.stringify(value);
      if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, stringValue);
      } else {
        await redis.set(key, stringValue);
      }
      return true;
    } catch (error) {
      logger.error(`[Redis] Error setting key ${key}:`, undefined, error);
      return false;
    }
  },

  /**
   * Delete cached value
   */
  async del(key: string): Promise<boolean> {
    try {
      const result = await redis.del(key);
      return result === 1;
    } catch (error) {
      logger.error(`[Redis] Error deleting key ${key}:`, undefined, error);
      return false;
    }
  },

  /**
   * Clear all cache (use with caution)
   */
  async flush(): Promise<boolean> {
    try {
      await redis.flushdb();
      logger.warn('[Redis] Cache flushed');
      return true;
    } catch (error) {
      logger.error('[Redis] Error flushing cache:', undefined, error);
      return false;
    }
  },

  /**
   * Get cache info
   */
  async info(): Promise<string | null> {
    try {
      return await redis.info();
    } catch (error) {
      logger.error('[Redis] Error getting info:', undefined, error);
      return null;
    }
  }
};

/**
 * Session store helper
 */
export const sessionStore = {
  async get(sessionId: string): Promise<any> {
    return cache.get(`session:${sessionId}`);
  },

  async set(sessionId: string, data: any, ttlSeconds: number = 3600): Promise<boolean> {
    return cache.set(`session:${sessionId}`, data, ttlSeconds);
  },

  async destroy(sessionId: string): Promise<boolean> {
    return cache.del(`session:${sessionId}`);
  },

  async touch(sessionId: string, ttlSeconds: number = 3600): Promise<boolean> {
    try {
      await redis.expire(`session:${sessionId}`, ttlSeconds);
      return true;
    } catch (error) {
      logger.error(`[Redis] Error touching session ${sessionId}:`, undefined, error);
      return false;
    }
  }
};

/**
 * Rate limiting helper
 */
export const rateLimiter = {
  async checkLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    try {
      const current = await redis.incr(key);

      if (current === 1) {
        // First request in window
        await redis.expire(key, windowSeconds);
      }

      return current <= limit;
    } catch (error) {
      logger.error(`[Redis] Rate limiter error for ${key}:`, undefined, error);
      // Allow request on error (fail open)
      return true;
    }
  },

  async getRemainingLimit(key: string, limit: number): Promise<number> {
    try {
      const current = await redis.get(key);
      const used = current ? parseInt(current, 10) : 0;
      return Math.max(0, limit - used);
    } catch (error) {
      logger.error(`[Redis] Error getting remaining limit for ${key}:`, undefined, error);
      return limit;
    }
  },

  async getTTL(key: string): Promise<number> {
    try {
      return await redis.ttl(key);
    } catch (error) {
      logger.error(`[Redis] Error getting TTL for ${key}:`, undefined, error);
      return -1;
    }
  }
};

// Graceful shutdown
process.on('beforeExit', async () => {
  logger.info('🔄 [Redis] Closing connection...');
  await redis.quit();
});

// Handle termination signals
['SIGTERM', 'SIGINT'].forEach(signal => {
  process.on(signal, async () => {
    logger.info(`🛑 [Redis] Received ${signal}, closing connection...`);
    await redis.quit();
  });
});

export default redis;