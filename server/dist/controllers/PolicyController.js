"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyController = void 0;
const CancellationPolicy_1 = require("../models/CancellationPolicy");
const AuditService_1 = require("../services/AuditService");
class PolicyController {
    static async getPolicy(req, res, next) {
        try {
            let policy = await CancellationPolicy_1.CancellationPolicy.findOne({ isDefault: true }).lean();
            if (!policy) {
                policy = await CancellationPolicy_1.CancellationPolicy.findOne().lean();
            }
            return res.status(200).json({
                success: true,
                data: policy,
            });
        }
        catch (err) {
            return next(err);
        }
    }
    static async updatePolicy(req, res, next) {
        try {
            const { name, description, tiers } = req.body;
            let policy = await CancellationPolicy_1.CancellationPolicy.findOne({ isDefault: true });
            if (policy) {
                if (name)
                    policy.name = name;
                if (description)
                    policy.description = description;
                if (tiers)
                    policy.tiers = tiers;
                await policy.save();
            }
            else {
                policy = await CancellationPolicy_1.CancellationPolicy.create({
                    name: name || 'Standard Bus Cancellation Policy',
                    description: description || 'Default tiered cancellation rules',
                    tiers: tiers || [],
                    isDefault: true,
                });
            }
            await AuditService_1.AuditService.log({
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
        }
        catch (err) {
            return next(err);
        }
    }
}
exports.PolicyController = PolicyController;
