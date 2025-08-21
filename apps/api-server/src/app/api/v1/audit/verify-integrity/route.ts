import { NextRequest, NextResponse } from 'next/server';
import { AuditLogRepository } from '@altamedica/database';
import { hashChainService } from '@/services/hash-chain.service';
import { UnifiedAuth } from '@/auth/UnifiedAuthSystem';
import type { AuditLog } from '@altamedica/types';

import { logger } from '@altamedica/shared/services/logger.service';
/**
 * API Route: Verify Audit Log Integrity
 * GAP-001-T5: Verifies hash chain integrity for compliance
 * 
 * GET /api/v1/audit/verify-integrity
 * - Verifies entire audit log chain
 * - Returns integrity status and any breaks in chain
 * - Requires admin role
 */

export async function GET(request: NextRequest) {
  try {
    // Authentication - admin only
    const authResult = await UnifiedAuth(request, ['admin']);
    if (!authResult.success) {
      return authResult.response;
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '1000');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Initialize repository
    const auditRepo = new AuditLogRepository();

    // Build filter
    const filter: any = {
      limit,
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) })
    };

    // Fetch audit logs
    const result = await auditRepo.findMany(filter);
    
    if (!result.success || !result.data) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch audit logs',
          details: result.error 
        },
        { status: 500 }
      );
    }

    const entries = result.data as AuditLog[];

    // Verify chain integrity
    const verificationResult = await hashChainService.verifyChain(entries);

    // Calculate statistics
    const totalEntries = entries.length;
    const entriesWithHash = entries.filter(e => e.hash).length;
    const legacyEntries = totalEntries - entriesWithHash;
    const hashCoverage = totalEntries > 0 
      ? ((entriesWithHash / totalEntries) * 100).toFixed(2) 
      : '0';

    // Get chain metadata
    const chainMetadata = hashChainService.getChainMetadata();

    // Prepare response
    const response = {
      success: true,
      integrity: {
        isValid: verificationResult.isValid,
        brokenAt: verificationResult.brokenAt,
        error: verificationResult.error
      },
      statistics: {
        totalEntries,
        entriesWithHash,
        legacyEntries,
        hashCoverage: `${hashCoverage}%`,
        dateRange: {
          start: startDate || 'unlimited',
          end: endDate || 'unlimited'
        }
      },
      chainMetadata,
      recommendation: getRecommendation(verificationResult.isValid, legacyEntries, totalEntries)
    };

    return NextResponse.json(response);

  } catch (error) {
    logger.error('[Audit Integrity API] Error:', undefined, error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/audit/verify-integrity
 * Verify specific audit log entries
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication - admin only
    const authResult = await UnifiedAuth(request, ['admin']);
    if (!authResult.success) {
      return authResult.response;
    }

    // Parse request body
    const body = await request.json();
    const { entries } = body;

    if (!Array.isArray(entries)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request: entries must be an array' 
        },
        { status: 400 }
      );
    }

    // Verify each entry
    const results = entries.map((entry: AuditLog) => ({
      id: entry.id,
      isValid: hashChainService.verifyEntry(entry),
      hash: entry.hash,
      sequenceNumber: entry.sequenceNumber
    }));

    // Calculate overall validity
    const allValid = results.every(r => r.isValid);
    const invalidCount = results.filter(r => !r.isValid).length;

    return NextResponse.json({
      success: true,
      allValid,
      invalidCount,
      results,
      message: allValid 
        ? 'All entries have valid hash signatures' 
        : `${invalidCount} entries have invalid signatures`
    });

  } catch (error) {
    logger.error('[Audit Integrity API] Error:', undefined, error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get recommendation based on verification results
 */
function getRecommendation(
  isValid: boolean, 
  legacyEntries: number, 
  totalEntries: number
): string {
  if (!isValid) {
    return 'CRITICAL: Chain integrity compromised. Investigate immediately and restore from backup if necessary.';
  }

  if (legacyEntries === totalEntries) {
    return 'INFO: All entries are legacy (without hash). Consider migrating historical data to hash chain.';
  }

  if (legacyEntries > 0) {
    const percentage = ((legacyEntries / totalEntries) * 100).toFixed(1);
    return `INFO: ${percentage}% of entries are legacy. Hash chain is valid for new entries.`;
  }

  return 'SUCCESS: Audit log chain integrity verified. All entries are properly hashed and linked.';
}