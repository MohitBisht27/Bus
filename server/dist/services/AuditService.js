"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const AuditLog_1 = require("../models/AuditLog");
const mongoose_1 = __importDefault(require("mongoose"));
class AuditService {
    static async log(params) {
        try {
            await AuditLog_1.AuditLog.create({
                action: params.action,
                entityType: params.entityType,
                entityId: params.entityId?.toString(),
                userId: params.userId ? new mongoose_1.default.Types.ObjectId(params.userId.toString()) : undefined,
                userName: params.userName || 'System/Guest',
                userRole: params.userRole || 'GUEST',
                details: params.details || {},
                ipAddress: params.ipAddress || '127.0.0.1',
                timestamp: new Date(),
            });
        }
        catch (err) {
            console.error('[AuditService] Failed to write audit log:', err.message);
        }
    }
    static async getRecentLogs(limit = 50, filterAction) {
        const query = {};
        if (filterAction) {
            query.action = filterAction;
        }
        return AuditLog_1.AuditLog.find(query)
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();
    }
}
exports.AuditService = AuditService;
