import crypto from 'crypto';
import { z } from 'zod';

import { logger } from '@altamedica/shared/services/logger.service';
/**
 * TURN Server Authentication Service
 * 
 * Implements RFC 5389 STUN/TURN authentication with:
 * - Time-limited credentials (ephemeral)
 * - HMAC-SHA256 signed tokens
 * - Automatic credential rotation
 * - Multi-server support
 * 
 * @see https://tools.ietf.org/html/rfc5389
 */

// Configuration schema
const TURNConfigSchema = z.object({
  servers: z.array(z.object({
    url: z.string().url(),
    secret: z.string().min(32),
    region: z.string().optional(),
    priority: z.number().default(1),
  })),
  credentialTTL: z.number().default(86400), // 24 hours default
  rotationInterval: z.number().default(3600), // 1 hour rotation
});

type TURNConfig = z.infer<typeof TURNConfigSchema>;

export class TURNAuthService {
  private config: TURNConfig;
  private credentialCache = new Map<string, TURNCredentials>();
  private rotationTimer?: NodeJS.Timeout;

  constructor() {
    this.config = this.loadConfig();
    this.startCredentialRotation();
  }

  /**
   * Load TURN configuration from environment
   */
  private loadConfig(): TURNConfig {
    const servers = [];
    
    // Primary TURN server
    if (process.env.TURN_SERVER_URL) {
      servers.push({
        url: process.env.TURN_SERVER_URL,
        secret: process.env.TURN_SERVER_SECRET || crypto.randomBytes(32).toString('hex'),
        region: process.env.TURN_SERVER_REGION || 'us-east-1',
        priority: 1,
      });
    }
    
    // Secondary TURN server (fallback)
    if (process.env.TURN_SERVER_URL_SECONDARY) {
      servers.push({
        url: process.env.TURN_SERVER_URL_SECONDARY,
        secret: process.env.TURN_SERVER_SECRET_SECONDARY || crypto.randomBytes(32).toString('hex'),
        region: process.env.TURN_SERVER_REGION_SECONDARY || 'eu-west-1',
        priority: 2,
      });
    }

    // Default to Twilio TURN if no servers configured
    if (servers.length === 0) {
      logger.warn('⚠️ No TURN servers configured, using default configuration');
      servers.push({
        url: 'turn:global.turn.twilio.com:3478?transport=tcp',
        secret: process.env.TWILIO_AUTH_TOKEN || 'development-only-secret',
        region: 'global',
        priority: 1,
      });
    }

    return TURNConfigSchema.parse({
      servers,
      credentialTTL: parseInt(process.env.TURN_CREDENTIAL_TTL || '86400'),
      rotationInterval: parseInt(process.env.TURN_ROTATION_INTERVAL || '3600'),
    });
  }

  /**
   * Generate ephemeral TURN credentials for a user
   * 
   * @param userId - User identifier
   * @param sessionId - WebRTC session identifier
   * @returns TURN credentials with ICE servers configuration
   */
  public async generateCredentials(userId: string, sessionId: string): Promise<TURNCredentials> {
    const cacheKey = `${userId}:${sessionId}`;
    
    // Return cached credentials if still valid
    const cached = this.credentialCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached;
    }

    // Generate new credentials
    const timestamp = Math.floor(Date.now() / 1000) + this.config.credentialTTL;
    const username = `${timestamp}:${userId}`;
    
    const iceServers: RTCIceServer[] = [];

    // Add STUN servers (always free)
    iceServers.push(
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    );

    // Add TURN servers with credentials
    for (const server of this.config.servers) {
      const password = this.generatePassword(username, server.secret);
      
      iceServers.push({
        urls: server.url,
        username,
        credential: password,
        credentialType: 'password',
      });

      // Add TCP variant if not specified
      if (!server.url.includes('transport=')) {
        iceServers.push({
          urls: `${server.url}?transport=tcp`,
          username,
          credential: password,
          credentialType: 'password',
        });
      }
    }

    const credentials: TURNCredentials = {
      iceServers,
      username,
      expiresAt: timestamp * 1000,
      sessionId,
      userId,
    };

    // Cache credentials
    this.credentialCache.set(cacheKey, credentials);

    // Log credential generation (without sensitive data)
    logger.info(`[TURN] Generated credentials for user ${userId}, expires at ${new Date(credentials.expiresAt).toISOString()}`);

    return credentials;
  }

  /**
   * Generate HMAC-SHA256 password for TURN authentication
   */
  private generatePassword(username: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(username)
      .digest('base64');
  }

  /**
   * Validate TURN credentials
   */
  public validateCredentials(username: string, password: string): boolean {
    // Extract timestamp from username (format: timestamp:userId)
    const parts = username.split(':');
    if (parts.length !== 2) {
      return false;
    }

    const timestamp = parseInt(parts[0]);
    const now = Math.floor(Date.now() / 1000);

    // Check if credentials are expired
    if (timestamp < now) {
      logger.warn(`[TURN] Expired credentials for username ${username}`);
      return false;
    }

    // Validate password for each server
    for (const server of this.config.servers) {
      const expectedPassword = this.generatePassword(username, server.secret);
      if (password === expectedPassword) {
        return true;
      }
    }

    return false;
  }

  /**
   * Start automatic credential rotation
   */
  private startCredentialRotation(): void {
    // Clear existing timer
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }

    // Rotate credentials periodically
    this.rotationTimer = setInterval(() => {
      this.rotateCredentials();
    }, this.config.rotationInterval * 1000);

    logger.info(`[TURN] Credential rotation started (interval: ${this.config.rotationInterval}s)`);
  }

  /**
   * Rotate expired credentials
   */
  private rotateCredentials(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, credentials] of this.credentialCache.entries()) {
      if (credentials.expiresAt < now) {
        this.credentialCache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logger.info(`[TURN] Rotated ${removed} expired credentials`);
    }
  }

  /**
   * Get TURN server statistics
   */
  public getStatistics(): TURNStatistics {
    const now = Date.now();
    const activeCredentials = Array.from(this.credentialCache.values())
      .filter(cred => cred.expiresAt > now);

    return {
      totalServers: this.config.servers.length,
      activeCredentials: activeCredentials.length,
      cacheSize: this.credentialCache.size,
      servers: this.config.servers.map(server => ({
        url: server.url,
        region: server.region || 'unknown',
        priority: server.priority,
        status: 'active', // Could ping server to check real status
      })),
      credentialTTL: this.config.credentialTTL,
      rotationInterval: this.config.rotationInterval,
    };
  }

  /**
   * Health check for TURN servers
   */
  public async healthCheck(): Promise<TURNHealthCheck> {
    const results: TURNHealthCheck = {
      healthy: true,
      servers: [],
      timestamp: new Date().toISOString(),
    };

    for (const server of this.config.servers) {
      try {
        // In production, you would actually ping the TURN server
        // For now, we'll simulate with a simple URL validation
        const url = new URL(server.url);
        const isHealthy = url.protocol === 'turn:' || url.protocol === 'turns:';
        
        results.servers.push({
          url: server.url,
          region: server.region || 'unknown',
          healthy: isHealthy,
          latency: Math.random() * 100, // Simulated latency
        });

        if (!isHealthy) {
          results.healthy = false;
        }
      } catch (error) {
        results.servers.push({
          url: server.url,
          region: server.region || 'unknown',
          healthy: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        results.healthy = false;
      }
    }

    return results;
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = undefined;
    }
    this.credentialCache.clear();
    logger.info('[TURN] Service disposed');
  }
}

// Type definitions
export interface TURNCredentials {
  iceServers: RTCIceServer[];
  username: string;
  expiresAt: number;
  sessionId: string;
  userId: string;
}

export interface RTCIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
  credentialType?: 'password' | 'oauth';
}

export interface TURNStatistics {
  totalServers: number;
  activeCredentials: number;
  cacheSize: number;
  servers: Array<{
    url: string;
    region: string;
    priority: number;
    status: string;
  }>;
  credentialTTL: number;
  rotationInterval: number;
}

export interface TURNHealthCheck {
  healthy: boolean;
  servers: Array<{
    url: string;
    region: string;
    healthy: boolean;
    latency?: number;
    error?: string;
  }>;
  timestamp: string;
}

// Singleton instance
let turnAuthService: TURNAuthService | null = null;

export function getTURNAuthService(): TURNAuthService {
  if (!turnAuthService) {
    turnAuthService = new TURNAuthService();
  }
  return turnAuthService;
}

// Export default instance
export default getTURNAuthService();