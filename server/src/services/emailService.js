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
