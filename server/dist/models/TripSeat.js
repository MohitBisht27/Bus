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
exports.TripSeat = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const TripSeatSchema = new mongoose_1.Schema({
    tripId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
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
    lockedBy: { type: mongoose_1.Schema.Types.Mixed, default: null },
    lockedAt: { type: Date, default: null },
    lockExpiresAt: { type: Date, default: null, index: true },
    bookingId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Booking', default: null },
    passengerGender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], default: null },
}, { timestamps: true });
// CRITICAL UNIQUE CONSTRAINT: Prevents duplicate seat allocation for the same trip at database level
TripSeatSchema.index({ tripId: 1, seatNumber: 1 }, { unique: true });
exports.TripSeat = mongoose_1.default.model('TripSeat', TripSeatSchema);
