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
exports.Route = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const RouteStopSchema = new mongoose_1.Schema({
    stopId: { type: String },
    stopName: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true },
    stopType: { type: String, enum: ['BOARDING', 'DROPPING', 'BOTH'], default: 'BOTH' },
    sequence: { type: Number, required: true },
    offsetMinutesFromStart: { type: Number, default: 0 },
}, { _id: false });
const RouteSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    originCity: { type: String, required: true, trim: true, index: true },
    destinationCity: { type: String, required: true, trim: true, index: true },
    totalDistanceKm: { type: Number, required: true, min: 1 },
    estimatedDurationMinutes: { type: Number, required: true, min: 1 },
    stops: [RouteStopSchema],
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
}, { timestamps: true });
// Compound index for quick origin-destination search
RouteSchema.index({ originCity: 1, destinationCity: 1, status: 1 });
exports.Route = mongoose_1.default.model('Route', RouteSchema);
