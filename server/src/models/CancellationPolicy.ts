
import mongoose, { Document, Schema } from 'mongoose';

export interface ICancellationTier {
  minHoursBeforeDeparture: number; // e.g. 24
  maxHoursBeforeDeparture: number | null; // null for no upper limit (e.g. >24 hrs)
  refundPercentage: number; // e.g. 90
  cancellationFeePercentage: number; // e.g. 10
  description?: string;
}

export interface ICancellationPolicy extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  tiers: ICancellationTier[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CancellationTierSchema = new Schema<ICancellationTier>(
  {
    minHoursBeforeDeparture: { type: Number, required: true },
    maxHoursBeforeDeparture: { type: Number, default: null },
    refundPercentage: { type: Number, required: true, min: 0, max: 100 },
    cancellationFeePercentage: { type: Number, required: true, min: 0, max: 100 },
    description: { type: String },
  },
  { _id: false }
);

const CancellationPolicySchema = new Schema<ICancellationPolicy>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    tiers: [CancellationTierSchema],
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const CancellationPolicy = mongoose.model<ICancellationPolicy>(
  'CancellationPolicy',
  CancellationPolicySchema
);
