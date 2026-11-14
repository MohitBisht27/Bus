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
exports.Trip = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const TripStopScheduleSchema = new mongoose_1.Schema({
    stopName: { type: String, required: true },
    time: { type: Date, required: true },
    stopType: { type: String, enum: ['BOARDING', 'DROPPING', 'BOTH'], default: 'BOTH' },
    sequence: { type: Number, required: true },
}, { _id: false });
const TripSchema = new mongoose_1.Schema({
    tripCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    operatorId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Operator', required: true, index: true },
    busId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Bus', required: true, index: true },
    routeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Route', required: true, index: true },
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
}, { timestamps: true });
// Compound index for trip search by route and departure date range
TripSchema.index({ routeId: 1, departureTime: 1, status: 1 });
exports.Trip = mongoose_1.default.model('Trip', TripSchema);
