import jwt from 'jsonwebtoken';
import { User, IUser, UserRole } from '../models/User';
import { AuditService } from './AuditService';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_bus_booking_system_2026_mern';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export class AuthService {
  static generateToken(user: IUser): string {
    return jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
        operatorId: user.operatorId?.toString(),
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );
  }

  static async register(params: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    role?: UserRole;
    operatorId?: string;
  }) {
    const existing = await User.findOne({ email: params.email.toLowerCase().trim() });
    if (existing) {
      const error: any = new Error('An account with this email already exists');
      error.statusCode = 409;
      error.code = 'EMAIL_ALREADY_EXISTS';
      throw error;
    }

    const user = await User.create({
      name: params.name,
      email: params.email,
      password: params.password,
      role: params.role || 'PASSENGER',
      phone: params.phone,
      operatorId: params.operatorId ? params.operatorId : null,
    });

    const token = this.generateToken(user);

    await AuditService.log({
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

  static async login(params: { email: string; password?: string }) {
    const user = await User.findOne({ email: params.email.toLowerCase().trim() });
    if (!user) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const isMatch = await user.comparePassword(params.password || '');
    if (!isMatch) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const token = this.generateToken(user);

    await AuditService.log({
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
