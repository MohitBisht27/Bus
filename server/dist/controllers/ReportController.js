"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportController = void 0;
const ReportingService_1 = require("../services/ReportingService");
const Trip_1 = require("../models/Trip");
const Booking_1 = require("../models/Booking");
const Bus_1 = require("../models/Bus");
const Operator_1 = require("../models/Operator");
class ReportController {
    static async getTripManifest(req, res, next) {
        try {
            const { tripId } = req.params;
            const manifest = await ReportingService_1.ReportingService.getTripManifest(tripId);
            return res.status(200).json({
                success: true,
                data: manifest,
            });
        }
        catch (err) {
            return next(err);
        }
    }
    static async getOccupancyReport(req, res, next) {
        try {
            const operatorId = req.query.operatorId;
            const report = await ReportingService_1.ReportingService.getOccupancySummary(operatorId);
            return res.status(200).json({
                success: true,
                data: report,
            });
        }
        catch (err) {
            return next(err);
        }
    }
    static async getDashboardOverview(req, res, next) {
        try {
            const filter = {};
            if (req.user?.role === 'OPERATOR' && req.user.operatorId) {
                filter.operatorId = req.user.operatorId;
            }
            const [totalOperators, totalBuses, totalTrips, totalBookings, confirmedBookings, revenueAgg] = await Promise.all([
                Operator_1.Operator.countDocuments({ status: 'ACTIVE' }),
                Bus_1.Bus.countDocuments({ status: 'ACTIVE' }),
                Trip_1.Trip.countDocuments(filter),
                Booking_1.Booking.countDocuments(),
                Booking_1.Booking.countDocuments({ bookingStatus: 'CONFIRMED' }),
                Booking_1.Booking.aggregate([
                    { $match: { bookingStatus: 'CONFIRMED' } },
                    { $group: { _id: null, total: { $sum: '$totalFare' } } },
                ]),
            ]);
            const grossRevenue = revenueAgg[0]?.total || 0;
            return res.status(200).json({
                success: true,
                data: {
                    totalOperators,
                    totalBuses,
                    totalTrips,
                    totalBookings,
                    confirmedBookings,
                    grossRevenue,
                },
            });
        }
        catch (err) {
            return next(err);
        }
    }
}
exports.ReportController = ReportController;
