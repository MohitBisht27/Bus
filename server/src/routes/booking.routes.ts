import { Router } from 'express';
import { BookingController } from '../controllers/BookingController';
import { validate } from '../middleware/validate';
import { authenticate, optionalAuthenticate, authorize } from '../middleware/auth';
import { CreateBookingSchema, CancelBookingSchema } from '../schemas';

const router = Router();

// Create confirmed booking (Supports both guest and authenticated user bookings)
router.post('/', optionalAuthenticate, validate(CreateBookingSchema), BookingController.createBooking);

// PNR lookup (Public / Passenger self-service)
router.get('/pnr/:pnr', BookingController.getByPNR);

// User booking history
router.get('/my-bookings', authenticate, BookingController.getUserBookings);

// Admin / Operator list all bookings
router.get('/', authenticate, authorize('ADMIN', 'OPERATOR'), BookingController.getAllBookings);

// Cancellation preview & execution
router.get('/pnr/:pnr/cancel-preview', BookingController.previewCancellation);
router.post('/pnr/:pnr/cancel', optionalAuthenticate, validate(CancelBookingSchema), BookingController.cancelBooking);

// Operator check-in
router.patch('/pnr/:pnr/check-in', authenticate, authorize('OPERATOR', 'ADMIN'), BookingController.checkInPassenger);

export default router;
