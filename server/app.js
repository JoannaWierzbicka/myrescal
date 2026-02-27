import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRouter from './auth/authRoutes.js';
import reservationsRouter from './routes/reservations.js';
import propertiesRouter from './routes/properties.js';
import roomsRouter from './routes/rooms.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

const parseAllowedOrigins = (value) =>
  String(value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const configuredOrigins = parseAllowedOrigins(process.env.CORS_ORIGIN || process.env.CLIENT_ORIGIN);
const allowedOrigins = Array.from(
  new Set([
    ...configuredOrigins,
    ...(process.env.NODE_ENV !== 'production' ? DEFAULT_DEV_ORIGINS : []),
  ]),
);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    callback(null, allowedOrigins.includes(origin));
  },
  credentials: false,
};

const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: Number(process.env.API_RATE_LIMIT_MAX) || 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

const loginLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: Number(process.env.AUTH_LOGIN_RATE_LIMIT_MAX) || 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

app.disable('x-powered-by');
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
      },
      reportOnly: true,
    },
  }),
);
app.use(
  cors(corsOptions),
);
app.use(express.json());

app.get('/health', (_req, res) => res.status(200).json({ ok: true }));

app.use('/api/auth/login', loginLimiter);
app.use('/api', apiLimiter);

app.use('/api/auth', authRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/reservations', reservationsRouter);

app.use(express.static(path.join(__dirname, 'static')));

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
