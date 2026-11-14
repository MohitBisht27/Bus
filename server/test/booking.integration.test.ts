import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { Trip } from '../src/models/Trip';
import { Booking } from '../src/models/Booking';
import { TripSeat } from '../src/models/TripSeat';

describe('Integration Tests: End-to-End Booking Lifecycle', () => {
  let createdPnr: string;
  let testTripId: string;
  let targetSeatNumber = 'L10';

  // AC-1: A passenger can search a valid trip and book an available seat
  it('AC-1: should search for a valid trip and book an available seat', async () => {
    // 1. Search trips for tomorrow so departure is guaranteed in the future
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const searchRes = await request(app)
      .get(`/api/trips/search?origin=Bangalore&destination=Chennai&date=${tomorrowStr}`)
      .expect(200);

    expect(searchRes.body.success).toBe(true);
    expect(searchRes.body.data.length).toBeGreaterThan(0);

    const trip = searchRes.body.data[0];
    testTripId = trip._id;
    expect(trip.availableSeats).toBeGreaterThan(0);

    // 2. Fetch seat layout
    const seatRes = await request(app)
      .get(`/api/trips/${testTripId}/seats`)
      .expect(200);

    expect(seatRes.body.success).toBe(true);
    expect(seatRes.body.data.seats.length).toBeGreaterThan(0);

    // Pick an available seat
    const availableSeat = seatRes.body.data.seats.find((s: any) => s.status === 'AVAILABLE');
    expect(availableSeat).toBeDefined();
    targetSeatNumber = availableSeat.seatNumber;

    // 3. Confirm booking
    const bookingRes = await request(app)
      .post('/api/bookings')
      .send({
        tripId: testTripId,
        contactName: 'Sneha Patel',
        contactEmail: 'sneha@example.com',
        contactPhone: '+91-9988776655',
        passengers: [
          {
            seatNumber: targetSeatNumber,
            passengerName: 'Sneha Patel',
            passengerAge: 26,
            passengerGender: 'FEMALE',
          },
        ],
        boardingStop: trip.boardingPoints[0].stopName,
        droppingStop: trip.droppingPoints[trip.droppingPoints.length - 1].stopName,
      })
      .expect(201);

    expect(bookingRes.body.success).toBe(true);
    expect(bookingRes.body.data.pnr).toBeDefined();
    expect(bookingRes.body.data.bookingStatus).toBe('CONFIRMED');
    expect(bookingRes.body.data.seats[0].seatNumber).toBe(targetSeatNumber);

    createdPnr = bookingRes.body.data.pnr;
  });

  // AC-3: The PNR includes correct passenger, route, date and seat details
  it('AC-3: should verify PNR details include correct passenger, route, date and seat details', async () => {
    expect(createdPnr).toBeDefined();

    const pnrRes = await request(app)
      .get(`/api/bookings/pnr/${createdPnr}`)
      .expect(200);

    expect(pnrRes.body.success).toBe(true);
    const booking = pnrRes.body.data;

    expect(booking.pnr).toBe(createdPnr);
    expect(booking.passenger.name).toBe('Sneha Patel');
    expect(booking.passenger.email).toBe('sneha@example.com');
    expect(booking.seats[0].seatNumber).toBe(targetSeatNumber);
    expect(booking.seats[0].passengerGender).toBe('FEMALE');
    expect(booking.boardingPoint.stopName).toBeDefined();
    expect(booking.droppingPoint.stopName).toBeDefined();
    expect(booking.tripId.routeId.originCity).toBe('Bangalore');
    expect(booking.tripId.routeId.destinationCity).toBe('Chennai');
  });

  // AC-4: Cancellation changes seat availability and refund status according to the rule
  it('AC-4: should cancel booking, compute refund, set status to CANCELLED, and free the seat to AVAILABLE', async () => {
    expect(createdPnr).toBeDefined();

    // Verify seat is currently BOOKED
    const seatBefore = await TripSeat.findOne({ tripId: testTripId, seatNumber: targetSeatNumber });
    expect(seatBefore?.status).toBe('BOOKED');

    const tripBefore = await Trip.findById(testTripId);
    const availBefore = tripBefore!.availableSeats;

    // Cancel ticket
    const cancelRes = await request(app)
      .post(`/api/bookings/pnr/${createdPnr}/cancel`)
      .send({ reason: 'Plan changed' })
      .expect(200);

    expect(cancelRes.body.success).toBe(true);
    expect(cancelRes.body.data.bookingStatus).toBe('CANCELLED');
    expect(cancelRes.body.data.cancellationDetails.refundStatus).toBe('PROCESSED');
    expect(cancelRes.body.data.cancellationDetails.refundAmount).toBeGreaterThanOrEqual(0);

    // Verify seat status reverted to AVAILABLE
    const seatAfter = await TripSeat.findOne({ tripId: testTripId, seatNumber: targetSeatNumber });
    expect(seatAfter?.status).toBe('AVAILABLE');
    expect(seatAfter?.bookingId).toBeNull();

    // Verify trip availableSeats counter incremented
    const tripAfter = await Trip.findById(testTripId);
    expect(tripAfter!.availableSeats).toBe(availBefore + 1);
  });

  // AC-5: Operator manifest and occupancy summaries reconcile with confirmed tickets
  it('AC-5: should reconcile operator manifest and occupancy reports with confirmed bookings', async () => {
    // Login as operator to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'operator@krl.com', password: 'Operator@12345' })
      .expect(200);

    const token = loginRes.body.data.token;

    // Fetch manifest for test trip
    const manifestRes = await request(app)
      .get(`/api/reports/trips/${testTripId}/manifest`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(manifestRes.body.success).toBe(true);
    const { summary, passengers } = manifestRes.body.data;

    // Manifest counts reconcile mathematically
    expect(summary.totalSeats).toBeGreaterThan(0);
    expect(summary.totalSeats).toBe(summary.confirmedSeats + summary.availableSeats);

    // Occupancy percentage calculation is exact
    const expectedRate = Math.round((summary.confirmedSeats / summary.totalSeats) * 100);
    expect(summary.occupancyPercentage).toBe(expectedRate);

    // Fetch occupancy summary across fleet
    const occRes = await request(app)
      .get('/api/reports/occupancy')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(occRes.body.success).toBe(true);
    expect(occRes.body.data.overview.totalTrips).toBeGreaterThan(0);
    expect(occRes.body.data.overview.totalSeatsBooked).toBeGreaterThanOrEqual(0);
  });
});
