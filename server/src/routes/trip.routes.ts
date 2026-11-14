import { Router } from 'express';
import { TripController } from '../controllers/TripController';
import { validate, validateQuery } from '../middleware/validate';
import { authenticate, optionalAuthenticate, authorize } from '../middleware/auth';
import { TripSearchSchema, LockSeatSchema, CreateTripScheduleSchema } from '../schemas';

const router = Router();

// Public trip search & seat layout
router.get('/search', validateQuery(TripSearchSchema), TripController.search);
router.get('/:id/seats', TripController.getSeatLayout);

// Seat reservation / locking
router.post('/seats/lock', optionalAuthenticate, validate(LockSeatSchema), TripController.lockSeats);
router.post('/seats/release', optionalAuthenticate, TripController.releaseSeats);

// Admin / Operator trip scheduling
router.get('/', authenticate, authorize('ADMIN', 'OPERATOR'), TripController.getAllTrips);
router.post('/', authenticate, authorize('ADMIN', 'OPERATOR'), validate(CreateTripScheduleSchema), TripController.createTrip);

export default router;
