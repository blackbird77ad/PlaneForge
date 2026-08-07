import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AuthSession } from '../models/AuthSession.js';
import { ApiError } from '../utils/apiError.js';

const sessionExpiry = () =>
  new Date(Date.now() + env.auth.sessionTtlDays * 24 * 60 * 60 * 1000);

export const getDeviceId = (req) => {
  const value = req.headers['x-device-id'] || req.body?.deviceId || req.query?.deviceId;
  return Array.isArray(value) ? value[0] : value;
};

export const getSessionMetadata = (req) => ({
  userAgent: req.headers['user-agent'],
  ipAddress: req.ip || req.socket?.remoteAddress
});

export const findActiveSession = (userId) =>
  AuthSession.findOne({
    user: userId,
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() }
  }).sort({ loginAt: -1 });

export const assertCanStartLogin = async ({ user, deviceId }) => {
  const activeSession = await findActiveSession(user._id);
  if (!activeSession) return;

  if (activeSession.deviceId !== deviceId) {
    throw new ApiError(
      423,
      'This account is already active on another device. Log out there first or wait for the 3-day session to expire.'
    );
  }
};

export const createAuthSession = async ({ user, deviceId, metadata }) => {
  await AuthSession.updateMany(
    {
      user: user._id,
      deviceId,
      revokedAt: { $exists: false }
    },
    {
      $set: {
        revokedAt: new Date(),
        revokeReason: 'same_device_relogin'
      }
    }
  );

  const session = await AuthSession.create({
    user: user._id,
    deviceId,
    ...metadata,
    expiresAt: sessionExpiry()
  });

  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
      sessionId: session._id,
      deviceId
    },
    env.jwtSecret,
    { expiresIn: env.auth.tokenTtl }
  );

  return { session, token };
};

export const revokeSession = async ({ sessionId, reason = 'logout' }) => {
  if (!sessionId) return null;
  return AuthSession.findByIdAndUpdate(
    sessionId,
    {
      $set: {
        revokedAt: new Date(),
        revokeReason: reason
      }
    },
    { new: true }
  );
};
