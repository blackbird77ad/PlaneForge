import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { adminRoutes } from './routes/adminRoutes.js';
import { authRoutes } from './routes/authRoutes.js';
import { consultationRoutes } from './routes/consultationRoutes.js';
import { contentRoutes } from './routes/contentRoutes.js';
import { courseRoutes } from './routes/courseRoutes.js';
import { orderRoutes } from './routes/orderRoutes.js';
import { userRoutes } from './routes/userRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();
const localDevOrigin = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === env.clientUrl) {
        callback(null, true);
        return;
      }

      if (process.env.NODE_ENV !== 'production' && localDevOrigin.test(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
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
  res.json({ status: 'ok', service: 'PlaneForge API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/payments', orderRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

await connectDb();

app.listen(env.port, () => {
  console.log(`PlaneForge API running on port ${env.port}`);
});
