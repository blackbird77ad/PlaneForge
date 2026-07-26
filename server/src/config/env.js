import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/planeforge',
  jwtSecret: process.env.JWT_SECRET || 'replace-this-development-secret',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:7310',
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
    paystackSecretKey: process.env.PAYSTACK_SECRET_KEY
  }
};
