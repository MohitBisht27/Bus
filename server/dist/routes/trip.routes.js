"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const TripController_1 = require("../controllers/TripController");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const schemas_1 = require("../schemas");
const router = (0, express_1.Router)();
// Public trip search & seat layout
router.get('/search', (0, validate_1.validateQuery)(schemas_1.TripSearchSchema), TripController_1.TripController.search);
router.get('/:id/seats', TripController_1.TripController.getSeatLayout);
// Seat reservation / locking
router.post('/seats/lock', auth_1.optionalAuthenticate, (0, validate_1.validate)(schemas_1.LockSeatSchema), TripController_1.TripController.lockSeats);
router.post('/seats/release', auth_1.optionalAuthenticate, TripController_1.TripController.releaseSeats);
// Admin / Operator trip scheduling
router.get('/', auth_1.authenticate, (0, auth_1.authorize)('ADMIN', 'OPERATOR'), TripController_1.TripController.getAllTrips);
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('ADMIN', 'OPERATOR'), (0, validate_1.validate)(schemas_1.CreateTripScheduleSchema), TripController_1.TripController.createTrip);
exports.default = router;
