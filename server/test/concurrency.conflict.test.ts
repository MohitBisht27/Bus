import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { Trip } from '../src/models/Trip';
import { TripSeat } from '../src/models/TripSeat';
import { Booking } from '../src/models/Booking';

describe('Concurrency Conflict & Negative Case Tests (AC-2)', () => {
  it('AC-2: Two users simultaneously attempting to book the same seat cannot both confirm; exactly one succeeds and one receives 409 Conflict', async () => {
    // 1. Find a trip with available seats
    const trip = await Trip.findOne({ status: 'SCHEDULED' });
    expect(trip).toBeDefined();
    const tripId = trip!._id.toString();

    // 2. Pick a clean available seat on this trip
    const availableSeat = await TripSeat.findOne({
      tripId: trip!._id,
      status: 'AVAILABLE',
    });
    expect(availableSeat).toBeDefined();
    const targetSeat = availableSeat!.seatNumber;

    const boardingStop = trip!.boardingPoints[0].stopName;
    const droppingStop = trip!.droppingPoints[trip!.droppingPoints.length - 1].stopName;

    // 3. User A payload
    const userAPayload = {
      tripId,
      contactName: 'Passenger Alice',
      contactEmail: 'alice@example.com',
      contactPhone: '+91-9111111111',
      passengers: [
        {
          seatNumber: targetSeat,
          passengerName: 'Passenger Alice',
          passengerAge: 28,
          passengerGender: 'FEMALE' as const,
        },
      ],
      boardingStop,
      droppingStop,
    };

    // 4. User B payload for the EXACT SAME seat on the EXACT SAME trip
    const userBPayload = {
      tripId,
      contactName: 'Passenger Bob',
      contactEmail: 'bob@example.com',
      contactPhone: '+91-9222222222',
      passengers: [
        {
          seatNumber: targetSeat,
          passengerName: 'Passenger Bob',
          passengerAge: 32,
          passengerGender: 'MALE' as const,
        },
      ],
      boardingStop,
      droppingStop,
    };

    // 5. Fire BOTH requests simultaneously using Promise.all to simulate concurrent arrival
    const [resA, resB] = await Promise.all([
      request(app).post('/api/bookings').send(userAPayload),
      request(app).post('/api/bookings').send(userBPayload),
    ]);

    const statuses = [resA.status, resB.status].sort();

    // Exactly one must succeed (201) and exactly one must fail with conflict (409)
    expect(statuses).toEqual([201, 409]);

    const successRes = resA.status === 201 ? resA : resB;
    const conflictRes = resA.status === 409 ? resA : resB;

    // Check successful response details
    expect(successRes.body.success).toBe(true);
    expect(successRes.body.data.pnr).toBeDefined();
    expect(successRes.body.data.seats[0].seatNumber).toBe(targetSeat);

    // Check conflict response details
    expect(conflictRes.body.success).toBe(false);
    expect(conflictRes.body.error.code).toBe('SEAT_ALREADY_BOOKED');
    expect(conflictRes.body.error.message).toContain(`Seat ${targetSeat} is no longer available`);

    // 6. Verify database integrity
    const seatInDb = await TripSeat.findOne({ tripId: trip!._id, seatNumber: targetSeat });
    expect(seatInDb?.status).toBe('BOOKED');

    // Verify there is strictly ONE booking for this trip seat in the Bookings collection
    const matchingBookings = await Booking.find({
      tripId: trip!._id,
      'seats.seatNumber': targetSeat,
      bookingStatus: 'CONFIRMED',
    });
    expect(matchingBookings.length).toBe(1);
    expect(matchingBookings[0].pnr).toBe(successRes.body.data.pnr);
  });

  it('Negative Case: should reject booking request with invalid/missing passenger data (Zod Validation)', async () => {
    const invalidPayload = {
      tripId: 'invalid-trip-id',
      // missing contact details
      passengers: [],
    };

    const res = await request(app).post('/api/bookings').send(invalidPayload).expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toBeDefined();
  });

  it('Negative Case: unauthorized access to protected admin route without token should return 401', async () => {
    const res = await request(app).get('/api/audit-logs').expect(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('Negative Case: passenger role accessing admin route should return 403 Forbidden', async () => {
    // Login as Passenger
    const passengerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'passenger@example.com', password: 'Passenger@12345' })
      .expect(200);

    const passengerToken = passengerLogin.body.data.token;

    // Attempt to access admin audit logs
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${passengerToken}`)
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
