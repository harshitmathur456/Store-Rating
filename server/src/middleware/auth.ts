import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/tokens.js';
import prisma from '../lib/db.js';
import { ApiError } from './errorHandler.js';
import { UserRole } from '@prisma/client';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: {
        id: string;
        name: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.access_token;

    if (!token) {
      throw new ApiError(401, 'Authentication required.', 'UNAUTHENTICATED');
    }

    const payload = verifyAccessToken(token);

    // Load user from DB on every request for immediate role/deletion changes
    prisma.user
      .findUnique({
        where: { id: payload.sub },
        select: { id: true, name: true, email: true, role: true },
      })
      .then((user) => {
        if (!user) {
          return next(new ApiError(401, 'User not found.', 'UNAUTHENTICATED'));
        }
        req.user = user;
        next();
      })
      .catch(next);
  } catch {
    next(new ApiError(401, 'Invalid or expired token.', 'UNAUTHENTICATED'));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required.', 'UNAUTHENTICATED'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to access this resource.', 'FORBIDDEN'));
    }
    next();
  };
}

/** CSRF protection: require custom header on state-changing requests */
export function csrfProtection(req: Request, _res: Response, next: NextFunction) {
  const method = req.method.toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const xRequestedWith = req.headers['x-requested-with'];
    if (xRequestedWith !== 'fetch') {
      return next(new ApiError(403, 'Missing CSRF header.', 'CSRF_ERROR'));
    }
  }
  next();
}
