import { NextRequest, NextResponse } from 'next/server';
import { UnifiedAuth } from '@/auth/UnifiedAuthSystem';
import { medicationCatalogService } from '@altamedica/shared/services/medication-catalog.service';
import { MedicationSearchSchema } from '@altamedica/types';

import { logger } from '@altamedica/shared/services/logger.service';
/**
 * GET /api/v1/medications
 * Search medications with pagination
 * Requires authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user - doctors and admins can search medications
    const authResult = await UnifiedAuth(request, ['doctor', 'admin']);
    if (!authResult.success) return authResult.response;

    // Parse search parameters
    const searchParams = request.nextUrl.searchParams;
    const searchData = {
      query: searchParams.get('query') || '',
      category: searchParams.get('category') || undefined,
      dosageForm: searchParams.get('dosageForm') || undefined,
      limit: parseInt(searchParams.get('limit') || '10'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    // Validate search parameters
    const validatedSearch = MedicationSearchSchema.parse(searchData);

    // Search medications
    const results = await medicationCatalogService.searchMedications(validatedSearch);

    return NextResponse.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('[Medications] Search error:', undefined, error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid search parameters',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search medications',
        message: error.message
      },
      { status: 500 }
    );
  }
}