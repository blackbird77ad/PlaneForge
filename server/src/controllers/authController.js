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
import { normalizeContactNumber } from '../utils/contactNumber.js';

const publicUser = (user) => ({
  _id: user._id,
  id: user._id,
  name: user.name,
  email: user.email,
  contactNumber: user.contactNumber,
  dateOfBirth: user.dateOfBirth,
  role: accountRole(user.role),
  status: user.status,
  avatar: user.avatar,
  title: user.title,
  specialty: user.specialty,
  bio: user.bio,
  qualifications: user.qualifications || [],
  experienceYears: user.experienceYears || 0,
  consultationFee: user.consultationFee || 0,
  requestedConsultationFee: user.requestedConsultationFee || 0,
  consultationFeeStatus: user.consultationFeeStatus || 'not_requested',
  languages: user.languages || ['English'],
  availability: user.availability || [],
  partnerCode: user.partnerCode,
  commissionRate: user.commissionRate || 0,
  revenueShare: user.revenueShare || {},
  stripeConnectAccountId: user.stripeConnectAccountId,
  ownedCourses: user.ownedCourses || [],
  profile: user.profile || {},
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  lastLoginAt: user.lastLoginAt
});

const generateLoginCode = () => crypto.randomInt(100000, 1000000).toString();

const codeExpiry = () =>
  new Date(Date.now() + env.auth.loginCodeTtlMinutes * 60 * 1000);

const resetCodeExpiry = () =>
  new Date(Date.now() + env.auth.resetCodeTtlMinutes * 60 * 1000);

const resetTokenExpiry = () => new Date(Date.now() + 5 * 60 * 1000);

const normalizeRequestedRole = (role) => {
  if (!role || ['learner', 'student', 'buyer'].includes(role)) return 'user';
  return role;
};

const accountRole = (role) => (['student', 'learner', 'buyer'].includes(role) ? 'user' : role);

const compactString = (value, maxLength = 240) => {
  if (value == null) return '';
  return String(value).trim().slice(0, maxLength);
};

const assertFullName = (name) => {
  const value = compactString(name, 120).replace(/\s+/g, ' ');
  if (!value) throw new ApiError(400, 'Full name is required');
  if (value.split(' ').filter(Boolean).length < 2) {
    throw new ApiError(400, 'Enter your full name');
  }
  return value;
};

const parseDateOfBirth = (value) => {
  const rawDate = compactString(value, 40);
  if (!rawDate) {
    throw new ApiError(400, 'Date of birth is required');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    throw new ApiError(400, 'Use a valid date of birth');
  }

  const [year, month, day] = rawDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new ApiError(400, 'Use a valid date of birth');
  }

  if (date > new Date()) {
    throw new ApiError(400, 'Date of birth cannot be in the future');
  }

  return date;
};

const assertRegistrationRole = ({ role, adminSetupCode }) => {
  const normalizedRole = normalizeRequestedRole(role);
  if (!['user', 'consultant', 'partner', 'admin'].includes(normalizedRole)) {
    throw new ApiError(400, 'Registration is available for users, consultants, partners, and administrators');
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

const assertCanSelfRegisterAdmin = async () => {
  const adminLimit = Number.isFinite(env.auth.adminSelfSignupLimit)
    ? env.auth.adminSelfSignupLimit
    : 2;

  if (adminLimit < 0) return;

  const adminCount = await User.countDocuments({ role: 'admin' });
  if (adminCount >= adminLimit) {
    throw new ApiError(
      403,
      'Admin self-signup is closed. Existing admins can create additional admin accounts from the dashboard.'
    );
  }
};

const assertExpectedRole = ({ user, role }) => {
  const expectedRole = normalizeRequestedRole(role);
  if (accountRole(user.role) === expectedRole) return;

  throw new ApiError(401, `This account is not registered as ${expectedRole}`);
};

const createLoginChallenge = async ({ user, req, deviceId }) => {
  const code = generateLoginCode();
  const expiresAt = codeExpiry();

  const challenge = await LoginChallenge.create({
    user: user._id,
    codeHash: LoginChallenge.hashCode(code),
    deviceId,
    ...getSessionMetadata(req),
    expiresAt
  });

  try {
    await sendLoginCodeEmail({ user, code, expiresAt });
  } catch (error) {
    challenge.consumedAt = new Date();
    await challenge.save().catch((saveError) => {
      console.error('Unable to invalidate undelivered login challenge', saveError);
    });
    throw error;
  }

  await LoginChallenge.updateMany(
    {
      user: user._id,
      _id: { $ne: challenge._id },
      consumedAt: { $exists: false }
    },
    {
      $set: {
        consumedAt: new Date()
      }
    }
  );

  return {
    requiresVerification: true,
    challengeId: challenge._id,
    expiresAt,
    tokenTtlDays: env.auth.sessionTtlDays
  };
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'user', adminSetupCode, contactNumber, dateOfBirth } = req.body;
  const deviceId = getDeviceId(req);
  const normalizedName = assertFullName(name);
  const normalizedEmail = compactString(email, 254).toLowerCase();
  const normalizedContactNumber = normalizeContactNumber(contactNumber);

  if (!normalizedName || !normalizedEmail || !password || !normalizedContactNumber) {
    throw new ApiError(400, 'Name, email, contact number and password are required');
  }

  if (password.length < 8) {
    throw new ApiError(400, 'Use at least 8 characters for the password');
  }

  if (!deviceId) {
    throw new ApiError(400, 'A device id is required to start a secure login');
  }

  const normalizedRole = assertRegistrationRole({ role, adminSetupCode });
  if (normalizedRole === 'admin') {
    await assertCanSelfRegisterAdmin();
  }

  const parsedDateOfBirth = parseDateOfBirth(dateOfBirth);
  const existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    contactNumber: normalizedContactNumber,
    dateOfBirth: parsedDateOfBirth,
    role: normalizedRole,
    status: ['consultant', 'partner'].includes(normalizedRole) ? 'pending' : 'active',
    passwordHash: await User.hashPassword(password)
  });

  if (user.status === 'pending') {
    return res.status(202).json({
      message: 'Account request received. An admin must approve this account before sign in.',
      requiresApproval: true,
      role: user.role,
      status: user.status
    });
  }

  let challenge;
  try {
    challenge = await createLoginChallenge({ user, req, deviceId });
  } catch (error) {
    await User.deleteOne({ _id: user._id }).catch((cleanupError) => {
      console.error('Unable to clean up account after failed verification email', cleanupError);
    });
    throw error;
  }

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

  if (user.status === 'pending') {
    throw new ApiError(401, 'Account is pending admin approval');
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

export const resendLoginCode = asyncHandler(async (req, res) => {
  const { challengeId } = req.body;
  const deviceId = getDeviceId(req);

  if (!challengeId) {
    throw new ApiError(400, 'Challenge id is required');
  }

  if (!deviceId) {
    throw new ApiError(400, 'A device id is required to resend this code');
  }

  const challenge = await LoginChallenge.findById(challengeId).populate('user');

  if (!challenge || challenge.consumedAt) {
    throw new ApiError(401, 'Verification code is invalid or has expired');
  }

  if (challenge.deviceId !== deviceId) {
    throw new ApiError(401, 'This verification code was issued for another device');
  }

  if (challenge.createdAt && Date.now() - challenge.createdAt.getTime() < 30 * 1000) {
    throw new ApiError(429, 'Please wait a moment before requesting another code.');
  }

  const user = challenge.user;
  if (!user || user.status !== 'active') {
    throw new ApiError(401, 'Account is not available');
  }

  const nextChallenge = await createLoginChallenge({ user, req, deviceId });

  res.json({
    message: 'A new PlaneForge verification code has been sent.',
    ...nextChallenge
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

  if (role) {
    assertExpectedRole({ user, role });
  }

  const code = generateLoginCode();
  const expiresAt = resetCodeExpiry();
  const resetUrl = `${env.clientUrl.replace(/\/$/, '')}/reset-password?email=${encodeURIComponent(user.email)}&code=${encodeURIComponent(code)}`;

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

  await sendPasswordResetCodeEmail({ user, code, expiresAt, resetUrl });

  res.json({
    message: 'If that account exists, a password reset code has been sent.',
    expiresAt
  });
});

const findValidPasswordResetChallenge = async ({ user, code }) => {
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

  return challenge;
};

export const verifyPasswordResetCode = asyncHandler(async (req, res) => {
  const { email, code, role } = req.body;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email || '') || !code) {
    throw new ApiError(400, 'Email and reset code are required');
  }

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || user.status !== 'active') {
    throw new ApiError(401, 'Reset code is invalid or has expired');
  }

  if (role) {
    assertExpectedRole({ user, role });
  }

  const challenge = await findValidPasswordResetChallenge({ user, code });
  const resetToken = crypto.randomBytes(32).toString('hex');

  challenge.consumedAt = new Date();
  challenge.resetTokenHash = PasswordResetChallenge.hashResetToken(resetToken);
  challenge.resetTokenExpiresAt = resetTokenExpiry();
  await challenge.save();

  res.json({
    message: 'Reset code verified. Set a new password now.',
    resetToken,
    expiresAt: challenge.resetTokenExpiresAt
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, resetToken, password, role } = req.body;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email || '') || !password || (!resetToken && !code)) {
    throw new ApiError(400, 'Email, reset verification, and new password are required');
  }

  if (password.length < 8) {
    throw new ApiError(400, 'Use at least 8 characters for the new password');
  }

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || user.status !== 'active') {
    throw new ApiError(401, 'Reset verification is invalid or has expired');
  }

  if (role) {
    assertExpectedRole({ user, role });
  }

  let challenge;
  if (resetToken) {
    challenge = await PasswordResetChallenge.findOne({
      user: user._id,
      resetTokenConsumedAt: { $exists: false },
      resetTokenExpiresAt: { $gt: new Date() }
    }).sort({ consumedAt: -1 });

    if (!challenge || !challenge.compareResetToken(resetToken)) {
      throw new ApiError(401, 'Reset verification is invalid or has expired');
    }
  } else {
    challenge = await findValidPasswordResetChallenge({ user, code });
    challenge.consumedAt = new Date();
  }

  challenge.resetTokenConsumedAt = new Date();
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
