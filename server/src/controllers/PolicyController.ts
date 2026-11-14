import { Request, Response, NextFunction } from 'express';
import { CancellationPolicy } from '../models/CancellationPolicy';
import { AuditService } from '../services/AuditService';

export class PolicyController {
  static async getPolicy(req: Request, res: Response, next: NextFunction) {
    try {
      let policy = await CancellationPolicy.findOne({ isDefault: true }).lean();
      if (!policy) {
        policy = await CancellationPolicy.findOne().lean();
      }
      return res.status(200).json({
        success: true,
        data: policy,
      });
    } catch (err) {
      return next(err);
    }
  }

  static async updatePolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, tiers } = req.body;
      let policy = await CancellationPolicy.findOne({ isDefault: true });

      if (policy) {
        if (name) policy.name = name;
        if (description) policy.description = description;
        if (tiers) policy.tiers = tiers;
        await policy.save();
      } else {
        policy = await CancellationPolicy.create({
          name: name || 'Standard Bus Cancellation Policy',
          description: description || 'Default tiered cancellation rules',
          tiers: tiers || [],
          isDefault: true,
        });
      }

      await AuditService.log({
        action: 'CANCELLATION_POLICY_UPDATED',
        entityType: 'CancellationPolicy',
        entityId: policy._id,
        userName: req.user?.name,
        userRole: req.user?.role,
        details: { tiers: policy.tiers },
      });

      return res.status(200).json({
        success: true,
        message: 'Cancellation policy updated successfully',
        data: policy,
      });
    } catch (err) {
      return next(err);
    }
  }
}
