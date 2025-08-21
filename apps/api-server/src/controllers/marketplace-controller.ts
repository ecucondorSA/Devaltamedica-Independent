// ============================================================================
// LEGACY MARKETPLACE CONTROLLER - NOW RE-EXPORTS FROM UNIFIED SYSTEM
// ============================================================================
//
// Este archivo ha sido migrado al UnifiedMarketplaceSystem para consolidar
// múltiples implementaciones duplicadas en una sola API coherente.
//
// COMPATIBILIDAD: Este archivo mantiene la API Express legacy
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import UnifiedMarketplaceService from '../marketplace/UnifiedMarketplaceSystem';

import { logger } from '@altamedica/shared/services/logger.service';
// Wrapper functions for Express-style controllers
export const createCompany = async (req: any, res: any) => {
  try {
    const company = await UnifiedMarketplaceService.createCompany({
      ...req.body,
      createdBy: req.user?.id || 'unknown'
    });
    
    res.status(201).json({ 
      success: true, 
      data: company,
      message: 'Company created successfully' 
    });
  } catch (error: any) {
    logger.error('Error creating company:', undefined, error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create company' 
    });
  }
};

export const updateCompany = async (req: any, res: any) => {
  try {
    const companyId = req.params.id;
    const company = await UnifiedMarketplaceService.updateCompany(companyId, req.body);
    
    res.status(200).json({ 
      success: true, 
      data: company,
      message: 'Company updated successfully' 
    });
  } catch (error: any) {
    logger.error('Error updating company:', undefined, error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ 
      success: false, 
      error: error.message || 'Failed to update company' 
    });
  }
};

export const createListing = async (req: any, res: any) => {
  try {
    const listing = await UnifiedMarketplaceService.createListing({
      ...req.body,
      createdBy: req.user?.id || 'unknown'
    });
    
    res.status(201).json({ 
      success: true, 
      data: listing,
      message: 'Listing created successfully' 
    });
  } catch (error: any) {
    logger.error('Error creating listing:', undefined, error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create listing' 
    });
  }
};

export const getListings = async (req: any, res: any) => {
  try {
    const filters = {
      category: req.query.category,
      type: req.query.type,
      location: req.query.location,
      remote: req.query.remote === 'true' ? true : req.query.remote === 'false' ? false : undefined,
      companyId: req.query.companyId,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const result = await UnifiedMarketplaceService.getListings(filters);
    
    res.status(200).json({ 
      success: true, 
      data: result.listings,
      count: result.count,
      message: 'Listings fetched successfully' 
    });
  } catch (error: any) {
    logger.error('Error getting listings:', undefined, error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get listings' 
    });
  }
};

export const updateListing = async (req: any, res: any) => {
  try {
    const listingId = req.params.id;
    const listing = await UnifiedMarketplaceService.updateListing(listingId, req.body);
    
    res.status(200).json({ 
      success: true, 
      data: listing,
      message: 'Listing updated successfully' 
    });
  } catch (error: any) {
    logger.error('Error updating listing:', undefined, error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ 
      success: false, 
      error: error.message || 'Failed to update listing' 
    });
  }
};

export const applyToListing = async (req: any, res: any) => {
  try {
    const listingId = req.params.id;
    const application = await UnifiedMarketplaceService.createApplication({
      listingId,
      applicantId: req.user?.id || 'unknown',
      ...req.body
    });
    
    res.status(201).json({ 
      success: true, 
      data: application,
      message: 'Applied to listing successfully' 
    });
  } catch (error: any) {
    logger.error('Error applying to listing:', undefined, error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to apply to listing' 
    });
  }
};

export const getApplications = async (req: any, res: any) => {
  try {
    const listingId = req.params.id;
    const filters = {
      status: req.query.status,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const result = await UnifiedMarketplaceService.getApplicationsByListing(listingId, filters);
    
    res.status(200).json({ 
      success: true, 
      data: result.applications,
      count: result.count,
      total: result.total,
      message: 'Applications fetched successfully' 
    });
  } catch (error: any) {
    logger.error('Error getting applications:', undefined, error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get applications' 
    });
  }
};

export const updateApplication = async (req: any, res: any) => {
  try {
    const applicationId = req.params.id;
    const application = await UnifiedMarketplaceService.updateApplication(applicationId, {
      ...req.body,
      reviewedBy: req.user?.id,
      reviewedAt: new Date()
    });
    
    res.status(200).json({ 
      success: true, 
      data: application,
      message: 'Application updated successfully' 
    });
  } catch (error: any) {
    logger.error('Error updating application:', undefined, error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ 
      success: false, 
      error: error.message || 'Failed to update application' 
    });
  }
};
