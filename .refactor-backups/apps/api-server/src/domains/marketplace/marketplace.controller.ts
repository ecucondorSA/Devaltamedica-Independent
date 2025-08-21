import { NextRequest, NextResponse } from 'next/server';
import { MarketplaceService } from './marketplace.service';
import { UnifiedAuth } from '../../auth/UnifiedAuthSystem';

import { logger } from '@altamedica/shared/services/logger.service';
export class MarketplaceController {
  // Company endpoints
  static async createCompany(request: NextRequest): Promise<NextResponse> {
    try {
      const authResult = await UnifiedAuth(request, ['COMPANY', 'ADMIN']);
      if (!authResult.success) return authResult.response;

      const body = await request.json();
      
      const companyData = {
        ...body,
        createdBy: authResult.user?.userId!
      };

      const company = await MarketplaceService.createCompany(companyData);

      return NextResponse.json({
        success: true,
        data: company
      }, { status: 201 });
    } catch (error) {
      logger.error('Error en createCompany controller:', undefined, error);
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }

  static async getCompanies(request: NextRequest): Promise<NextResponse> {
    try {
      const authResult = await UnifiedAuth(request, ['PATIENT', 'DOCTOR', 'COMPANY', 'ADMIN']);
      if (!authResult.success) return authResult.response;

      const { searchParams } = new URL(request.url);
      const filters = {
        industry: searchParams.get('industry') || undefined,
        size: searchParams.get('size') || undefined,
        verified: searchParams.get('verified') ? searchParams.get('verified') === 'true' : undefined,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
      };

      const companies = await MarketplaceService.getCompanies(filters);

      return NextResponse.json({
        success: true,
        data: companies
      });
    } catch (error) {
      logger.error('Error en getCompanies controller:', undefined, error);
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }

  static async getCompany(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const authResult = await UnifiedAuth(request, ['PATIENT', 'DOCTOR', 'COMPANY', 'ADMIN']);
      if (!authResult.success) return authResult.response;

      const companyId = params.id;
      const company = await MarketplaceService.getCompany(companyId);

      if (!company) {
        return NextResponse.json(
          { success: false, error: 'Empresa no encontrada' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: company
      });
    } catch (error) {
      logger.error('Error en getCompany controller:', undefined, error);
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }

  static async updateCompany(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const authResult = await UnifiedAuth(request, ['COMPANY', 'ADMIN']);
      if (!authResult.success) return authResult.response;

      const companyId = params.id;
      const body = await request.json();

      // Verificar permisos: solo el creador de la empresa o admin
      const existingCompany = await MarketplaceService.getCompany(companyId);
      if (!existingCompany) {
        return NextResponse.json(
          { success: false, error: 'Empresa no encontrada' },
          { status: 404 }
        );
      }

      const canUpdate = 
        authResult.user?.role === 'admin' ||
        existingCompany.createdBy === authResult.user?.userId;

      if (!canUpdate) {
        return NextResponse.json(
          { success: false, error: 'Acceso denegado' },
          { status: 403 }
        );
      }

      const updatedCompany = await MarketplaceService.updateCompany(companyId, body);

      return NextResponse.json({
        success: true,
        data: updatedCompany
      });
    } catch (error) {
      logger.error('Error en updateCompany controller:', undefined, error);
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }

  // Job Listing endpoints
  static async createJobListing(request: NextRequest): Promise<NextResponse> {
    try {
      const authResult = await UnifiedAuth(request, ['COMPANY', 'ADMIN']);
      if (!authResult.success) return authResult.response;

      const body = await request.json();
      
      const listingData = {
        ...body,
        createdBy: authResult.user?.userId!
      };

      // Validar datos requeridos
      if (!listingData.title || !listingData.description || !listingData.companyId) {
        return NextResponse.json(
          { success: false, error: 'Datos requeridos: title, description, companyId' },
          { status: 400 }
        );
      }

      const listing = await MarketplaceService.createJobListing(listingData);

      return NextResponse.json({
        success: true,
        data: listing
      }, { status: 201 });
    } catch (error) {
      logger.error('Error en createJobListing controller:', undefined, error);
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }

  static async getJobListings(request: NextRequest): Promise<NextResponse> {
    try {
      const authResult = await UnifiedAuth(request, ['PATIENT', 'DOCTOR', 'COMPANY', 'ADMIN']);
      if (!authResult.success) return authResult.response;

      const { searchParams } = new URL(request.url);
      const filters = {
        companyId: searchParams.get('companyId') || undefined,
        employmentType: searchParams.get('employmentType') || undefined,
        experienceLevel: searchParams.get('experienceLevel') || undefined,
        department: searchParams.get('department') || undefined,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
      };

      const listings = await MarketplaceService.getJobListings(filters);

      return NextResponse.json({
        success: true,
        data: listings
      });
    } catch (error) {
      logger.error('Error en getJobListings controller:', undefined, error);
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }

  static async getJobListing(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const authResult = await UnifiedAuth(request, ['PATIENT', 'DOCTOR', 'COMPANY', 'ADMIN']);
      if (!authResult.success) return authResult.response;

      const listingId = params.id;
      const listing = await MarketplaceService.getJobListing(listingId);

      if (!listing) {
        return NextResponse.json(
          { success: false, error: 'Oferta de trabajo no encontrada' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: listing
      });
    } catch (error) {
      logger.error('Error en getJobListing controller:', undefined, error);
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }

  static async updateJobListing(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const authResult = await UnifiedAuth(request, ['COMPANY', 'ADMIN']);
      if (!authResult.success) return authResult.response;

      const listingId = params.id;
      const body = await request.json();

      // Verificar permisos
      const existingListing = await MarketplaceService.getJobListing(listingId);
      if (!existingListing) {
        return NextResponse.json(
          { success: false, error: 'Oferta de trabajo no encontrada' },
          { status: 404 }
        );
      }

      const canUpdate = 
        authResult.user?.role === 'admin' ||
        existingListing.createdBy === authResult.user?.userId;

      if (!canUpdate) {
        return NextResponse.json(
          { success: false, error: 'Acceso denegado' },
          { status: 403 }
        );
      }

      const updatedListing = await MarketplaceService.updateJobListing(listingId, body);

      return NextResponse.json({
        success: true,
        data: updatedListing
      });
    } catch (error) {
      logger.error('Error en updateJobListing controller:', undefined, error);
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }

  static async deleteJobListing(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const authResult = await UnifiedAuth(request, ['COMPANY', 'ADMIN']);
      if (!authResult.success) return authResult.response;

      const listingId = params.id;

      // Verificar permisos
      const existingListing = await MarketplaceService.getJobListing(listingId);
      if (!existingListing) {
        return NextResponse.json(
          { success: false, error: 'Oferta de trabajo no encontrada' },
          { status: 404 }
        );
      }

      const canDelete = 
        authResult.user?.role === 'admin' ||
        existingListing.createdBy === authResult.user?.userId;

      if (!canDelete) {
        return NextResponse.json(
          { success: false, error: 'Acceso denegado' },
          { status: 403 }
        );
      }

      await MarketplaceService.deleteJobListing(listingId);

      return NextResponse.json({
        success: true,
        message: 'Oferta de trabajo eliminada correctamente'
      });
    } catch (error) {
      logger.error('Error en deleteJobListing controller:', undefined, error);
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }

  // Job Application endpoints
  static async applyToJob(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const authResult = await UnifiedAuth(request, ['DOCTOR', 'PATIENT']);
      if (!authResult.success) return authResult.response;

      const listingId = params.id;
      const body = await request.json();

      const applicationData = {
        listingId,
        applicantId: authResult.user?.userId!,
        ...body
      };

      const application = await MarketplaceService.createJobApplication(applicationData);

      return NextResponse.json({
        success: true,
        data: application
      }, { status: 201 });
    } catch (error) {
      logger.error('Error en applyToJob controller:', undefined, error);
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }

  static async getJobApplications(request: NextRequest): Promise<NextResponse> {
    try {
      const authResult = await UnifiedAuth(request, ['DOCTOR', 'PATIENT', 'COMPANY', 'ADMIN']);
      if (!authResult.success) return authResult.response;

      const { searchParams } = new URL(request.url);
      const listingId = searchParams.get('listingId');
      const applicantId = searchParams.get('applicantId');

      if (listingId) {
        // Obtener aplicaciones para una oferta específica
        const filters = {
          status: searchParams.get('status') || undefined,
          limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
        };

        // Verificar permisos: solo el creador de la oferta o admin
        const listing = await MarketplaceService.getJobListing(listingId);
        if (!listing) {
          return NextResponse.json(
            { success: false, error: 'Oferta de trabajo no encontrada' },
            { status: 404 }
          );
        }

        const canViewApplications = 
          authResult.user?.role === 'admin' ||
          listing.createdBy === authResult.user?.userId;

        if (!canViewApplications) {
          return NextResponse.json(
            { success: false, error: 'Acceso denegado' },
            { status: 403 }
          );
        }

        const applications = await MarketplaceService.getJobApplicationsByListing(listingId, filters);

        return NextResponse.json({
          success: true,
          data: applications
        });

      } else if (applicantId) {
        // Obtener aplicaciones de un solicitante específico
        if (authResult.user?.role !== 'admin' && applicantId !== authResult.user?.userId) {
          return NextResponse.json(
            { success: false, error: 'Acceso denegado' },
            { status: 403 }
          );
        }

        const applications = await MarketplaceService.getJobApplicationsByApplicant(applicantId);

        return NextResponse.json({
          success: true,
          data: applications
        });

      } else {
        return NextResponse.json(
          { success: false, error: 'Se requiere listingId o applicantId' },
          { status: 400 }
        );
      }
    } catch (error) {
      logger.error('Error en getJobApplications controller:', undefined, error);
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }

  static async updateJobApplication(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const authResult = await UnifiedAuth(request, ['COMPANY', 'ADMIN']);
      if (!authResult.success) return authResult.response;

      const applicationId = params.id;
      const body = await request.json();

      // Agregar información del revisor
      const updateData = {
        ...body,
        reviewedBy: authResult.user?.userId,
        reviewedAt: new Date()
      };

      const updatedApplication = await MarketplaceService.updateJobApplication(applicationId, updateData);

      return NextResponse.json({
        success: true,
        data: updatedApplication
      });
    } catch (error) {
      logger.error('Error en updateJobApplication controller:', undefined, error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return NextResponse.json(
        { success: false, error: error.message },
        { status: statusCode }
      );
    }
  }

  // Statistics
  static async getMarketplaceStats(request: NextRequest): Promise<NextResponse> {
    try {
      const authResult = await UnifiedAuth(request, ['ADMIN']);
      if (!authResult.success) return authResult.response;

      const stats = await MarketplaceService.getMarketplaceStats();

      return NextResponse.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error en getMarketplaceStats controller:', undefined, error);
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }
}