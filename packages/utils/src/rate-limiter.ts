'use server';
import Redis from 'ioredis';

let redis: Redis;

// Initialize the Redis client.
// It will automatically use the REDIS_URL environment variable if available.
// Falls back to a default local instance for development.
if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL);
} else {
  console.warn('REDIS_URL environment variable not found. Falling back to localhost:6379.');
  redis = new Redis(); // Default connection to 127.0.0.1:6379
}

redis.on('error', (err) => {
  console.error('Could not connect to Redis:', err);
});

redis.on('connect', () => {
  console.log('Successfully connected to Redis.');
});

export interface RateLimitResult {
  isAllowed: boolean;
  remaining: number;
  limit: number;
}

/**
 * A robust rate limiter using Redis with a fixed window algorithm.
 * This function is atomic, ensuring that race conditions are handled correctly.
 *
 * @param identifier A unique identifier for the client (e.g., an IP address).
 * @param limit The maximum number of requests allowed in the window.
 * @param windowInSeconds The time window in seconds.
 * @returns A promise that resolves to a RateLimitResult object.
 */
export async function rateLimiter(
  identifier: string,
  limit: number,
  windowInSeconds: number
): Promise<RateLimitResult> {
  try {
    const key = `rate-limit:${identifier}`;

    // Use a Redis transaction (multi) to ensure atomicity.
    const pipeline = redis.multi();
    pipeline.incr(key);
    pipeline.expire(key, windowInSeconds, 'NX'); // Set expiry only if the key is new

    const results = await pipeline.exec();

    // The result of INCR is at index 0
    const currentCount = results?.[0]?.[1] as number | null;

    if (currentCount === null) {
      // This would happen if the transaction failed.
      // We'll fail open to not block legitimate traffic.
      console.error('Redis transaction for rate limiting failed.');
      return { isAllowed: true, remaining: limit, limit };
    }

    const isAllowed = currentCount <= limit;
    const remaining = Math.max(0, limit - currentCount);

    return { isAllowed, remaining, limit };

  } catch (error) {
    console.error('Error during rate limiting check:', error);
    // Fail open: If Redis is down, we don't want to block all users.
    return { isAllowed: true, remaining: limit, limit };
  }
}
