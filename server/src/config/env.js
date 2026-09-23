import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const configDir = path.dirname(fileURLToPath(import.meta.url));
const projectRootEnv = path.resolve(configDir, '../../..', '.env');

dotenv.config({ path: projectRootEnv });
dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  demoBackend: process.env.DEMO_BACKEND === 'true',
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/planeforge',
  mongoServerSelectionTimeoutMs: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 5000),
  mongoReconnectIntervalMs: Number(process.env.MONGO_RECONNECT_INTERVAL_MS || 30000),
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
    provider: process.env.STREAM_PROVIDER || 'unconfigured',
    tokenTtlSeconds: Number(process.env.STREAM_TOKEN_TTL_SECONDS || 300),
    mux: {
      tokenId: process.env.MUX_TOKEN_ID,
      tokenSecret: process.env.MUX_TOKEN_SECRET,
      dataEnvironmentKey: process.env.MUX_DATA_ENV_KEY
    },
    bunny: {
      libraryId: process.env.BUNNY_STREAM_LIBRARY_ID,
      apiKey: process.env.BUNNY_STREAM_API_KEY,
      pullZoneUrl: process.env.BUNNY_STREAM_PULL_ZONE_URL
    },
    cloudflare: {
      accountId: process.env.CLOUDFLARE_STREAM_ACCOUNT_ID,
      apiToken: process.env.CLOUDFLARE_STREAM_API_TOKEN,
      signingKeyId: process.env.CLOUDFLARE_STREAM_SIGNING_KEY_ID,
      signingKeyPem: process.env.CLOUDFLARE_STREAM_SIGNING_KEY_PEM,
      customerSubdomain: process.env.CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN
    }
  }
};
