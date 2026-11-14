"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportingService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Trip_1 = require("../models/Trip");
const Booking_1 = require("../models/Booking");
class ReportingService {
    /**
     * Generates passenger manifest for a specific trip, reconciling 1:1 with confirmed bookings
     */
    static async getTripManifest(tripId) {
        const trip = await Trip_1.Trip.findById(tripId)
            .populate('operatorId', 'name code contactPhone')
            .populate('busId', 'registrationNumber busModel busType totalSeats')
            .populate('routeId', 'name originCity destinationCity')
            .lean();
        if (!trip) {
            const error = new Error('Trip not found');
            error.statusCode = 404;
            throw error;
        }
        // Retrieve all bookings for this trip (confirmed and cancelled)
        const bookings = await Booking_1.Booking.find({ tripId: new mongoose_1.default.Types.ObjectId(tripId) })
            .sort({ 'seats.seatNumber': 1 })
            .lean();
        // Flatten to individual passenger manifest rows
        const manifestRows = [];
        let confirmedCount = 0;
        let checkedInCount = 0;
        let cancelledCount = 0;
        for (const b of bookings) {
            const isConfirmed = b.bookingStatus === 'CONFIRMED';
            if (isConfirmed)
                confirmedCount += b.seats.length;
            if (b.bookingStatus === 'CANCELLED')
                cancelledCount += b.seats.length;
            if (b.checkedIn)
                checkedInCount += b.seats.length;
            for (const seat of b.seats) {
                manifestRows.push({
                    bookingId: b._id,
                    pnr: b.pnr,
                    seatNumber: seat.seatNumber,
                    seatType: seat.seatType,
                    passengerName: seat.passengerName,
                    passengerAge: seat.passengerAge,
                    passengerGender: seat.passengerGender,
                    contactPhone: b.passenger.phone,
                    contactEmail: b.passenger.email,
                    boardingStop: b.boardingPoint.stopName,
                    boardingTime: b.boardingPoint.time,
                    droppingStop: b.droppingPoint.stopName,
                    droppingTime: b.droppingPoint.time,
                    bookingStatus: b.bookingStatus,
                    checkedIn: b.checkedIn,
                    checkedInAt: b.checkedInAt,
                    fare: seat.fare,
                });
            }
        }
        // Sort manifest logically by seat number (e.g. 1A, 1B, 2A...)
        manifestRows.sort((a, b) => a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true }));
        const totalSeats = trip.busId?.totalSeats || trip.totalSeats;
        const occupancyPercentage = totalSeats > 0 ? Math.round((confirmedCount / totalSeats) * 100) : 0;
        return {
            trip: {
                _id: trip._id,
                tripCode: trip.tripCode,
                operator: trip.operatorId,
                bus: trip.busId,
                route: trip.routeId,
                departureTime: trip.departureTime,
                arrivalTime: trip.arrivalTime,
                status: trip.status,
            },
            summary: {
                totalSeats,
                confirmedSeats: confirmedCount,
                availableSeats: Math.max(0, totalSeats - confirmedCount),
                cancelledSeats: cancelledCount,
                checkedInSeats: checkedInCount,
                occupancyPercentage,
            },
            passengers: manifestRows,
        };
    }
    /**
     * System-wide or operator-specific occupancy report across trips
     */
    static async getOccupancySummary(operatorId) {
        const filter = {};
        if (operatorId) {
            filter.operatorId = new mongoose_1.default.Types.ObjectId(operatorId);
        }
        const trips = await Trip_1.Trip.find(filter)
            .populate('operatorId', 'name code')
            .populate('routeId', 'name originCity destinationCity')
            .populate('busId', 'registrationNumber busType totalSeats')
            .sort({ departureTime: -1 })
            .limit(50)
            .lean();
        const tripIds = trips.map((t) => t._id);
        // Aggregate confirmed and cancelled bookings per trip
        const bookingStats = await Booking_1.Booking.aggregate([
            { $match: { tripId: { $in: tripIds } } },
            {
                $group: {
                    _id: '$tripId',
                    totalBookings: { $sum: 1 },
                    confirmedBookings: {
                        $sum: { $cond: [{ $eq: ['$bookingStatus', 'CONFIRMED'] }, 1, 0] },
                    },
                    cancelledBookings: {
                        $sum: { $cond: [{ $eq: ['$bookingStatus', 'CANCELLED'] }, 1, 0] },
                    },
                    confirmedSeats: {
                        $sum: {
                            $cond: [
                                { $eq: ['$bookingStatus', 'CONFIRMED'] },
                                { $size: '$seats' },
                                0,
                            ],
                        },
                    },
                    grossRevenue: {
                        $sum: {
                            $cond: [{ $eq: ['$bookingStatus', 'CONFIRMED'] }, '$totalFare', 0],
                        },
                    },
                    refundedAmount: {
                        $sum: {
                            $cond: [
                                { $eq: ['$bookingStatus', 'CANCELLED'] },
                                { $ifNull: ['$cancellationDetails.refundAmount', 0] },
                                0,
                            ],
                        },
                    },
                },
            },
        ]);
        const statsMap = new Map();
        for (const stat of bookingStats) {
            statsMap.set(stat._id.toString(), stat);
        }
        let overallTotalSeats = 0;
        let overallConfirmedSeats = 0;
        let overallGrossRevenue = 0;
        let overallRefunds = 0;
        const items = trips.map((t) => {
            const stat = statsMap.get(t._id.toString()) || {
                totalBookings: 0,
                confirmedBookings: 0,
                cancelledBookings: 0,
                confirmedSeats: 0,
                grossRevenue: 0,
                refundedAmount: 0,
            };
            const capacity = t.busId?.totalSeats || t.totalSeats;
            const confirmed = stat.confirmedSeats;
            const rate = capacity > 0 ? Math.round((confirmed / capacity) * 100) : 0;
            const netRevenue = stat.grossRevenue;
            overallTotalSeats += capacity;
            overallConfirmedSeats += confirmed;
            overallGrossRevenue += stat.grossRevenue;
            overallRefunds += stat.refundedAmount;
            return {
                tripId: t._id,
                tripCode: t.tripCode,
                operatorName: t.operatorId?.name || 'Unknown',
                routeName: t.routeId?.name || 'Unknown Route',
                busRegistration: t.busId?.registrationNumber,
                departureTime: t.departureTime,
                status: t.status,
                capacity,
                confirmedSeats: confirmed,
                availableSeats: Math.max(0, capacity - confirmed),
                occupancyRate: rate,
                grossRevenue: stat.grossRevenue,
                refundedAmount: stat.refundedAmount,
                netRevenue,
            };
        });
        const averageOccupancy = overallTotalSeats > 0 ? Math.round((overallConfirmedSeats / overallTotalSeats) * 100) : 0;
        return {
            overview: {
                totalTrips: trips.length,
                totalSeatsOffered: overallTotalSeats,
                totalSeatsBooked: overallConfirmedSeats,
                averageOccupancyRate: averageOccupancy,
                totalGrossRevenue: overallGrossRevenue,
                totalRefunds: overallRefunds,
                netRevenue: overallGrossRevenue - overallRefunds,
            },
            trips: items,
        };
    }
}
exports.ReportingService = ReportingService;
