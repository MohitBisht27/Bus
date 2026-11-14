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
exports.Bus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const BusSeatTemplateSchema = new mongoose_1.Schema({
    seatNumber: { type: String, required: true },
    deck: { type: String, enum: ['LOWER', 'UPPER'], default: 'LOWER' },
    row: { type: Number, required: true },
    col: { type: Number, required: true },
    seatType: { type: String, enum: ['SEATER', 'SLEEPER'], default: 'SEATER' },
    basePriceFactor: { type: Number, default: 1.0 },
}, { _id: false });
const BusSchema = new mongoose_1.Schema({
    operatorId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Operator', required: true, index: true },
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
}, { timestamps: true });
exports.Bus = mongoose_1.default.model('Bus', BusSchema);
