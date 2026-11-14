import { Request, Response, NextFunction } from 'express';
import { ReportingService } from '../services/ReportingService';
import { Trip } from '../models/Trip';
import { Booking } from '../models/Booking';
import { Bus } from '../models/Bus';
import { Operator } from '../models/Operator';

export class ReportController {
  static async getTripManifest(req: Request, res: Response, next: NextFunction) {
    try {
      const { tripId } = req.params;
      const manifest = await ReportingService.getTripManifest(tripId);
      return res.status(200).json({
        success: true,
        data: manifest,
      });
    } catch (err) {
      return next(err);
    }
  }

  static async getOccupancyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const operatorId = req.query.operatorId as string | undefined;
      const report = await ReportingService.getOccupancySummary(operatorId);
      return res.status(200).json({
        success: true,
        data: report,
      });
    } catch (err) {
      return next(err);
    }
  }

  static async getDashboardOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const filter: any = {};
      if (req.user?.role === 'OPERATOR' && req.user.operatorId) {
        filter.operatorId = req.user.operatorId;
      }

      const [totalOperators, totalBuses, totalTrips, totalBookings, confirmedBookings, revenueAgg] =
        await Promise.all([
          Operator.countDocuments({ status: 'ACTIVE' }),
          Bus.countDocuments({ status: 'ACTIVE' }),
          Trip.countDocuments(filter),
          Booking.countDocuments(),
          Booking.countDocuments({ bookingStatus: 'CONFIRMED' }),
          Booking.aggregate([
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
    } catch (err) {
      return next(err);
    }
  }
}
