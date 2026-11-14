import mongoose from 'mongoose';
import { Booking, IBooking } from '../models/Booking';
import { Trip } from '../models/Trip';
import { TripSeat } from '../models/TripSeat';
import { CancellationPolicy, ICancellationTier } from '../models/CancellationPolicy';
import { AuditService } from './AuditService';

export interface RefundCalculationResult {
  totalFare: number;
  hoursBeforeDeparture: number;
  appliedTier: ICancellationTier;
  refundPercentage: number;
  refundAmount: number;
  cancellationFee: number;
  canCancel: boolean;
  policyName: string;
}

export class CancellationService {
  /**
   * Preview the refund amount and fee for a booking prior to executing cancellation
   */
  static async previewRefund(pnr: string): Promise<RefundCalculationResult> {
    const booking = await Booking.findOne({ pnr });
    if (!booking) {
      const error: any = new Error(`Booking with PNR ${pnr} not found`);
      error.statusCode = 404;
      error.code = 'BOOKING_NOT_FOUND';
      throw error;
    }

    if (booking.bookingStatus === 'CANCELLED') {
      const error: any = new Error(`Booking ${pnr} is already cancelled`);
      error.statusCode = 400;
      error.code = 'ALREADY_CANCELLED';
      throw error;
    }

    const trip = await Trip.findById(booking.tripId);
    if (!trip) {
      const error: any = new Error(`Trip for booking ${pnr} not found`);
      error.statusCode = 404;
      error.code = 'TRIP_NOT_FOUND';
      throw error;
    }

    const now = new Date();
    const departureTime = new Date(trip.departureTime);
    const diffMs = departureTime.getTime() - now.getTime();
    const hoursBeforeDeparture = Math.max(0, diffMs / (1000 * 60 * 60));

    if (diffMs <= 0) {
      const error: any = new Error('Cannot cancel a ticket for a trip that has already departed');
      error.statusCode = 400;
      error.code = 'TRIP_ALREADY_DEPARTED';
      throw error;
    }

    // Retrieve active cancellation policy
    let policy = await CancellationPolicy.findOne({ isDefault: true });
    if (!policy) {
      policy = await CancellationPolicy.findOne();
    }

    // Default tiered rules if not seeded in DB
    const tiers: ICancellationTier[] = policy?.tiers || [
      { minHoursBeforeDeparture: 24, maxHoursBeforeDeparture: null, refundPercentage: 90, cancellationFeePercentage: 10, description: 'More than 24h prior: 90% refund' },
      { minHoursBeforeDeparture: 12, maxHoursBeforeDeparture: 24, refundPercentage: 50, cancellationFeePercentage: 50, description: '12-24h prior: 50% refund' },
      { minHoursBeforeDeparture: 0, maxHoursBeforeDeparture: 12, refundPercentage: 0, cancellationFeePercentage: 100, description: 'Within 12h: Non-refundable' },
    ];

    // Find applicable tier
    let appliedTier: ICancellationTier = tiers[tiers.length - 1]; // fallback lowest
    for (const tier of tiers) {
      const meetsMin = hoursBeforeDeparture >= tier.minHoursBeforeDeparture;
      const meetsMax = tier.maxHoursBeforeDeparture === null || hoursBeforeDeparture < tier.maxHoursBeforeDeparture;
      if (meetsMin && meetsMax) {
        appliedTier = tier;
        break;
      }
    }

    const refundPercentage = appliedTier.refundPercentage;
    const refundAmount = Math.round((booking.totalFare * refundPercentage) / 100);
    const cancellationFee = booking.totalFare - refundAmount;

    return {
      totalFare: booking.totalFare,
      hoursBeforeDeparture: Math.round(hoursBeforeDeparture * 10) / 10,
      appliedTier,
      refundPercentage,
      refundAmount,
      cancellationFee,
      canCancel: true,
      policyName: policy?.name || 'Standard Cancellation Policy',
    };
  }

  /**
   * Execute booking cancellation, release seats to AVAILABLE, record refund details and audit trail
   */
  static async cancelBooking(params: {
    pnr: string;
    reason?: string;
    userId?: string;
    userName?: string;
    userRole?: string;
  }): Promise<IBooking> {
    const { pnr, reason, userId, userName, userRole } = params;

    const preview = await this.previewRefund(pnr);
    const booking = await Booking.findOne({ pnr });
    if (!booking) {
      const error: any = new Error(`Booking ${pnr} not found`);
      error.statusCode = 404;
      throw error;
    }

    // State transition
    booking.bookingStatus = 'CANCELLED';
    booking.paymentStatus = preview.refundAmount > 0 ? 'REFUNDED' : 'PAID';
    booking.cancellationDetails = {
      cancelledAt: new Date(),
      refundAmount: preview.refundAmount,
      cancellationFee: preview.cancellationFee,
      refundStatus: 'PROCESSED', // simulated refund status
      reason: reason || 'Passenger requested cancellation',
      cancelledBy: userId || 'PASSENGER',
    };

    await booking.save();

    // Release seats back to AVAILABLE inventory
    const seatNumbers = booking.seats.map((s) => s.seatNumber);
    await TripSeat.updateMany(
      {
        tripId: booking.tripId,
        seatNumber: { $in: seatNumbers },
      },
      {
        $set: {
          status: 'AVAILABLE',
          bookingId: null,
          lockedBy: null,
          lockedAt: null,
          lockExpiresAt: null,
          passengerGender: null,
        },
      }
    );

    // Update cached available seats count on trip
    await Trip.findByIdAndUpdate(booking.tripId, {
      $inc: { availableSeats: seatNumbers.length },
    });

    // Write material business event to audit trail
    await AuditService.log({
      action: 'BOOKING_CANCELLED',
      entityType: 'Booking',
      entityId: booking._id,
      userId,
      userName,
      userRole,
      details: {
        pnr,
        releasedSeats: seatNumbers,
        refundAmount: preview.refundAmount,
        cancellationFee: preview.cancellationFee,
        refundStatus: 'PROCESSED',
        reason,
      },
    });

    return booking;
  }
}
