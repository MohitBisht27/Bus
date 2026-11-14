import mongoose, { Document, Schema } from 'mongoose';

export interface IOperator extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  contactEmail: string;
  contactPhone: string;
  address?: string;
  rating: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const OperatorSchema = new Schema<IOperator>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    contactEmail: { type: String, required: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    rating: { type: Number, default: 4.5, min: 1.0, max: 5.0 },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true },
  },
  { timestamps: true }
);

export const Operator = mongoose.model<IOperator>('Operator', OperatorSchema);
