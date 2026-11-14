"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const BookingController_1 = require("../controllers/BookingController");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const schemas_1 = require("../schemas");
const router = (0, express_1.Router)();
// Create confirmed booking (Supports both guest and authenticated user bookings)
router.post('/', auth_1.optionalAuthenticate, (0, validate_1.validate)(schemas_1.CreateBookingSchema), BookingController_1.BookingController.createBooking);
// PNR lookup (Public / Passenger self-service)
router.get('/pnr/:pnr', BookingController_1.BookingController.getByPNR);
// User booking history
router.get('/my-bookings', auth_1.authenticate, BookingController_1.BookingController.getUserBookings);
// Admin / Operator list all bookings
router.get('/', auth_1.authenticate, (0, auth_1.authorize)('ADMIN', 'OPERATOR'), BookingController_1.BookingController.getAllBookings);
// Cancellation preview & execution
router.get('/pnr/:pnr/cancel-preview', BookingController_1.BookingController.previewCancellation);
router.post('/pnr/:pnr/cancel', auth_1.optionalAuthenticate, (0, validate_1.validate)(schemas_1.CancelBookingSchema), BookingController_1.BookingController.cancelBooking);
// Operator check-in
router.patch('/pnr/:pnr/check-in', auth_1.authenticate, (0, auth_1.authorize)('OPERATOR', 'ADMIN'), BookingController_1.BookingController.checkInPassenger);
exports.default = router;
