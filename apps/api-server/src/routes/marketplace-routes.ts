import express from 'express';
import * as marketplaceController from '../controllers/marketplace-controller';

const router = express.Router();

// Company Profiles
router.post('/companies', marketplaceController.createCompany);
router.put('/companies/:id', marketplaceController.updateCompany);

// Service Listings
router.post('/marketplace/listings', marketplaceController.createListing);
router.get('/marketplace/listings', marketplaceController.getListings);
router.put('/marketplace/listings/:id', marketplaceController.updateListing);

// Applications
router.post('/marketplace/listings/:id/apply', marketplaceController.applyToListing);
router.get('/marketplace/listings/:id/applications', marketplaceController.getApplications);
router.put('/marketplace/applications/:id', marketplaceController.updateApplication);

export default router;
