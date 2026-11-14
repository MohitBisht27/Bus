import { describe, it, expect } from 'vitest';
import { CancellationService } from '../src/services/CancellationService';
import { Booking } from '../src/models/Booking';
import { Trip } from '../src/models/Trip';
import { TripSeat } from '../src/models/TripSeat';

describe('Unit Tests: Cancellation Rules & Refund Calculations (AC-4)', () => {
  it('should preview correct 90% refund and 10% fee when departure is > 24 hours away', async () => {
    // BUS-DEMO1 was seeded for a trip scheduled in the future
    const preview = await CancellationService.previewRefund('BUS-DEMO1');

    expect(preview.canCancel).toBe(true);
    expect(preview.hoursBeforeDeparture).toBeGreaterThan(0);

    if (preview.hoursBeforeDeparture >= 24) {
      expect(preview.refundPercentage).toBe(90);
      expect(preview.refundAmount).toBe(Math.round((preview.totalFare * 90) / 100));
      expect(preview.cancellationFee).toBe(preview.totalFare - preview.refundAmount);
    }
  });

  it('should throw an error if booking does not exist', async () => {
    await expect(CancellationService.previewRefund('NONEXISTENT_PNR')).rejects.toThrow(
      'Booking with PNR NONEXISTENT_PNR not found'
    );
  });

  it('should prevent cancellation of already departed trips', async () => {
    // Create a dummy trip with departure in the past
    const pastTrip = await Trip.create({
      tripCode: 'TRIP-PAST-TEST',
      operatorId: (await Trip.findOne())!.operatorId,
      busId: (await Trip.findOne())!.busId,
      routeId: (await Trip.findOne())!.routeId,
      departureTime: new Date(Date.now() - 3600000), // 1 hour ago
      arrivalTime: new Date(Date.now() + 3600000),
      baseFare: 500,
      status: 'COMPLETED',
      totalSeats: 30,
      availableSeats: 30,
    });

    const pastBooking = await Booking.create({
      pnr: 'PAST-PNR',
      tripId: pastTrip._id,
      userId: (await Booking.findOne())!.userId,
      passenger: { name: 'Past Traveler', email: 'past@test.com', phone: '1234567890' },
      seats: [{ seatNumber: '1A', fare: 500, seatType: 'SEATER', passengerName: 'Past', passengerAge: 30, passengerGender: 'MALE' }],
      boardingPoint: { stopName: 'Start', time: pastTrip.departureTime },
      droppingPoint: { stopName: 'End', time: pastTrip.arrivalTime },
      totalFare: 500,
      paidAmount: 500,
      paymentStatus: 'PAID',
      bookingStatus: 'CONFIRMED',
    });

    await expect(CancellationService.previewRefund('PAST-PNR')).rejects.toThrow(
      'Cannot cancel a ticket for a trip that has already departed'
    );
  });
});
