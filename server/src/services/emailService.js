import { Resend } from 'resend';
import { env } from '../config/env.js';

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

export const sendEmail = async ({ to, subject, html }) => {
  if (!resend) {
    console.log(`Email skipped without RESEND_API_KEY: ${subject} -> ${to}`);
    return { id: `dev-email-${Date.now()}` };
  }

  const result = await resend.emails.send({
    from: env.resendFrom,
    to,
    subject,
    html
  });

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
      <p>You can continue from your student dashboard.</p>
    `
  });

export const sendLoginCodeEmail = ({ user, code, expiresAt }) =>
  sendEmail({
    to: user.email,
    subject: 'Your PlaneForge login code',
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
    html: `
      <h1>Password reset code</h1>
      <p>Hello ${user.name}, use this one-time code to reset your PlaneForge password:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${code}</p>
      <p>This code expires at <strong>${expiresAt.toUTCString()}</strong>.</p>
      <p>If you did not request a password reset, you can ignore this email.</p>
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
