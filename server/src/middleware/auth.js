import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AuthSession } from '../models/AuthSession.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : req.cookies?.token;

  if (!token) {
    throw new ApiError(401, 'Authentication required');
  }

  const decoded = jwt.verify(token, env.jwtSecret);
  if (!decoded.sessionId || !decoded.deviceId) {
    throw new ApiError(401, 'Session verification required');
  }

  const user = await User.findById(decoded.id).select('-passwordHash');

  if (!user || user.status !== 'active') {
    throw new ApiError(401, 'Account is not available');
  }

  const requestDeviceId = req.headers['x-device-id'] || req.body?.deviceId || req.query?.deviceId;
  if (requestDeviceId && requestDeviceId !== decoded.deviceId) {
    throw new ApiError(401, 'This session belongs to another device');
  }

  const session = await AuthSession.findById(decoded.sessionId);
  if (
    !session ||
    session.user.toString() !== user._id.toString() ||
    session.deviceId !== decoded.deviceId ||
    session.revokedAt ||
    session.expiresAt <= new Date()
  ) {
    throw new ApiError(401, 'Session expired. Sign in with a new email code.');
  }

  session.lastActivityAt = new Date();
  await session.save();

  req.user = user;
  req.authSession = session;
  next();
});

export const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new ApiError(403, 'You do not have permission to access this resource');
  }

  next();
};
