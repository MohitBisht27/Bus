import mongoose, { Document, Schema } from 'mongoose';

export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type PaymentStatus = 'PAID' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

export interface IBookedSeatInfo {
  seatNumber: string;
  fare: number;
  seatType: string;
  passengerName: string;
  passengerAge: number;
  passengerGender: 'MALE' | 'FEMALE' | 'OTHER';
}

export interface ICancellationDetails {
  cancelledAt: Date;
  refundAmount: number;
  cancellationFee: number;
  refundStatus: 'PENDING' | 'PROCESSED';
  reason?: string;
  cancelledBy?: mongoose.Types.ObjectId | string;
}

export interface IBooking extends Document {
  _id: mongoose.Types.ObjectId;
  pnr: string;
  tripId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  passenger: {
    name: string;
    email: string;
    phone: string;
  };
  seats: IBookedSeatInfo[];
  boardingPoint: {
    stopName: string;
    time: Date;
  };
  droppingPoint: {
    stopName: string;
    time: Date;
  };
  totalFare: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  checkedIn: boolean;
  checkedInAt?: Date;
  cancellationDetails?: ICancellationDetails;
  createdAt: Date;
  updatedAt: Date;
}

const BookedSeatInfoSchema = new Schema<IBookedSeatInfo>(
  {
    seatNumber: { type: String, required: true },
    fare: { type: Number, required: true },
    seatType: { type: String, default: 'SEATER' },
    passengerName: { type: String, required: true },
    passengerAge: { type: Number, required: true },
    passengerGender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], required: true },
  },
  { _id: false }
);

const CancellationDetailsSchema = new Schema<ICancellationDetails>(
  {
    cancelledAt: { type: Date, required: true },
    refundAmount: { type: Number, required: true },
    cancellationFee: { type: Number, required: true },
    refundStatus: { type: String, enum: ['PENDING', 'PROCESSED'], default: 'PROCESSED' },
    reason: { type: String },
    cancelledBy: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const BookingSchema = new Schema<IBooking>(
  {
    pnr: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    passenger: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
    },
    seats: [BookedSeatInfoSchema],
    boardingPoint: {
      stopName: { type: String, required: true },
      time: { type: Date, required: true },
    },
    droppingPoint: {
      stopName: { type: String, required: true },
      time: { type: Date, required: true },
    },
    totalFare: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'REFUNDED', 'PARTIALLY_REFUNDED'],
      default: 'PAID',
    },
    bookingStatus: {
      type: String,
      enum: ['CONFIRMED', 'CANCELLED', 'COMPLETED'],
      default: 'CONFIRMED',
      index: true,
    },
    checkedIn: { type: Boolean, default: false },
    checkedInAt: { type: Date },
    cancellationDetails: { type: CancellationDetailsSchema, default: null },
  },
  { timestamps: true }
);

// Compound indexes for user history and trip manifests
BookingSchema.index({ userId: 1, createdAt: -1 });
BookingSchema.index({ tripId: 1, bookingStatus: 1 });

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);
