import { Resend } from 'resend';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;
const emailUnavailableMessage = 'We could not send the email right now. Please try again in a minute.';

const resendErrorMessage = (error) => {
  if (!error) return 'Unknown Resend error';
  if (typeof error === 'string') return error;
  return error.message || error.name || JSON.stringify(error);
};

export const sendEmail = async ({ to, subject, html, requireDelivery = false }) => {
  if (!resend) {
    if (requireDelivery || process.env.NODE_ENV === 'production') {
      throw new ApiError(503, 'Email delivery is not configured. Set RESEND_API_KEY before accepting signups.');
    }

    console.log(`Email skipped without RESEND_API_KEY: ${subject} -> ${to}`);
    return { id: `dev-email-${Date.now()}` };
  }

  if (!env.resendFrom) {
    throw new ApiError(503, 'Email delivery is not configured. Set RESEND_FROM to a verified Resend sender.');
  }

  let result;
  try {
    result = await resend.emails.send({
      from: env.resendFrom,
      to,
      subject,
      html
    });
  } catch (error) {
    console.error(`Resend email request failed: ${subject} -> ${to}`, error);
    throw new ApiError(502, emailUnavailableMessage);
  }

  if (result?.error) {
    console.error(`Resend email delivery failed: ${subject} -> ${to}: ${resendErrorMessage(result.error)}`);
    throw new ApiError(502, emailUnavailableMessage);
  }

  return result.data || result;
};

export const sendEnrollmentEmail = ({ user, course, invoiceNumber }) =>
  sendEmail({
    to: user.email,
    subject: `You are enrolled in ${course.title}`,
    html: `
      <h1>Welcome to ${course.title}</h1>
      <p>Hello ${user.name}, your PlaneForge course is now unlocked.</p>
      <p>Invoice: <strong>${invoiceNumber}</strong></p>
      <p>You can continue from your account dashboard.</p>
    `
  });

export const sendLoginCodeEmail = ({ user, code, expiresAt }) =>
  sendEmail({
    to: user.email,
    subject: 'Your PlaneForge login code',
    requireDelivery: true,
    html: `
      <h1>Your login code</h1>
      <p>Hello ${user.name}, use this one-time code to finish signing in to PlaneForge Academy:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${code}</p>
      <p>This code expires at <strong>${expiresAt.toUTCString()}</strong>.</p>
      <p>If you did not request this code, you can ignore this email.</p>
    `
  });

export const sendPasswordResetCodeEmail = ({ user, code, expiresAt }) =>
  sendEmail({
    to: user.email,
    subject: 'Reset your PlaneForge password',
    requireDelivery: true,
    html: `
      <h1>Password reset code</h1>
      <p>Hello ${user.name}, use this one-time code to reset your PlaneForge password:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${code}</p>
      <p>This code expires at <strong>${expiresAt.toUTCString()}</strong>.</p>
      <p>If you did not request a password reset, you can ignore this email.</p>
    `
  });

export const sendProfileChangeCodeEmail = ({ user, code, expiresAt, changes }) =>
  sendEmail({
    to: user.email,
    subject: 'Confirm your PlaneForge profile change',
    requireDelivery: true,
    html: `
      <h1>Confirm profile change</h1>
      <p>Hello ${user.name}, use this one-time code to confirm the account detail change on PlaneForge:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${code}</p>
      <p>Requested changes: <strong>${changes.join(', ')}</strong>.</p>
      <p>This code expires at <strong>${expiresAt.toUTCString()}</strong>.</p>
      <p>If you did not request this change, reset your password and contact support.</p>
    `
  });

export const sendConsultationEmail = ({ user, consultant, consultation }) =>
  sendEmail({
    to: user.email,
    subject: 'Your PlaneForge consultation is confirmed',
    html: `
      <h1>Consultation confirmed</h1>
      <p>Hello ${user.name}, your ${consultation.service} session with ${consultant.name} is confirmed.</p>
      <p>Scheduled for: <strong>${consultation.scheduledAt.toUTCString()}</strong></p>
    `
  });
