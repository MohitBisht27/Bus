import mongoose, { Document, Schema } from 'mongoose';

export type BusType = 'AC_SLEEPER' | 'AC_SEATER' | 'NON_AC_SEATER' | 'VOLVO_MULTI_AXLE';
export type DeckType = 'LOWER' | 'UPPER';
export type SeatType = 'SEATER' | 'SLEEPER';

export interface IBusSeatTemplate {
  seatNumber: string;
  deck: DeckType;
  row: number;
  col: number;
  seatType: SeatType;
  basePriceFactor?: number;
}

export interface IBus {
  _id: mongoose.Types.ObjectId;
  operatorId: mongoose.Types.ObjectId;
  registrationNumber: string;
  busModel: string;
  busType: BusType;
  totalSeats: number;
  layoutType: '2x2' | '2x1' | '1x2' | 'SLEEPER_2x1';
  seats: IBusSeatTemplate[];
  amenities: string[];
  status: 'ACTIVE' | 'MAINTENANCE';
  createdAt: Date;
  updatedAt: Date;
}

const BusSeatTemplateSchema = new Schema<IBusSeatTemplate>(
  {
    seatNumber: { type: String, required: true },
    deck: { type: String, enum: ['LOWER', 'UPPER'], default: 'LOWER' },
    row: { type: Number, required: true },
    col: { type: Number, required: true },
    seatType: { type: String, enum: ['SEATER', 'SLEEPER'], default: 'SEATER' },
    basePriceFactor: { type: Number, default: 1.0 },
  },
  { _id: false }
);

const BusSchema = new Schema<IBus>(
  {
    operatorId: { type: Schema.Types.ObjectId, ref: 'Operator', required: true, index: true },
    registrationNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    busModel: { type: String, required: true, trim: true },
    busType: {
      type: String,
      enum: ['AC_SLEEPER', 'AC_SEATER', 'NON_AC_SEATER', 'VOLVO_MULTI_AXLE'],
      required: true,
      index: true,
    },
    totalSeats: { type: Number, required: true, min: 1 },
    layoutType: {
      type: String,
      enum: ['2x2', '2x1', '1x2', 'SLEEPER_2x1'],
      default: '2x2',
    },
    seats: [BusSeatTemplateSchema],
    amenities: [{ type: String }],
    status: { type: String, enum: ['ACTIVE', 'MAINTENANCE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

export const Bus = mongoose.model<IBus>('Bus', BusSchema);
