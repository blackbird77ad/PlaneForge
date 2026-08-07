import crypto from 'crypto';
import { env } from '../config/env.js';
import { AuthSession } from '../models/AuthSession.js';
import { LoginChallenge } from '../models/LoginChallenge.js';
import { PasswordResetChallenge } from '../models/PasswordResetChallenge.js';
import { User } from '../models/User.js';
import { sendLoginCodeEmail, sendPasswordResetCodeEmail } from '../services/emailService.js';
import {
  assertCanStartLogin,
  createAuthSession,
  getDeviceId,
  getSessionMetadata,
  revokeSession
} from '../services/sessionService.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  title: user.title,
  specialty: user.specialty,
  ownedCourses: user.ownedCourses || [],
  profile: user.profile
});

const generateLoginCode = () => crypto.randomInt(100000, 1000000).toString();

const codeExpiry = () =>
  new Date(Date.now() + env.auth.loginCodeTtlMinutes * 60 * 1000);

const resetCodeExpiry = () =>
  new Date(Date.now() + env.auth.resetCodeTtlMinutes * 60 * 1000);

const exposeDevCode = () => !env.resendApiKey && process.env.NODE_ENV !== 'production';

const normalizeRequestedRole = (role) => {
  if (!role || role === 'learner') return 'student';
  return role;
};

const assertRegistrationRole = ({ role, adminSetupCode }) => {
  const normalizedRole = normalizeRequestedRole(role);
  if (!['student', 'admin'].includes(normalizedRole)) {
    throw new ApiError(400, 'Registration is available for learners and administrators');
  }

  if (normalizedRole === 'admin') {
    if (!env.auth.adminSetupCode) {
      throw new ApiError(403, 'Admin registration is not configured');
    }

    if (adminSetupCode !== env.auth.adminSetupCode) {
      throw new ApiError(403, 'Admin setup code is invalid');
    }
  }

  return normalizedRole;
};

const assertExpectedRole = ({ user, role }) => {
  const expectedRole = normalizeRequestedRole(role);
  if (!role || user.role === expectedRole) return;

  throw new ApiError(401, `This account is not registered as ${expectedRole}`);
};

const createLoginChallenge = async ({ user, req, deviceId }) => {
  const code = generateLoginCode();
  const expiresAt = codeExpiry();

  await LoginChallenge.updateMany(
    {
      user: user._id,
      consumedAt: { $exists: false }
    },
    {
      $set: {
        consumedAt: new Date()
      }
    }
  );

  const challenge = await LoginChallenge.create({
    user: user._id,
    codeHash: LoginChallenge.hashCode(code),
    deviceId,
    ...getSessionMetadata(req),
    expiresAt
  });

  await sendLoginCodeEmail({ user, code, expiresAt });

  return {
    requiresVerification: true,
    challengeId: challenge._id,
    expiresAt,
    tokenTtlDays: env.auth.sessionTtlDays,
    ...(exposeDevCode() ? { devCode: code } : {})
  };
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'student', adminSetupCode } = req.body;
  const deviceId = getDeviceId(req);

  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email and password are required');
  }

  if (password.length < 8) {
    throw new ApiError(400, 'Use at least 8 characters for the password');
  }

  if (!deviceId) {
    throw new ApiError(400, 'A device id is required to start a secure login');
  }

  const normalizedRole = assertRegistrationRole({ role, adminSetupCode });
  const existing = await User.findOne({ email });

  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const user = await User.create({
    name,
    email,
    role: normalizedRole,
    passwordHash: await User.hashPassword(password)
  });

  const challenge = await createLoginChallenge({ user, req, deviceId });

  res.status(201).json({
    message: 'Check your email for a PlaneForge login code.',
    ...challenge
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;
  const deviceId = getDeviceId(req);

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  if (!deviceId) {
    throw new ApiError(400, 'A device id is required to start a secure login');
  }

  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.status !== 'active') {
    throw new ApiError(401, 'Account is not available');
  }

  assertExpectedRole({ user, role });

  await assertCanStartLogin({ user, deviceId });

  const challenge = await createLoginChallenge({ user, req, deviceId });

  res.json({
    message: 'Check your email for a PlaneForge login code.',
    ...challenge
  });
});

export const verifyLogin = asyncHandler(async (req, res) => {
  const { challengeId, code } = req.body;
  const deviceId = getDeviceId(req);

  if (!challengeId || !code) {
    throw new ApiError(400, 'Challenge id and code are required');
  }

  if (!deviceId) {
    throw new ApiError(400, 'A device id is required to verify this login');
  }

  const challenge = await LoginChallenge.findById(challengeId).populate('user');

  if (!challenge || challenge.consumedAt || challenge.expiresAt <= new Date()) {
    throw new ApiError(401, 'Login code is invalid or has expired');
  }

  if (challenge.deviceId !== deviceId) {
    throw new ApiError(401, 'This login code was issued for another device');
  }

  if (challenge.attempts >= challenge.maxAttempts) {
    throw new ApiError(429, 'Too many attempts. Start a new login.');
  }

  if (!challenge.compareCode(code)) {
    challenge.attempts += 1;
    await challenge.save();
    throw new ApiError(401, 'Login code is incorrect');
  }

  const user = challenge.user;
  if (!user || user.status !== 'active') {
    throw new ApiError(401, 'Account is not available');
  }

  await assertCanStartLogin({ user, deviceId });

  challenge.consumedAt = new Date();
  await challenge.save();

  const { session, token } = await createAuthSession({
    user,
    deviceId,
    metadata: getSessionMetadata(req)
  });

  user.lastLoginAt = new Date();
  await user.save();

  res.json({
    token,
    session: {
      id: session._id,
      expiresAt: session.expiresAt
    },
    user: publicUser(user)
  });
});

export const logout = asyncHandler(async (req, res) => {
  await revokeSession({ sessionId: req.authSession?._id, reason: 'logout' });
  res.json({ message: 'Signed out of this device' });
});

export const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email || '')) {
    throw new ApiError(400, 'A valid email address is required');
  }

  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user || user.status !== 'active') {
    return res.json({
      message: 'If that account exists, a password reset code has been sent.'
    });
  }

  assertExpectedRole({ user, role });

  const code = generateLoginCode();
  const expiresAt = resetCodeExpiry();

  await PasswordResetChallenge.updateMany(
    {
      user: user._id,
      consumedAt: { $exists: false }
    },
    {
      $set: {
        consumedAt: new Date()
      }
    }
  );

  await PasswordResetChallenge.create({
    user: user._id,
    codeHash: PasswordResetChallenge.hashCode(code),
    expiresAt
  });

  await sendPasswordResetCodeEmail({ user, code, expiresAt });

  res.json({
    message: 'If that account exists, a password reset code has been sent.',
    expiresAt,
    ...(exposeDevCode() ? { devCode: code } : {})
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, password, role } = req.body;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email || '') || !code || !password) {
    throw new ApiError(400, 'Email, reset code, and new password are required');
  }

  if (password.length < 8) {
    throw new ApiError(400, 'Use at least 8 characters for the new password');
  }

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || user.status !== 'active') {
    throw new ApiError(401, 'Reset code is invalid or has expired');
  }

  assertExpectedRole({ user, role });

  const challenge = await PasswordResetChallenge.findOne({
    user: user._id,
    consumedAt: { $exists: false },
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (!challenge) {
    throw new ApiError(401, 'Reset code is invalid or has expired');
  }

  if (challenge.attempts >= challenge.maxAttempts) {
    throw new ApiError(429, 'Too many attempts. Request a new reset code.');
  }

  if (!challenge.compareCode(code)) {
    challenge.attempts += 1;
    await challenge.save();
    throw new ApiError(401, 'Reset code is incorrect');
  }

  challenge.consumedAt = new Date();
  user.passwordHash = await User.hashPassword(password);

  await Promise.all([
    challenge.save(),
    user.save(),
    AuthSession.updateMany(
      {
        user: user._id,
        revokedAt: { $exists: false }
      },
      {
        $set: {
          revokedAt: new Date(),
          revokeReason: 'password_reset'
        }
      }
    )
  ]);

  res.json({ message: 'Password reset complete. Sign in with your new password.' });
});

export const getMe = asyncHandler(async (req, res) => {
  const activeSession = req.authSession
    ? await AuthSession.findById(req.authSession._id).select('deviceId expiresAt lastActivityAt')
    : null;

  res.json({
    user: publicUser(req.user),
    session: activeSession
  });
});
