"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditController = void 0;
const AuditService_1 = require("../services/AuditService");
class AuditController {
    static async getLogs(req, res, next) {
        try {
            const limit = parseInt(req.query.limit) || 50;
            const action = req.query.action;
            const logs = await AuditService_1.AuditService.getRecentLogs(limit, action);
            return res.status(200).json({
                success: true,
                count: logs.length,
                data: logs,
            });
        }
        catch (err) {
            return next(err);
        }
    }
}
exports.AuditController = AuditController;
