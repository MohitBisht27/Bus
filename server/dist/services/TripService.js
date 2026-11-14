"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Trip_1 = require("../models/Trip");
const TripSeat_1 = require("../models/TripSeat");
const Route_1 = require("../models/Route");
const Bus_1 = require("../models/Bus");
const SeatLockService_1 = require("./SeatLockService");
class TripService {
    /**
     * Search available trips by origin, destination and travel date with optional filters
     */
    static async searchTrips(params) {
        const { origin, destination, date, busType, operatorId, minFare, maxFare } = params;
        // Purge any expired locks globally
        await SeatLockService_1.SeatLockService.releaseExpiredLocks();
        // Find routes connecting origin and destination (case-insensitive)
        const routeRegexOrigin = new RegExp(`^${origin.trim()}$`, 'i');
        const routeRegexDest = new RegExp(`^${destination.trim()}$`, 'i');
        const routes = await Route_1.Route.find({
            originCity: routeRegexOrigin,
            destinationCity: routeRegexDest,
            status: 'ACTIVE',
        }).select('_id name originCity destinationCity totalDistanceKm estimatedDurationMinutes');
        if (!routes || routes.length === 0) {
            return [];
        }
        const routeIds = routes.map((r) => r._id);
        // Parse date window for travel date (00:00:00 to 23:59:59)
        const [year, month, day] = date.split('-').map(Number);
        const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
        const tripQuery = {
            routeId: { $in: routeIds },
            departureTime: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['SCHEDULED', 'BOARDING'] },
        };
        if (operatorId) {
            tripQuery.operatorId = new mongoose_1.default.Types.ObjectId(operatorId);
        }
        if (minFare !== undefined || maxFare !== undefined) {
            tripQuery.baseFare = {};
            if (minFare !== undefined)
                tripQuery.baseFare.$gte = minFare;
            if (maxFare !== undefined)
                tripQuery.baseFare.$lte = maxFare;
        }
        let trips = await Trip_1.Trip.find(tripQuery)
            .populate('operatorId', 'name code contactPhone rating')
            .populate('busId', 'registrationNumber busModel busType totalSeats layoutType amenities')
            .populate('routeId', 'name originCity destinationCity totalDistanceKm estimatedDurationMinutes')
            .sort({ departureTime: 1 })
            .lean();
        if (busType) {
            trips = trips.filter((t) => t.busId?.busType === busType);
        }
        // Transform and compute real-time available seats and duration
        return trips.map((t) => {
            const departure = new Date(t.departureTime);
            const arrival = new Date(t.arrivalTime);
            const durationMs = arrival.getTime() - departure.getTime();
            const hours = Math.floor(durationMs / (1000 * 60 * 60));
            const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
            return {
                _id: t._id,
                tripCode: t.tripCode,
                operator: t.operatorId,
                bus: t.busId,
                route: t.routeId,
                departureTime: t.departureTime,
                arrivalTime: t.arrivalTime,
                duration: `${hours}h ${minutes}m`,
                baseFare: t.baseFare,
                totalSeats: t.totalSeats,
                availableSeats: t.availableSeats,
                boardingPoints: t.boardingPoints,
                droppingPoints: t.droppingPoints,
                status: t.status,
            };
        });
    }
    /**
     * Get seat layout and live seat statuses for a specific trip
     */
    static async getTripSeatLayout(tripId) {
        const trip = await Trip_1.Trip.findById(tripId)
            .populate('busId')
            .populate('operatorId', 'name code rating')
            .populate('routeId', 'name originCity destinationCity');
        if (!trip) {
            const error = new Error('Trip not found');
            error.statusCode = 404;
            throw error;
        }
        // Purge expired locks for this trip
        await SeatLockService_1.SeatLockService.releaseExpiredLocks(tripId);
        // Fetch all seats for this trip
        const seats = await TripSeat_1.TripSeat.find({ tripId: new mongoose_1.default.Types.ObjectId(tripId) })
            .sort({ deck: 1, row: 1, col: 1 })
            .lean();
        const bus = trip.busId;
        return {
            trip: {
                _id: trip._id,
                tripCode: trip.tripCode,
                operator: trip.operatorId,
                route: trip.routeId,
                bus: {
                    _id: bus._id,
                    busModel: bus.busModel || bus.model,
                    busType: bus.busType,
                    layoutType: bus.layoutType,
                    amenities: bus.amenities,
                },
                departureTime: trip.departureTime,
                arrivalTime: trip.arrivalTime,
                baseFare: trip.baseFare,
                boardingPoints: trip.boardingPoints,
                droppingPoints: trip.droppingPoints,
            },
            seats,
        };
    }
    /**
     * Schedule a new trip and generate its seat inventory automatically from bus layout
     */
    static async createTrip(params) {
        const { operatorId, busId, routeId, departureTime, arrivalTime, baseFare } = params;
        const bus = await Bus_1.Bus.findById(busId);
        if (!bus)
            throw new Error('Bus not found');
        const route = await Route_1.Route.findById(routeId);
        if (!route)
            throw new Error('Route not found');
        // Generate boarding and dropping schedules from route stops
        const boardingPoints = [];
        const droppingPoints = [];
        const depDate = new Date(departureTime);
        for (const stop of route.stops) {
            const stopTime = new Date(depDate.getTime() + (stop.offsetMinutesFromStart || 0) * 60 * 1000);
            const scheduleItem = {
                stopName: stop.stopName,
                time: stopTime,
                stopType: stop.stopType,
                sequence: stop.sequence,
            };
            if (stop.stopType === 'BOARDING' || stop.stopType === 'BOTH') {
                boardingPoints.push(scheduleItem);
            }
            if (stop.stopType === 'DROPPING' || stop.stopType === 'BOTH') {
                droppingPoints.push(scheduleItem);
            }
        }
        const tripCode = `TRIP-${Date.now().toString().slice(-6)}`;
        const trip = await Trip_1.Trip.create({
            tripCode,
            operatorId: new mongoose_1.default.Types.ObjectId(operatorId),
            busId: new mongoose_1.default.Types.ObjectId(busId),
            routeId: new mongoose_1.default.Types.ObjectId(routeId),
            departureTime,
            arrivalTime,
            baseFare,
            status: 'SCHEDULED',
            boardingPoints,
            droppingPoints,
            totalSeats: bus.totalSeats,
            availableSeats: bus.totalSeats,
        });
        // Generate individual TripSeat inventory documents
        const seatDocs = bus.seats.map((seat) => ({
            tripId: trip._id,
            seatNumber: seat.seatNumber,
            deck: seat.deck,
            row: seat.row,
            col: seat.col,
            seatType: seat.seatType,
            price: Math.round(baseFare * (seat.basePriceFactor || 1.0)),
            status: 'AVAILABLE',
        }));
        await TripSeat_1.TripSeat.insertMany(seatDocs);
        return trip;
    }
}
exports.TripService = TripService;
