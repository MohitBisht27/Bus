import mongoose from 'mongoose';
import { TripSeat, ITripSeat } from '../models/TripSeat';
import { Trip } from '../models/Trip';
import { AuditService } from './AuditService';

const SEAT_LOCK_DURATION_MINUTES = 10;

export class SeatLockService {
  /**
   * Release expired seat locks across all trips or for a specific trip
   */
  static async releaseExpiredLocks(tripId?: string): Promise<number> {
    const now = new Date();
    const filter: any = {
      status: 'LOCKED',
      lockExpiresAt: { $lt: now },
    };
    if (tripId) {
      filter.tripId = new mongoose.Types.ObjectId(tripId);
    }

    const result = await TripSeat.updateMany(filter, {
      $set: {
        status: 'AVAILABLE',
        lockedBy: null,
        lockedAt: null,
        lockExpiresAt: null,
        passengerGender: null,
      },
    });

    return result.modifiedCount;
  }

  /**
   * Atomically lock a set of seats for a trip.
   * If any seat is already booked or locked by another user, the entire request fails with a 409 conflict,
   * guaranteeing no partial locks or race conditions.
   */
  static async lockSeats(params: {
    tripId: string;
    seatNumbers: string[];
    userIdOrSession: string;
    passengerGender?: 'MALE' | 'FEMALE' | 'OTHER';
    actorName?: string;
    actorRole?: string;
  }): Promise<ITripSeat[]> {
    const { tripId, seatNumbers, userIdOrSession, passengerGender, actorName, actorRole } = params;

    // First purge any expired locks
    await this.releaseExpiredLocks(tripId);

    const tripObjId = new mongoose.Types.ObjectId(tripId);
    const now = new Date();
    const lockExpiresAt = new Date(now.getTime() + SEAT_LOCK_DURATION_MINUTES * 60 * 1000);

    const lockedSeats: ITripSeat[] = [];

    try {
      for (const seatNumber of seatNumbers) {
        // Atomic compare-and-swap update
        const seat = await TripSeat.findOneAndUpdate(
          {
            tripId: tripObjId,
            seatNumber,
            $or: [
              { status: 'AVAILABLE' },
              { lockedBy: userIdOrSession }, // Allow re-locking own seats
              { status: 'LOCKED', lockExpiresAt: { $lt: now } }, // Claim expired lock
            ],
          },
          {
            $set: {
              status: 'LOCKED',
              lockedBy: userIdOrSession,
              lockedAt: now,
              lockExpiresAt,
              passengerGender: passengerGender || null,
            },
          },
          { new: true }
        );

        if (!seat) {
          // Conflict detected! Rollback any seats locked in this batch
          if (lockedSeats.length > 0) {
            await TripSeat.updateMany(
              {
                tripId: tripObjId,
                seatNumber: { $in: lockedSeats.map((s) => s.seatNumber) },
                lockedBy: userIdOrSession,
              },
              {
                $set: {
                  status: 'AVAILABLE',
                  lockedBy: null,
                  lockedAt: null,
                  lockExpiresAt: null,
                },
              }
            );
          }

          const error: any = new Error(
            `Seat ${seatNumber} is no longer available. It was already booked or locked by another passenger.`
          );
          error.statusCode = 409;
          error.code = 'SEAT_LOCK_CONFLICT';
          error.details = { seatNumber, tripId };
          throw error;
        }

        lockedSeats.push(seat);
      }

      await AuditService.log({
        action: 'SEATS_LOCKED',
        entityType: 'TripSeat',
        entityId: tripId,
        userName: actorName,
        userRole: actorRole,
        details: {
          seatNumbers,
          expiresAt: lockExpiresAt,
          userIdOrSession,
        },
      });

      return lockedSeats;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Release seat locks manually (e.g. user navigated away or deselected)
   */
  static async releaseSeats(tripId: string, seatNumbers: string[], userIdOrSession: string) {
    const tripObjId = new mongoose.Types.ObjectId(tripId);
    await TripSeat.updateMany(
      {
        tripId: tripObjId,
        seatNumber: { $in: seatNumbers },
        lockedBy: userIdOrSession,
        status: 'LOCKED',
      },
      {
        $set: {
          status: 'AVAILABLE',
          lockedBy: null,
          lockedAt: null,
          lockExpiresAt: null,
          passengerGender: null,
        },
      }
    );
  }
}
