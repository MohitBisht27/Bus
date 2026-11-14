"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Booking = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const BookedSeatInfoSchema = new mongoose_1.Schema({
    seatNumber: { type: String, required: true },
    fare: { type: Number, required: true },
    seatType: { type: String, default: 'SEATER' },
    passengerName: { type: String, required: true },
    passengerAge: { type: Number, required: true },
    passengerGender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], required: true },
}, { _id: false });
const CancellationDetailsSchema = new mongoose_1.Schema({
    cancelledAt: { type: Date, required: true },
    refundAmount: { type: Number, required: true },
    cancellationFee: { type: Number, required: true },
    refundStatus: { type: String, enum: ['PENDING', 'PROCESSED'], default: 'PROCESSED' },
    reason: { type: String },
    cancelledBy: { type: mongoose_1.Schema.Types.Mixed },
}, { _id: false });
const BookingSchema = new mongoose_1.Schema({
    pnr: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    tripId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
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
}, { timestamps: true });
// Compound indexes for user history and trip manifests
BookingSchema.index({ userId: 1, createdAt: -1 });
BookingSchema.index({ tripId: 1, bookingStatus: 1 });
exports.Booking = mongoose_1.default.model('Booking', BookingSchema);
