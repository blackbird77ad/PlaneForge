import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDb, databaseStatus, isDbConnected, startDbReconnectLoop } from './config/db.js';
import { env } from './config/env.js';
import { adminRoutes } from './routes/adminRoutes.js';
import { authRoutes } from './routes/authRoutes.js';
import { careerRoutes } from './routes/careerRoutes.js';
import { consultationRoutes } from './routes/consultationRoutes.js';
import { contentRoutes } from './routes/contentRoutes.js';
import { courseRoutes } from './routes/courseRoutes.js';
import { mediaRoutes } from './routes/mediaRoutes.js';
import { orderRoutes } from './routes/orderRoutes.js';
import { productRoutes } from './routes/productRoutes.js';
import { userRoutes } from './routes/userRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();
const localDevOrigin = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;
const allowAllCorsOrigins = env.corsAllowedOrigins.includes('*');
const allowedCorsOrigins = new Set([env.clientUrl, ...env.corsAllowedOrigins]);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowAllCorsOrigins || allowedCorsOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      if (process.env.NODE_ENV !== 'production' && localDevOrigin.test(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Id']
  })
);
app.use(cookieParser());
app.use(
  express.json({
    limit: '2mb',
    verify: (req, res, buffer) => {
      if (req.originalUrl?.startsWith('/api/payments/webhooks')) {
        req.rawBody = buffer.toString('utf8');
      }
    }
  })
);
app.use(morgan('dev'));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PlaneForge API',
    mode: 'database',
    database: databaseStatus()
  });
});

const requireDatabase = (req, res, next) => {
  if (isDbConnected()) {
    next();
    return;
  }

  res.status(503).json({
    message: 'Database connection is not ready. Check the MongoDB URI and network access.',
    database: databaseStatus()
  });
};

app.use('/api', requireDatabase);
app.use('/api/auth', authRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/payments', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

await connectDb();
startDbReconnectLoop();

app.listen(env.port, () => {
  console.log(`PlaneForge API running on port ${env.port} (database backend)`);
});
