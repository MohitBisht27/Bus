import mongoose, { Document, Schema } from 'mongoose';

export type StopType = 'BOARDING' | 'DROPPING' | 'BOTH';

export interface IRouteStop {
  stopId?: string;
  stopName: string;
  landmark?: string;
  stopType: StopType;
  sequence: number;
  offsetMinutesFromStart: number;
}

export interface IRoute extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  originCity: string;
  destinationCity: string;
  totalDistanceKm: number;
  estimatedDurationMinutes: number;
  stops: IRouteStop[];
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const RouteStopSchema = new Schema<IRouteStop>(
  {
    stopId: { type: String },
    stopName: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true },
    stopType: { type: String, enum: ['BOARDING', 'DROPPING', 'BOTH'], default: 'BOTH' },
    sequence: { type: Number, required: true },
    offsetMinutesFromStart: { type: Number, default: 0 },
  },
  { _id: false }
);

const RouteSchema = new Schema<IRoute>(
  {
    name: { type: String, required: true, trim: true },
    originCity: { type: String, required: true, trim: true, index: true },
    destinationCity: { type: String, required: true, trim: true, index: true },
    totalDistanceKm: { type: Number, required: true, min: 1 },
    estimatedDurationMinutes: { type: Number, required: true, min: 1 },
    stops: [RouteStopSchema],
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

// Compound index for quick origin-destination search
RouteSchema.index({ originCity: 1, destinationCity: 1, status: 1 });

export const Route = mongoose.model<IRoute>('Route', RouteSchema);
