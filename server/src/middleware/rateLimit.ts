import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const globalLimiter = rateLimit({
  windowMs: env.NODE_ENV === 'development' ? 60 * 1000 : env.RATE_LIMIT_WINDOW_MS,
  max: env.NODE_ENV === 'development' ? 2000 : env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later.',
    },
  },
});

export const authLimiter = rateLimit({
  windowMs: env.NODE_ENV === 'development' ? 60 * 1000 : env.RATE_LIMIT_WINDOW_MS,
  max: env.NODE_ENV === 'development' ? 100 : env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = req.body?.email || '';
    return `${req.ip}:${email}`;
  },
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many attempts, please try again later.',
    },
  },
});
