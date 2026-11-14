import mongoose, { Document, Schema } from 'mongoose';

export type TripStatus = 'SCHEDULED' | 'BOARDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';

export interface ITripStopSchedule {
  stopName: string;
  time: Date;
  stopType: 'BOARDING' | 'DROPPING' | 'BOTH';
  sequence: number;
}

export interface ITrip extends Document {
  _id: mongoose.Types.ObjectId;
  tripCode: string;
  operatorId: mongoose.Types.ObjectId;
  busId: mongoose.Types.ObjectId;
  routeId: mongoose.Types.ObjectId;
  departureTime: Date;
  arrivalTime: Date;
  baseFare: number;
  status: TripStatus;
  boardingPoints: ITripStopSchedule[];
  droppingPoints: ITripStopSchedule[];
  totalSeats: number;
  availableSeats: number;
  createdAt: Date;
  updatedAt: Date;
}

const TripStopScheduleSchema = new Schema<ITripStopSchedule>(
  {
    stopName: { type: String, required: true },
    time: { type: Date, required: true },
    stopType: { type: String, enum: ['BOARDING', 'DROPPING', 'BOTH'], default: 'BOTH' },
    sequence: { type: Number, required: true },
  },
  { _id: false }
);

const TripSchema = new Schema<ITrip>(
  {
    tripCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    operatorId: { type: Schema.Types.ObjectId, ref: 'Operator', required: true, index: true },
    busId: { type: Schema.Types.ObjectId, ref: 'Bus', required: true, index: true },
    routeId: { type: Schema.Types.ObjectId, ref: 'Route', required: true, index: true },
    departureTime: { type: Date, required: true, index: true },
    arrivalTime: { type: Date, required: true },
    baseFare: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['SCHEDULED', 'BOARDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED',
      index: true,
    },
    boardingPoints: [TripStopScheduleSchema],
    droppingPoints: [TripStopScheduleSchema],
    totalSeats: { type: Number, required: true, min: 1 },
    availableSeats: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

// Compound index for trip search by route and departure date range
TripSchema.index({ routeId: 1, departureTime: 1, status: 1 });

export const Trip = mongoose.model<ITrip>('Trip', TripSchema);
