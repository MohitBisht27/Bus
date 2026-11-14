"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const AuthService_1 = require("../services/AuthService");
const User_1 = require("../models/User");
class AuthController {
    static async register(req, res, next) {
        try {
            const result = await AuthService_1.AuthService.register(req.body);
            return res.status(201).json({
                success: true,
                data: result,
            });
        }
        catch (err) {
            return next(err);
        }
    }
    static async login(req, res, next) {
        try {
            const result = await AuthService_1.AuthService.login(req.body);
            return res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (err) {
            return next(err);
        }
    }
    static async me(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
            }
            const user = await User_1.User.findById(req.user.userId).select('-password').populate('operatorId');
            return res.status(200).json({
                success: true,
                data: user,
            });
        }
        catch (err) {
            return next(err);
        }
    }
}
exports.AuthController = AuthController;
