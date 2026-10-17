import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';

interface TokenPayload {
  sub: string;
  role: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as any,
    algorithm: 'HS256',
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET, {
    algorithms: ['HS256'],
  }) as TokenPayload;
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getRefreshTokenExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + env.JWT_REFRESH_EXPIRY_DAYS);
  return d;
}
