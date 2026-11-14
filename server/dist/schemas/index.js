"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTripScheduleSchema = exports.CreateRouteSchema = exports.CreateBusSchema = exports.CreateOperatorSchema = exports.CancelBookingSchema = exports.CreateBookingSchema = exports.PassengerDetailSchema = exports.LockSeatSchema = exports.TripSearchSchema = exports.LoginSchema = exports.RegisterSchema = void 0;
const zod_1 = require("zod");
exports.RegisterSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Valid email is required'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    phone: zod_1.z.string().optional(),
    role: zod_1.z.enum(['PASSENGER', 'OPERATOR', 'ADMIN']).optional().default('PASSENGER'),
    operatorId: zod_1.z.string().optional(),
});
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Valid email is required'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.TripSearchSchema = zod_1.z.object({
    origin: zod_1.z.string().min(1, 'Origin city is required'),
    destination: zod_1.z.string().min(1, 'Destination city is required'),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Travel date must be in YYYY-MM-DD format'),
    busType: zod_1.z.string().optional(),
    operatorId: zod_1.z.string().optional(),
    minFare: zod_1.z.coerce.number().optional(),
    maxFare: zod_1.z.coerce.number().optional(),
});
exports.LockSeatSchema = zod_1.z.object({
    tripId: zod_1.z.string().min(1, 'Trip ID is required'),
    seatNumbers: zod_1.z.array(zod_1.z.string().min(1)).min(1, 'At least one seat must be selected'),
    passengerGender: zod_1.z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
});
exports.PassengerDetailSchema = zod_1.z.object({
    seatNumber: zod_1.z.string().min(1),
    passengerName: zod_1.z.string().min(2, 'Passenger name is required'),
    passengerAge: zod_1.z.coerce.number().min(1).max(120),
    passengerGender: zod_1.z.enum(['MALE', 'FEMALE', 'OTHER']),
});
exports.CreateBookingSchema = zod_1.z.object({
    tripId: zod_1.z.string().min(1, 'Trip ID is required'),
    contactName: zod_1.z.string().min(2, 'Contact name is required'),
    contactEmail: zod_1.z.string().email('Valid contact email is required'),
    contactPhone: zod_1.z.string().min(7, 'Valid contact phone is required'),
    passengers: zod_1.z.array(exports.PassengerDetailSchema).min(1, 'At least one passenger is required'),
    boardingStop: zod_1.z.string().min(1, 'Boarding point is required'),
    droppingStop: zod_1.z.string().min(1, 'Dropping point is required'),
    idempotencyKey: zod_1.z.string().optional(),
});
exports.CancelBookingSchema = zod_1.z.object({
    reason: zod_1.z.string().optional(),
});
exports.CreateOperatorSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Operator name is required'),
    code: zod_1.z.string().min(2).max(6, 'Operator code must be 2-6 letters'),
    contactEmail: zod_1.z.string().email(),
    contactPhone: zod_1.z.string().min(7),
    address: zod_1.z.string().optional(),
});
exports.CreateBusSchema = zod_1.z.object({
    operatorId: zod_1.z.string().min(1, 'Operator ID is required'),
    registrationNumber: zod_1.z.string().min(4, 'Registration number is required'),
    model: zod_1.z.string().min(2),
    busType: zod_1.z.enum(['AC_SLEEPER', 'AC_SEATER', 'NON_AC_SEATER', 'VOLVO_MULTI_AXLE']),
    layoutType: zod_1.z.enum(['2x2', '2x1', '1x2', 'SLEEPER_2x1']).default('2x2'),
    totalSeats: zod_1.z.coerce.number().min(4).max(60),
    amenities: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.CreateRouteSchema = zod_1.z.object({
    name: zod_1.z.string().min(3),
    originCity: zod_1.z.string().min(2),
    destinationCity: zod_1.z.string().min(2),
    totalDistanceKm: zod_1.z.coerce.number().min(1),
    estimatedDurationMinutes: zod_1.z.coerce.number().min(1),
    stops: zod_1.z.array(zod_1.z.object({
        stopName: zod_1.z.string().min(1),
        landmark: zod_1.z.string().optional(),
        stopType: zod_1.z.enum(['BOARDING', 'DROPPING', 'BOTH']),
        sequence: zod_1.z.number().int().min(1),
        offsetMinutesFromStart: zod_1.z.number().int().min(0),
    })).min(2, 'A route must have at least an origin and a destination stop'),
});
exports.CreateTripScheduleSchema = zod_1.z.object({
    operatorId: zod_1.z.string().min(1),
    busId: zod_1.z.string().min(1),
    routeId: zod_1.z.string().min(1),
    departureTime: zod_1.z.string().datetime(),
    arrivalTime: zod_1.z.string().datetime(),
    baseFare: zod_1.z.coerce.number().min(10),
});
