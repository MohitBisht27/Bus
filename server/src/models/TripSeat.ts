import mongoose, { Document, Schema } from 'mongoose';

export type SeatStatus = 'AVAILABLE' | 'LOCKED' | 'BOOKED';

export interface ITripSeat extends Document {
  _id: mongoose.Types.ObjectId;
  tripId: mongoose.Types.ObjectId;
  seatNumber: string;
  deck: 'LOWER' | 'UPPER';
  row: number;
  col: number;
  seatType: 'SEATER' | 'SLEEPER';
  price: number;
  status: SeatStatus;
  lockedBy?: mongoose.Types.ObjectId | string;
  lockedAt?: Date;
  lockExpiresAt?: Date;
  bookingId?: mongoose.Types.ObjectId;
  passengerGender?: 'MALE' | 'FEMALE' | 'OTHER';
  createdAt: Date;
  updatedAt: Date;
}

const TripSeatSchema = new Schema<ITripSeat>(
  {
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    seatNumber: { type: String, required: true, trim: true },
    deck: { type: String, enum: ['LOWER', 'UPPER'], default: 'LOWER' },
    row: { type: Number, required: true },
    col: { type: Number, required: true },
    seatType: { type: String, enum: ['SEATER', 'SLEEPER'], default: 'SEATER' },
    price: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['AVAILABLE', 'LOCKED', 'BOOKED'],
      default: 'AVAILABLE',
      index: true,
    },
    lockedBy: { type: Schema.Types.Mixed, default: null },
    lockedAt: { type: Date, default: null },
    lockExpiresAt: { type: Date, default: null, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', default: null },
    passengerGender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], default: null },
  },
  { timestamps: true }
);

// CRITICAL UNIQUE CONSTRAINT: Prevents duplicate seat allocation for the same trip at database level
TripSeatSchema.index({ tripId: 1, seatNumber: 1 }, { unique: true });

export const TripSeat = mongoose.model<ITripSeat>('TripSeat', TripSeatSchema);
