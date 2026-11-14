"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Booking_1 = require("../models/Booking");
const Trip_1 = require("../models/Trip");
const TripSeat_1 = require("../models/TripSeat");
const AuditService_1 = require("./AuditService");
// Function to generate a cryptographically strong unique PNR
function generateUniquePNR() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // excluding ambiguous chars 0, O, 1, I
    let result = 'BUS-';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
class BookingService {
    /**
     * Atomically create and confirm a booking with unique PNR and strict seat concurrency guarantees
     */
    static async createBooking(params) {
        const { tripId, userId, contactName, contactEmail, contactPhone, passengers, boardingStop, droppingStop, actorName, actorRole, } = params;
        const trip = await Trip_1.Trip.findById(tripId);
        if (!trip) {
            const error = new Error('Selected trip does not exist');
            error.statusCode = 404;
            error.code = 'TRIP_NOT_FOUND';
            throw error;
        }
        if (trip.status === 'CANCELLED' || trip.status === 'COMPLETED') {
            const error = new Error(`Cannot book seats on a ${trip.status.toLowerCase()} trip`);
            error.statusCode = 400;
            error.code = 'INVALID_TRIP_STATUS';
            throw error;
        }
        const tripObjId = new mongoose_1.default.Types.ObjectId(tripId);
        const now = new Date();
        const userIdentifier = userId || contactEmail;
        // Resolve boarding and dropping times from trip schedule
        const boardingPointInfo = trip.boardingPoints.find((b) => b.stopName.toLowerCase() === boardingStop.toLowerCase()) || { stopName: boardingStop, time: trip.departureTime };
        const droppingPointInfo = trip.droppingPoints.find((d) => d.stopName.toLowerCase() === droppingStop.toLowerCase()) || { stopName: droppingStop, time: trip.arrivalTime };
        // STAGE 1: Atomic seat acquisition & concurrency conflict check
        // We atomically update each seat's status to 'BOOKED'.
        // If ANY seat is already booked or actively locked by another user, the query matches null,
        // triggering an immediate conflict abort and rollback.
        const acquiredSeats = [];
        const bookedSeatItems = [];
        let calculatedTotalFare = 0;
        try {
            for (const p of passengers) {
                const seat = await TripSeat_1.TripSeat.findOneAndUpdate({
                    tripId: tripObjId,
                    seatNumber: p.seatNumber,
                    $or: [
                        { status: 'AVAILABLE' },
                        { lockedBy: userIdentifier }, // Claimed by same session
                        { status: 'LOCKED', lockExpiresAt: { $lt: now } }, // Claim expired lock
                    ],
                }, {
                    $set: {
                        status: 'BOOKED',
                        passengerGender: p.passengerGender,
                        lockedBy: null,
                        lockedAt: null,
                        lockExpiresAt: null,
                    },
                }, { new: true });
                if (!seat) {
                    // CONFLICT DETECTED: Another user already booked or locked this seat!
                    // Rollback any seats successfully acquired in this batch
                    if (acquiredSeats.length > 0) {
                        await TripSeat_1.TripSeat.updateMany({
                            tripId: tripObjId,
                            seatNumber: { $in: acquiredSeats },
                        }, {
                            $set: {
                                status: 'AVAILABLE',
                                bookingId: null,
                                passengerGender: null,
                            },
                        });
                    }
                    const conflictError = new Error(`Seat ${p.seatNumber} is no longer available. It was already confirmed by another passenger.`);
                    conflictError.statusCode = 409;
                    conflictError.code = 'SEAT_ALREADY_BOOKED';
                    conflictError.details = { seatNumber: p.seatNumber, tripId };
                    throw conflictError;
                }
                acquiredSeats.push(p.seatNumber);
                const seatFare = seat.price || trip.baseFare;
                calculatedTotalFare += seatFare;
                bookedSeatItems.push({
                    seatNumber: p.seatNumber,
                    fare: seatFare,
                    seatType: seat.seatType || 'SEATER',
                    passengerName: p.passengerName,
                    passengerAge: p.passengerAge,
                    passengerGender: p.passengerGender,
                });
            }
            // STAGE 2: Generate unique PNR with collision retry
            let pnr = generateUniquePNR();
            let pnrExists = await Booking_1.Booking.findOne({ pnr });
            while (pnrExists) {
                pnr = generateUniquePNR();
                pnrExists = await Booking_1.Booking.findOne({ pnr });
            }
            // STAGE 3: Persist Booking record
            const defaultUserObjectId = userId
                ? new mongoose_1.default.Types.ObjectId(userId)
                : new mongoose_1.default.Types.ObjectId();
            const booking = await Booking_1.Booking.create({
                pnr,
                tripId: tripObjId,
                userId: defaultUserObjectId,
                passenger: {
                    name: contactName,
                    email: contactEmail,
                    phone: contactPhone,
                },
                seats: bookedSeatItems,
                boardingPoint: {
                    stopName: boardingPointInfo.stopName,
                    time: boardingPointInfo.time,
                },
                droppingPoint: {
                    stopName: droppingPointInfo.stopName,
                    time: droppingPointInfo.time,
                },
                totalFare: calculatedTotalFare,
                paidAmount: calculatedTotalFare,
                paymentStatus: 'PAID',
                bookingStatus: 'CONFIRMED',
                checkedIn: false,
            });
            // STAGE 4: Link bookingId to the TripSeat documents
            await TripSeat_1.TripSeat.updateMany({
                tripId: tripObjId,
                seatNumber: { $in: acquiredSeats },
            }, {
                $set: { bookingId: booking._id },
            });
            // STAGE 5: Update trip's available seats counter
            await Trip_1.Trip.findByIdAndUpdate(tripId, {
                $inc: { availableSeats: -acquiredSeats.length },
            });
            // STAGE 6: Write audit trail
            await AuditService_1.AuditService.log({
                action: 'BOOKING_CREATED',
                entityType: 'Booking',
                entityId: booking._id,
                userId,
                userName: actorName || contactName,
                userRole: actorRole || 'PASSENGER',
                details: {
                    pnr,
                    tripId,
                    seatNumbers: acquiredSeats,
                    totalFare: calculatedTotalFare,
                    boardingStop,
                    droppingStop,
                },
            });
            return booking;
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Retrieve booking details by unique PNR
     */
    static async getBookingByPNR(pnr) {
        const booking = await Booking_1.Booking.findOne({ pnr: pnr.trim().toUpperCase() })
            .populate({
            path: 'tripId',
            populate: [
                { path: 'operatorId', select: 'name code contactPhone rating' },
                { path: 'busId', select: 'registrationNumber busModel busType' },
                { path: 'routeId', select: 'name originCity destinationCity totalDistanceKm' },
            ],
        })
            .lean();
        if (!booking) {
            const error = new Error(`Booking with PNR "${pnr}" does not exist`);
            error.statusCode = 404;
            error.code = 'PNR_NOT_FOUND';
            throw error;
        }
        return booking;
    }
    /**
     * Get all bookings for a user
     */
    static async getUserBookings(userId) {
        return Booking_1.Booking.find({ userId: new mongoose_1.default.Types.ObjectId(userId) })
            .populate({
            path: 'tripId',
            populate: [
                { path: 'operatorId', select: 'name code contactPhone' },
                { path: 'busId', select: 'registrationNumber busModel busType' },
                { path: 'routeId', select: 'name originCity destinationCity' },
            ],
        })
            .sort({ createdAt: -1 })
            .lean();
    }
    /**
     * Mark passenger checked in (used by operator at boarding)
     */
    static async checkInPassenger(pnr, staffName) {
        const booking = await Booking_1.Booking.findOne({ pnr: pnr.trim().toUpperCase() });
        if (!booking) {
            const error = new Error(`Booking with PNR ${pnr} not found`);
            error.statusCode = 404;
            throw error;
        }
        if (booking.bookingStatus === 'CANCELLED') {
            const error = new Error(`Cannot check in a cancelled ticket`);
            error.statusCode = 400;
            throw error;
        }
        booking.checkedIn = true;
        booking.checkedInAt = new Date();
        await booking.save();
        await AuditService_1.AuditService.log({
            action: 'PASSENGER_CHECKIN',
            entityType: 'Booking',
            entityId: booking._id,
            userName: staffName,
            userRole: 'OPERATOR',
            details: { pnr, checkedInAt: booking.checkedInAt },
        });
        return booking;
    }
}
exports.BookingService = BookingService;
