import { Request, Response, NextFunction } from 'express';
import { TripService } from '../services/TripService';
import { SeatLockService } from '../services/SeatLockService';
import { Trip } from '../models/Trip';

export class TripController {
  static async search(req: Request, res: Response, next: NextFunction) {
    try {
      const results = await TripService.searchTrips({
        origin: req.query.origin as string,
        destination: req.query.destination as string,
        date: req.query.date as string,
        busType: req.query.busType as string | undefined,
        operatorId: req.query.operatorId as string | undefined,
        minFare: req.query.minFare ? Number(req.query.minFare) : undefined,
        maxFare: req.query.maxFare ? Number(req.query.maxFare) : undefined,
      });

      return res.status(200).json({
        success: true,
        count: results.length,
        data: results,
      });
    } catch (err) {
      return next(err);
    }
  }

  static async getSeatLayout(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const layout = await TripService.getTripSeatLayout(id);
      return res.status(200).json({
        success: true,
        data: layout,
      });
    } catch (err) {
      return next(err);
    }
  }

  static async lockSeats(req: Request, res: Response, next: NextFunction) {
    try {
      const { tripId, seatNumbers, passengerGender } = req.body;
      const userIdOrSession = req.user?.userId || req.headers['x-session-id']?.toString() || 'guest-session';

      const lockedSeats = await SeatLockService.lockSeats({
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
    } catch (err) {
      return next(err);
    }
  }

  static async releaseSeats(req: Request, res: Response, next: NextFunction) {
    try {
      const { tripId, seatNumbers } = req.body;
      const userIdOrSession = req.user?.userId || req.headers['x-session-id']?.toString() || 'guest-session';

      await SeatLockService.releaseSeats(tripId, seatNumbers, userIdOrSession);

      return res.status(200).json({
        success: true,
        message: 'Seat locks released',
      });
    } catch (err) {
      return next(err);
    }
  }

  static async createTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const { operatorId, busId, routeId, departureTime, arrivalTime, baseFare } = req.body;
      const trip = await TripService.createTrip({
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
    } catch (err) {
      return next(err);
    }
  }

  static async getAllTrips(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const filter: any = {};
      if (req.user?.role === 'OPERATOR' && req.user.operatorId) {
        filter.operatorId = req.user.operatorId;
      }

      const [trips, total] = await Promise.all([
        Trip.find(filter)
          .populate('operatorId', 'name code')
          .populate('busId', 'registrationNumber busModel busType totalSeats')
          .populate('routeId', 'name originCity destinationCity')
          .sort({ departureTime: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Trip.countDocuments(filter),
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
    } catch (err) {
      return next(err);
    }
  }
}
