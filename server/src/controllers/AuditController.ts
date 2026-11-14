import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/AuditService';

export class AuditController {
  static async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const action = req.query.action as string | undefined;

      const logs = await AuditService.getRecentLogs(limit, action);
      return res.status(200).json({
        success: true,
        count: logs.length,
        data: logs,
      });
    } catch (err) {
      return next(err);
    }
  }
}
