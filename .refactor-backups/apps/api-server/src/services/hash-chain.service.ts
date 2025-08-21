import { createHash } from 'crypto';
import type { AuditLog } from '@altamedica/types';
import { AuditLogRepository } from '@altamedica/database';

import { logger } from '@altamedica/shared/services/logger.service';
/**
 * Hash Chain Service for Audit Log Integrity
 * Implements GAP-001-T5: Blockchain-style hash chain for immutable audit trail
 * Compliant with HIPAA and Argentina Ley 26.529
 */
export class HashChainService {
  private static instance: HashChainService;
  private lastHash: string | null = null;
  private lastSequenceNumber: number = 0;
  private auditRepo: AuditLogRepository;

  private constructor() {
    this.auditRepo = new AuditLogRepository();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): HashChainService {
    if (!HashChainService.instance) {
      HashChainService.instance = new HashChainService();
    }
    return HashChainService.instance;
  }

  /**
   * Calculate SHA-256 hash of audit log entry
   */
  calculateHash(entry: Omit<AuditLog, 'hash' | 'prevHash' | 'sequenceNumber'>): string {
    // Create deterministic string representation
    const dataToHash = JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp,
      actorId: entry.actorId,
      actorType: entry.actorType,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId || '',
      ip: entry.ip || '',
      userAgent: entry.userAgent || '',
      metadata: entry.metadata || {},
      patientId: entry.patientId || '',
      sessionId: entry.sessionId || '',
      success: entry.success,
      errorMessage: entry.errorMessage || ''
    });

    return createHash('sha256').update(dataToHash).digest('hex');
  }

  /**
   * Calculate hash with previous hash included (blockchain style)
   */
  calculateChainedHash(
    entry: Omit<AuditLog, 'hash' | 'prevHash' | 'sequenceNumber'>,
    prevHash: string | null,
    sequenceNumber: number
  ): string {
    const baseHash = this.calculateHash(entry);
    const chainData = `${prevHash || 'GENESIS'}:${sequenceNumber}:${baseHash}`;
    return createHash('sha256').update(chainData).digest('hex');
  }

  /**
   * Add hash chain fields to audit log entry
   */
  async addHashChain(
    entry: Omit<AuditLog, 'hash' | 'prevHash' | 'sequenceNumber'>
  ): Promise<AuditLog> {
    // Get previous hash and sequence number
    const prevHash = await this.getLastHash();
    const sequenceNumber = await this.getNextSequenceNumber();

    // Calculate chained hash
    const hash = this.calculateChainedHash(entry, prevHash, sequenceNumber);

    // Update internal state
    this.lastHash = hash;
    this.lastSequenceNumber = sequenceNumber;

    return {
      ...entry,
      hash,
      prevHash,
      sequenceNumber
    };
  }

  /**
   * Verify integrity of a single audit log entry
   */
  verifyEntry(entry: AuditLog): boolean {
    if (!entry.hash || entry.sequenceNumber === undefined) {
      return false; // Legacy entries without hash
    }

    const calculatedHash = this.calculateChainedHash(
      entry,
      entry.prevHash,
      entry.sequenceNumber
    );

    return calculatedHash === entry.hash;
  }

  /**
   * Verify integrity of entire audit log chain
   */
  async verifyChain(entries: AuditLog[]): Promise<{
    isValid: boolean;
    brokenAt?: number;
    error?: string;
  }> {
    if (entries.length === 0) {
      return { isValid: true };
    }

    // Sort by sequence number
    const sorted = [...entries].sort((a, b) => 
      (a.sequenceNumber || 0) - (b.sequenceNumber || 0)
    );

    for (let i = 0; i < sorted.length; i++) {
      const entry = sorted[i];
      
      // Skip legacy entries
      if (!entry.hash || entry.sequenceNumber === undefined) {
        continue;
      }

      // Verify individual entry
      if (!this.verifyEntry(entry)) {
        return {
          isValid: false,
          brokenAt: entry.sequenceNumber,
          error: `Hash mismatch at sequence ${entry.sequenceNumber}`
        };
      }

      // Verify chain continuity
      if (i > 0) {
        const prevEntry = sorted[i - 1];
        if (prevEntry.hash && entry.prevHash !== prevEntry.hash) {
          return {
            isValid: false,
            brokenAt: entry.sequenceNumber,
            error: `Chain broken at sequence ${entry.sequenceNumber}`
          };
        }
      }
    }

    return { isValid: true };
  }

  /**
   * Get last hash from database or cache
   */
  private async getLastHash(): Promise<string | null> {
    // First check in-memory cache for performance
    if (this.lastHash) {
      return this.lastHash;
    }

    try {
      // Query database for last audit log entry
      const lastEntry = await this.auditRepo.findLast();
      
      if (lastEntry && lastEntry.hash) {
        // Update cache
        this.lastHash = lastEntry.hash;
        this.lastSequenceNumber = lastEntry.sequenceNumber || 0;
        return lastEntry.hash;
      }
    } catch (error) {
      logger.error('[HashChain] Error fetching last hash:', undefined, error);
      // Continue with genesis block on error
    }

    return null; // Genesis block
  }

  /**
   * Get next sequence number
   */
  private async getNextSequenceNumber(): Promise<number> {
    // First check in-memory counter for performance
    if (this.lastSequenceNumber > 0) {
      return this.lastSequenceNumber + 1;
    }

    try {
      // Query database for max sequence number
      const maxSeq = await this.auditRepo.getMaxSequenceNumber();
      const nextSeq = (maxSeq || 0) + 1;
      
      // Update cache
      this.lastSequenceNumber = maxSeq || 0;
      
      return nextSeq;
    } catch (error) {
      logger.error('[HashChain] Error fetching max sequence number:', undefined, error);
      // Fallback to 1 if database query fails
      return 1;
    }
  }

  /**
   * Reset chain (for testing only)
   */
  resetChain(): void {
    if (process.env.NODE_ENV === 'test') {
      this.lastHash = null;
      this.lastSequenceNumber = 0;
    }
  }

  /**
   * Calculate Merkle root for a batch of entries (advanced feature)
   */
  calculateMerkleRoot(entries: AuditLog[]): string {
    if (entries.length === 0) {
      return createHash('sha256').update('EMPTY').digest('hex');
    }

    // Get hashes of all entries
    let hashes = entries.map(e => e.hash || this.calculateHash(e));

    // Build Merkle tree
    while (hashes.length > 1) {
      const newLevel: string[] = [];
      
      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = hashes[i + 1] || left; // Duplicate if odd number
        const combined = createHash('sha256')
          .update(left + right)
          .digest('hex');
        newLevel.push(combined);
      }
      
      hashes = newLevel;
    }

    return hashes[0];
  }

  /**
   * Export chain metadata for compliance reporting
   */
  getChainMetadata(): {
    lastHash: string | null;
    lastSequenceNumber: number;
    timestamp: Date;
    algorithm: string;
    version: string;
  } {
    return {
      lastHash: this.lastHash,
      lastSequenceNumber: this.lastSequenceNumber,
      timestamp: new Date(),
      algorithm: 'SHA-256',
      version: '1.0.0'
    };
  }
}

// Export singleton instance
export const hashChainService = HashChainService.getInstance();