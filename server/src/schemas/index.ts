import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  role: z.enum(['PASSENGER', 'OPERATOR', 'ADMIN']).optional().default('PASSENGER'),
  operatorId: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const TripSearchSchema = z.object({
  origin: z.string().min(1, 'Origin city is required'),
  destination: z.string().min(1, 'Destination city is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Travel date must be in YYYY-MM-DD format'),
  busType: z.string().optional(),
  operatorId: z.string().optional(),
  minFare: z.coerce.number().optional(),
  maxFare: z.coerce.number().optional(),
});

export const LockSeatSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  seatNumbers: z.array(z.string().min(1)).min(1, 'At least one seat must be selected'),
  passengerGender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
});

export const PassengerDetailSchema = z.object({
  seatNumber: z.string().min(1),
  passengerName: z.string().min(2, 'Passenger name is required'),
  passengerAge: z.coerce.number().min(1).max(120),
  passengerGender: z.enum(['MALE', 'FEMALE', 'OTHER']),
});

export const CreateBookingSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  contactName: z.string().min(2, 'Contact name is required'),
  contactEmail: z.string().email('Valid contact email is required'),
  contactPhone: z.string().min(7, 'Valid contact phone is required'),
  passengers: z.array(PassengerDetailSchema).min(1, 'At least one passenger is required'),
  boardingStop: z.string().min(1, 'Boarding point is required'),
  droppingStop: z.string().min(1, 'Dropping point is required'),
  idempotencyKey: z.string().optional(),
});

export const CancelBookingSchema = z.object({
  reason: z.string().optional(),
});

export const CreateOperatorSchema = z.object({
  name: z.string().min(2, 'Operator name is required'),
  code: z.string().min(2).max(6, 'Operator code must be 2-6 letters'),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(7),
  address: z.string().optional(),
});

export const CreateBusSchema = z.object({
  operatorId: z.string().min(1, 'Operator ID is required'),
  registrationNumber: z.string().min(4, 'Registration number is required'),
  model: z.string().min(2),
  busType: z.enum(['AC_SLEEPER', 'AC_SEATER', 'NON_AC_SEATER', 'VOLVO_MULTI_AXLE']),
  layoutType: z.enum(['2x2', '2x1', '1x2', 'SLEEPER_2x1']).default('2x2'),
  totalSeats: z.coerce.number().min(4).max(60),
  amenities: z.array(z.string()).optional(),
});

export const CreateRouteSchema = z.object({
  name: z.string().min(3),
  originCity: z.string().min(2),
  destinationCity: z.string().min(2),
  totalDistanceKm: z.coerce.number().min(1),
  estimatedDurationMinutes: z.coerce.number().min(1),
  stops: z.array(
    z.object({
      stopName: z.string().min(1),
      landmark: z.string().optional(),
      stopType: z.enum(['BOARDING', 'DROPPING', 'BOTH']),
      sequence: z.number().int().min(1),
      offsetMinutesFromStart: z.number().int().min(0),
    })
  ).min(2, 'A route must have at least an origin and a destination stop'),
});

export const CreateTripScheduleSchema = z.object({
  operatorId: z.string().min(1),
  busId: z.string().min(1),
  routeId: z.string().min(1),
  departureTime: z.string().datetime(),
  arrivalTime: z.string().datetime(),
  baseFare: z.coerce.number().min(10),
});
