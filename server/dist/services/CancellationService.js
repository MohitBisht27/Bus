"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancellationService = void 0;
const Booking_1 = require("../models/Booking");
const Trip_1 = require("../models/Trip");
const TripSeat_1 = require("../models/TripSeat");
const CancellationPolicy_1 = require("../models/CancellationPolicy");
const AuditService_1 = require("./AuditService");
class CancellationService {
    /**
     * Preview the refund amount and fee for a booking prior to executing cancellation
     */
    static async previewRefund(pnr) {
        const booking = await Booking_1.Booking.findOne({ pnr });
        if (!booking) {
            const error = new Error(`Booking with PNR ${pnr} not found`);
            error.statusCode = 404;
            error.code = 'BOOKING_NOT_FOUND';
            throw error;
        }
        if (booking.bookingStatus === 'CANCELLED') {
            const error = new Error(`Booking ${pnr} is already cancelled`);
            error.statusCode = 400;
            error.code = 'ALREADY_CANCELLED';
            throw error;
        }
        const trip = await Trip_1.Trip.findById(booking.tripId);
        if (!trip) {
            const error = new Error(`Trip for booking ${pnr} not found`);
            error.statusCode = 404;
            error.code = 'TRIP_NOT_FOUND';
            throw error;
        }
        const now = new Date();
        const departureTime = new Date(trip.departureTime);
        const diffMs = departureTime.getTime() - now.getTime();
        const hoursBeforeDeparture = Math.max(0, diffMs / (1000 * 60 * 60));
        if (diffMs <= 0) {
            const error = new Error('Cannot cancel a ticket for a trip that has already departed');
            error.statusCode = 400;
            error.code = 'TRIP_ALREADY_DEPARTED';
            throw error;
        }
        // Retrieve active cancellation policy
        let policy = await CancellationPolicy_1.CancellationPolicy.findOne({ isDefault: true });
        if (!policy) {
            policy = await CancellationPolicy_1.CancellationPolicy.findOne();
        }
        // Default tiered rules if not seeded in DB
        const tiers = policy?.tiers || [
            { minHoursBeforeDeparture: 24, maxHoursBeforeDeparture: null, refundPercentage: 90, cancellationFeePercentage: 10, description: 'More than 24h prior: 90% refund' },
            { minHoursBeforeDeparture: 12, maxHoursBeforeDeparture: 24, refundPercentage: 50, cancellationFeePercentage: 50, description: '12-24h prior: 50% refund' },
            { minHoursBeforeDeparture: 0, maxHoursBeforeDeparture: 12, refundPercentage: 0, cancellationFeePercentage: 100, description: 'Within 12h: Non-refundable' },
        ];
        // Find applicable tier
        let appliedTier = tiers[tiers.length - 1]; // fallback lowest
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
    static async cancelBooking(params) {
        const { pnr, reason, userId, userName, userRole } = params;
        const preview = await this.previewRefund(pnr);
        const booking = await Booking_1.Booking.findOne({ pnr });
        if (!booking) {
            const error = new Error(`Booking ${pnr} not found`);
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
        await TripSeat_1.TripSeat.updateMany({
            tripId: booking.tripId,
            seatNumber: { $in: seatNumbers },
        }, {
            $set: {
                status: 'AVAILABLE',
                bookingId: null,
                lockedBy: null,
                lockedAt: null,
                lockExpiresAt: null,
                passengerGender: null,
            },
        });
        // Update cached available seats count on trip
        await Trip_1.Trip.findByIdAndUpdate(booking.tripId, {
            $inc: { availableSeats: seatNumbers.length },
        });
        // Write material business event to audit trail
        await AuditService_1.AuditService.log({
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
exports.CancellationService = CancellationService;
