/**
 * Rate Limiter for Authentication
 * Prevents brute force attacks by limiting login attempts
 */

interface RateLimitEntry {
  attempts: number;
  lastAttempt: number;
  blockedUntil?: number;
}

interface LimitCheckResult {
  allowed: boolean;
  blockedSeconds: number;
  remainingAttempts: number;
}

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const RESET_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();

  checkLimit(identifier: string): LimitCheckResult {
    const now = Date.now();
    const entry = this.limits.get(identifier);

    if (!entry) {
      return {
        allowed: true,
        blockedSeconds: 0,
        remainingAttempts: MAX_ATTEMPTS
      };
    }

    // Check if blocked
    if (entry.blockedUntil && entry.blockedUntil > now) {
      return {
        allowed: false,
        blockedSeconds: Math.ceil((entry.blockedUntil - now) / 1000),
        remainingAttempts: 0
      };
    }

    // Reset if enough time has passed
    if (entry.lastAttempt + RESET_DURATION < now) {
      this.limits.delete(identifier);
      return {
        allowed: true,
        blockedSeconds: 0,
        remainingAttempts: MAX_ATTEMPTS
      };
    }

    // Check attempts
    const remainingAttempts = MAX_ATTEMPTS - entry.attempts;
    return {
      allowed: remainingAttempts > 0,
      blockedSeconds: 0,
      remainingAttempts: Math.max(0, remainingAttempts)
    };
  }

  recordAttempt(identifier: string, success: boolean = false): void {
    const now = Date.now();
    
    if (success) {
      this.limits.delete(identifier);
      return;
    }

    const entry = this.limits.get(identifier) || {
      attempts: 0,
      lastAttempt: now
    };

    entry.attempts++;
    entry.lastAttempt = now;

    if (entry.attempts >= MAX_ATTEMPTS) {
      entry.blockedUntil = now + BLOCK_DURATION;
    }

    this.limits.set(identifier, entry);
  }

  resetLimit(identifier: string): void {
    this.limits.delete(identifier);
  }

  clearAll(): void {
    this.limits.clear();
  }
}

// Create singleton instance
const rateLimiterInstance = new RateLimiter();

/**
 * React Hook for Rate Limiting
 */
export function useRateLimiter() {
  return {
    checkLimit: (identifier: string) => rateLimiterInstance.checkLimit(identifier),
    recordAttempt: (identifier: string, success?: boolean) => 
      rateLimiterInstance.recordAttempt(identifier, success),
    resetLimit: (identifier: string) => rateLimiterInstance.resetLimit(identifier),
    clearAll: () => rateLimiterInstance.clearAll()
  };
}

// Export instance for non-React usage
export default rateLimiterInstance;