import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/planeforge',
  jwtSecret: process.env.JWT_SECRET || 'replace-this-development-secret',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:7310',
  auth: {
    tokenTtl: process.env.AUTH_TOKEN_TTL || '3d',
    sessionTtlDays: Number(process.env.AUTH_SESSION_TTL_DAYS || 3),
    loginCodeTtlMinutes: Number(process.env.LOGIN_CODE_TTL_MINUTES || 10),
    resetCodeTtlMinutes: Number(process.env.RESET_CODE_TTL_MINUTES || 10),
    adminSetupCode: process.env.ADMIN_SETUP_CODE
  },
  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  resendApiKey: process.env.RESEND_API_KEY,
  resendFrom: process.env.RESEND_FROM || 'PlaneForge <hello@planeforge.local>',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },
  payments: {
    mock: process.env.MOCK_PAYMENTS !== 'false',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,
    paystackWebhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET
  },
  streaming: {
    provider: process.env.STREAM_PROVIDER || 'cloudflare',
    tokenTtlSeconds: Number(process.env.STREAM_TOKEN_TTL_SECONDS || 300),
    cloudflare: {
      accountId: process.env.CLOUDFLARE_STREAM_ACCOUNT_ID,
      apiToken: process.env.CLOUDFLARE_STREAM_API_TOKEN,
      signingKeyId: process.env.CLOUDFLARE_STREAM_SIGNING_KEY_ID,
      signingKeyPem: process.env.CLOUDFLARE_STREAM_SIGNING_KEY_PEM,
      customerSubdomain: process.env.CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN
    }
  }
};
