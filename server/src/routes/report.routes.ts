import { Router } from 'express';
import { ReportController } from '../controllers/ReportController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Passenger manifest for a trip (Operator & Admin)
router.get('/trips/:tripId/manifest', authenticate, authorize('ADMIN', 'OPERATOR'), ReportController.getTripManifest);

// Occupancy report across fleet (Operator & Admin)
router.get('/occupancy', authenticate, authorize('ADMIN', 'OPERATOR'), ReportController.getOccupancyReport);

// Executive dashboard overview KPIs
router.get('/dashboard-overview', authenticate, authorize('ADMIN', 'OPERATOR'), ReportController.getDashboardOverview);

export default router;
