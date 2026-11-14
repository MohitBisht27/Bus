"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingController = void 0;
const BookingService_1 = require("../services/BookingService");
const CancellationService_1 = require("../services/CancellationService");
const Booking_1 = require("../models/Booking");
class BookingController {
    static async createBooking(req, res, next) {
        try {
            const { tripId, contactName, contactEmail, contactPhone, passengers, boardingStop, droppingStop, idempotencyKey, } = req.body;
            const booking = await BookingService_1.BookingService.createBooking({
                tripId,
                userId: req.user?.userId,
                contactName,
                contactEmail,
                contactPhone,
                passengers,
                boardingStop,
                droppingStop,
                idempotencyKey,
                actorName: req.user?.name || contactName,
                actorRole: req.user?.role || 'PASSENGER',
            });
            return res.status(201).json({
                success: true,
                message: 'Booking successfully confirmed!',
                data: booking,
            });
        }
        catch (err) {
            return next(err);
        }
    }
    static async getByPNR(req, res, next) {
        try {
            const { pnr } = req.params;
            const booking = await BookingService_1.BookingService.getBookingByPNR(pnr);
            return res.status(200).json({
                success: true,
                data: booking,
            });
        }
        catch (err) {
            return next(err);
        }
    }
    static async getUserBookings(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
            }
            // If user is Admin or Operator without filter, allow listing all bookings or filtered by user
            const bookings = await BookingService_1.BookingService.getUserBookings(req.user.userId);
            return res.status(200).json({
                success: true,
                count: bookings.length,
                data: bookings,
            });
        }
        catch (err) {
            return next(err);
        }
    }
    static async getAllBookings(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const skip = (page - 1) * limit;
            const filter = {};
            if (req.query.status) {
                filter.bookingStatus = req.query.status;
            }
            const [bookings, total] = await Promise.all([
                Booking_1.Booking.find(filter)
                    .populate({
                    path: 'tripId',
                    populate: [
                        { path: 'operatorId', select: 'name code' },
                        { path: 'routeId', select: 'name originCity destinationCity' },
                    ],
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Booking_1.Booking.countDocuments(filter),
            ]);
            return res.status(200).json({
                success: true,
                data: bookings,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            });
        }
        catch (err) {
            return next(err);
        }
    }
    static async previewCancellation(req, res, next) {
        try {
            const { pnr } = req.params;
            const preview = await CancellationService_1.CancellationService.previewRefund(pnr);
            return res.status(200).json({
                success: true,
                data: preview,
            });
        }
        catch (err) {
            return next(err);
        }
    }
    static async cancelBooking(req, res, next) {
        try {
            const { pnr } = req.params;
            const { reason } = req.body;
            const cancelledBooking = await CancellationService_1.CancellationService.cancelBooking({
                pnr,
                reason,
                userId: req.user?.userId,
                userName: req.user?.name,
                userRole: req.user?.role,
            });
            return res.status(200).json({
                success: true,
                message: 'Ticket successfully cancelled and refund initiated',
                data: cancelledBooking,
            });
        }
        catch (err) {
            return next(err);
        }
    }
    static async checkInPassenger(req, res, next) {
        try {
            const { pnr } = req.params;
            const staffName = req.user?.name || 'Staff Member';
            const updatedBooking = await BookingService_1.BookingService.checkInPassenger(pnr, staffName);
            return res.status(200).json({
                success: true,
                message: `Passenger for PNR ${pnr} marked as checked in`,
                data: updatedBooking,
            });
        }
        catch (err) {
            return next(err);
        }
    }
}
exports.BookingController = BookingController;
