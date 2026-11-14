"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const AuditService_1 = require("./AuditService");
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_bus_booking_system_2026_mern';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
class AuthService {
    static generateToken(user) {
        return jsonwebtoken_1.default.sign({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
            operatorId: user.operatorId?.toString(),
        }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    }
    static async register(params) {
        const existing = await User_1.User.findOne({ email: params.email.toLowerCase().trim() });
        if (existing) {
            const error = new Error('An account with this email already exists');
            error.statusCode = 409;
            error.code = 'EMAIL_ALREADY_EXISTS';
            throw error;
        }
        const user = await User_1.User.create({
            name: params.name,
            email: params.email,
            password: params.password,
            role: params.role || 'PASSENGER',
            phone: params.phone,
            operatorId: params.operatorId ? params.operatorId : null,
        });
        const token = this.generateToken(user);
        await AuditService_1.AuditService.log({
            action: 'USER_REGISTERED',
            entityType: 'User',
            entityId: user._id,
            userName: user.name,
            userRole: user.role,
            details: { email: user.email, role: user.role },
        });
        return {
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                operatorId: user.operatorId,
            },
        };
    }
    static async login(params) {
        const user = await User_1.User.findOne({ email: params.email.toLowerCase().trim() });
        if (!user) {
            const error = new Error('Invalid email or password');
            error.statusCode = 401;
            error.code = 'INVALID_CREDENTIALS';
            throw error;
        }
        const isMatch = await user.comparePassword(params.password || '');
        if (!isMatch) {
            const error = new Error('Invalid email or password');
            error.statusCode = 401;
            error.code = 'INVALID_CREDENTIALS';
            throw error;
        }
        const token = this.generateToken(user);
        await AuditService_1.AuditService.log({
            action: 'USER_LOGIN',
            entityType: 'User',
            entityId: user._id,
            userName: user.name,
            userRole: user.role,
            details: { email: user.email },
        });
        return {
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                operatorId: user.operatorId,
            },
        };
    }
}
exports.AuthService = AuthService;
