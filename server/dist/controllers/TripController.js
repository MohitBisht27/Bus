"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripController = void 0;
const TripService_1 = require("../services/TripService");
const SeatLockService_1 = require("../services/SeatLockService");
const Trip_1 = require("../models/Trip");
class TripController {
    static async search(req, res, next) {
        try {
            const results = await TripService_1.TripService.searchTrips({
                origin: req.query.origin,
                destination: req.query.destination,
                date: req.query.date,
                busType: req.query.busType,
                operatorId: req.query.operatorId,
                minFare: req.query.minFare ? Number(req.query.minFare) : undefined,
                maxFare: req.query.maxFare ? Number(req.query.maxFare) : undefined,
            });
            return res.status(200).json({
                success: true,
                count: results.length,
                data: results,
            });
        }
        catch (err) {
            return next(err);
        }
    }
    static async getSeatLayout(req, res, next) {
        try {
            const { id } = req.params;
            const layout = await TripService_1.TripService.getTripSeatLayout(id);
            return res.status(200).json({
                success: true,
                data: layout,
            });
        }
        catch (err) {
            return next(err);
        }
    }
    static async lockSeats(req, res, next) {
        try {
            const { tripId, seatNumbers, passengerGender } = req.body;
            const userIdOrSession = req.user?.userId || req.headers['x-session-id']?.toString() || 'guest-session';
            const lockedSeats = await SeatLockService_1.SeatLockService.lockSeats({
                tripId,
                seatNumbers,
                userIdOrSession,
                passengerGender,
                actorName: req.user?.name,
                actorRole: req.user?.role,
            });
            return res.status(200).json({
                success: true,
                message: `Successfully locked ${lockedSeats.length} seat(s) for 10 minutes`,
                data: {
                    lockedSeats: lockedSeats.map((s) => ({
                        seatNumber: s.seatNumber,
                        price: s.price,
                        lockExpiresAt: s.lockExpiresAt,
                    })),
                },
            });
        }
        catch (err) {
            return next(err);
        }
    }
    static async releaseSeats(req, res, next) {
        try {
            const { tripId, seatNumbers } = req.body;
            const userIdOrSession = req.user?.userId || req.headers['x-session-id']?.toString() || 'guest-session';
            await SeatLockService_1.SeatLockService.releaseSeats(tripId, seatNumbers, userIdOrSession);
            return res.status(200).json({
                success: true,
                message: 'Seat locks released',
            });
        }
        catch (err) {
            return next(err);
        }
    }
    static async createTrip(req, res, next) {
        try {
            const { operatorId, busId, routeId, departureTime, arrivalTime, baseFare } = req.body;
            const trip = await TripService_1.TripService.createTrip({
                operatorId,
                busId,
                routeId,
                departureTime: new Date(departureTime),
                arrivalTime: new Date(arrivalTime),
                baseFare: Number(baseFare),
            });
            return res.status(201).json({
                success: true,
                data: trip,
            });
        }
        catch (err) {
            return next(err);
        }
    }
    static async getAllTrips(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const skip = (page - 1) * limit;
            const filter = {};
            if (req.user?.role === 'OPERATOR' && req.user.operatorId) {
                filter.operatorId = req.user.operatorId;
            }
            const [trips, total] = await Promise.all([
                Trip_1.Trip.find(filter)
                    .populate('operatorId', 'name code')
                    .populate('busId', 'registrationNumber busModel busType totalSeats')
                    .populate('routeId', 'name originCity destinationCity')
                    .sort({ departureTime: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Trip_1.Trip.countDocuments(filter),
            ]);
            return res.status(200).json({
                success: true,
                data: trips,
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
}
exports.TripController = TripController;
