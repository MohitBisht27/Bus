import { Request, Response, NextFunction } from 'express';
import { Operator } from '../models/Operator';
import { Bus, IBusSeatTemplate } from '../models/Bus';
import { Route } from '../models/Route';
import { AuditService } from '../services/AuditService';

// Helper to generate seat layouts based on bus type and layout configuration
function generateBusSeatLayout(
  layoutType: '2x2' | '2x1' | '1x2' | 'SLEEPER_2x1',
  totalSeats: number,
  busType: string
): IBusSeatTemplate[] {
  const seats: IBusSeatTemplate[] = [];

  if (layoutType === 'SLEEPER_2x1' || busType === 'AC_SLEEPER') {
    // Sleeper bus: Lower and Upper decks
    const seatsPerDeck = Math.ceil(totalSeats / 2);
    const rows = Math.ceil(seatsPerDeck / 3);

    let count = 0;
    // Lower Deck (L1, L2, L3...)
    for (let r = 1; r <= rows && count < seatsPerDeck; r++) {
      // 2 berths on left (col 1, 2)
      count++;
      seats.push({ seatNumber: `L${count}`, deck: 'LOWER', row: r, col: 1, seatType: 'SLEEPER', basePriceFactor: 1.1 });
      if (count < seatsPerDeck) {
        count++;
        seats.push({ seatNumber: `L${count}`, deck: 'LOWER', row: r, col: 2, seatType: 'SLEEPER', basePriceFactor: 1.1 });
      }
      // 1 berth on right (col 4)
      if (count < seatsPerDeck) {
        count++;
        seats.push({ seatNumber: `L${count}`, deck: 'LOWER', row: r, col: 4, seatType: 'SLEEPER', basePriceFactor: 1.15 });
      }
    }

    // Upper Deck (U1, U2, U3...)
    let upperCount = 0;
    for (let r = 1; r <= rows && seats.length < totalSeats; r++) {
      upperCount++;
      seats.push({ seatNumber: `U${upperCount}`, deck: 'UPPER', row: r, col: 1, seatType: 'SLEEPER', basePriceFactor: 1.1 });
      if (seats.length < totalSeats) {
        upperCount++;
        seats.push({ seatNumber: `U${upperCount}`, deck: 'UPPER', row: r, col: 2, seatType: 'SLEEPER', basePriceFactor: 1.1 });
      }
      if (seats.length < totalSeats) {
        upperCount++;
        seats.push({ seatNumber: `U${upperCount}`, deck: 'UPPER', row: r, col: 4, seatType: 'SLEEPER', basePriceFactor: 1.2 });
      }
    }
  } else {
    // Seater bus: standard 2x2 layout
    const rows = Math.ceil(totalSeats / 4);
    const colLetters = ['A', 'B', 'C', 'D'];

    let count = 0;
    for (let r = 1; r <= rows; r++) {
      for (let c = 0; c < 4; c++) {
        if (count < totalSeats) {
          count++;
          const colIndex = c < 2 ? c + 1 : c + 2; // leave aisle between 2 and 4
          seats.push({
            seatNumber: `${r}${colLetters[c]}`,
            deck: 'LOWER',
            row: r,
            col: colIndex,
            seatType: 'SEATER',
            basePriceFactor: 1.0,
          });
        }
      }
    }
  }

  return seats;
}

export class OperatorController {
  // Operators
  static async getOperators(req: Request, res: Response, next: NextFunction) {
    try {
      const operators = await Operator.find().sort({ name: 1 }).lean();
      return res.status(200).json({ success: true, data: operators });
    } catch (err) {
      return next(err);
    }
  }

  static async createOperator(req: Request, res: Response, next: NextFunction) {
    try {
      const operator = await Operator.create(req.body);
      await AuditService.log({
        action: 'OPERATOR_CREATED',
        entityType: 'Operator',
        entityId: operator._id,
        userName: req.user?.name,
        userRole: req.user?.role,
        details: { name: operator.name, code: operator.code },
      });
      return res.status(201).json({ success: true, data: operator });
    } catch (err) {
      return next(err);
    }
  }

  // Buses
  static async getBuses(req: Request, res: Response, next: NextFunction) {
    try {
      const filter: any = {};
      if (req.query.operatorId) {
        filter.operatorId = req.query.operatorId;
      }
      const buses = await Bus.find(filter).populate('operatorId', 'name code').sort({ createdAt: -1 }).lean();
      return res.status(200).json({ success: true, data: buses });
    } catch (err) {
      return next(err);
    }
  }

  static async createBus(req: Request, res: Response, next: NextFunction) {
    try {
      const { operatorId, registrationNumber, model, busModel, busType, layoutType, totalSeats, amenities } = req.body;
      const actualModel = busModel || model || 'Standard Coach';
      const seats = generateBusSeatLayout(layoutType || '2x2', Number(totalSeats), busType);

      const bus = await Bus.create({
        operatorId,
        registrationNumber: registrationNumber.toUpperCase().trim(),
        busModel: actualModel,
        busType,
        layoutType: layoutType || '2x2',
        totalSeats: Number(totalSeats),
        seats,
        amenities: amenities || ['Air Conditioning', 'Charging Port', 'Reading Light', 'Blanket'],
      });

      await AuditService.log({
        action: 'BUS_CREATED',
        entityType: 'Bus',
        entityId: bus._id,
        userName: req.user?.name,
        userRole: req.user?.role,
        details: { registrationNumber: bus.registrationNumber, busType: bus.busType, totalSeats },
      });

      return res.status(201).json({ success: true, data: bus });
    } catch (err) {
      return next(err);
    }
  }

  // Routes
  static async getRoutes(req: Request, res: Response, next: NextFunction) {
    try {
      const routes = await Route.find().sort({ originCity: 1, destinationCity: 1 }).lean();
      return res.status(200).json({ success: true, data: routes });
    } catch (err) {
      return next(err);
    }
  }

  static async createRoute(req: Request, res: Response, next: NextFunction) {
    try {
      const route = await Route.create(req.body);
      await AuditService.log({
        action: 'ROUTE_CREATED',
        entityType: 'Route',
        entityId: route._id,
        userName: req.user?.name,
        userRole: req.user?.role,
        details: { name: route.name, origin: route.originCity, destination: route.destinationCity },
      });
      return res.status(201).json({ success: true, data: route });
    } catch (err) {
      return next(err);
    }
  }

  // Unique cities list for search dropdowns
  static async getCities(req: Request, res: Response, next: NextFunction) {
    try {
      const routes = await Route.find({ status: 'ACTIVE' }).select('originCity destinationCity').lean();
      const originCities = Array.from(new Set(routes.map((r) => r.originCity))).sort();
      const destinationCities = Array.from(new Set(routes.map((r) => r.destinationCity))).sort();

      return res.status(200).json({
        success: true,
        data: {
          origins: originCities,
          destinations: destinationCities,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
}
