import { AuditLog } from '../models/AuditLog';
import mongoose from 'mongoose';

export class AuditService {
  static async log(params: {
    action: string;
    entityType: string;
    entityId?: string | mongoose.Types.ObjectId;
    userId?: string | mongoose.Types.ObjectId;
    userName?: string;
    userRole?: string;
    details?: Record<string, any>;
    ipAddress?: string;
  }) {
    try {
      await AuditLog.create({
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId?.toString(),
        userId: params.userId ? new mongoose.Types.ObjectId(params.userId.toString()) : undefined,
        userName: params.userName || 'System/Guest',
        userRole: params.userRole || 'GUEST',
        details: params.details || {},
        ipAddress: params.ipAddress || '127.0.0.1',
        timestamp: new Date(),
      });
    } catch (err: any) {
      console.error('[AuditService] Failed to write audit log:', err.message);
    }
  }

  static async getRecentLogs(limit = 50, filterAction?: string) {
    const query: any = {};
    if (filterAction) {
      query.action = filterAction;
    }
    return AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }
}
