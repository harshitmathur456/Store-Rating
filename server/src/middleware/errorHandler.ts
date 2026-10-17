import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../lib/logger.js';
import { ZodError } from 'zod';

interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: Array<{ field: string; message: string }>;
}

export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = uuidv4();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: Date.now() - start,
      requestId: req.requestId,
    });
  });
  next();
}

export function errorHandler(err: AppError, req: Request, res: Response, _next: NextFunction) {
  // Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed.',
        details,
      },
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  if (statusCode >= 500) {
    logger.error({ err, requestId: req.requestId }, 'Unhandled error');
  }

  res.status(statusCode).json({
    error: {
      code,
      message: statusCode >= 500 ? 'An unexpected error occurred.' : err.message,
      details: err.details || undefined,
    },
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found.`,
    },
  });
}

export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: Array<{ field: string; message: string }>;

  constructor(
    statusCode: number,
    message: string,
    code: string = 'ERROR',
    details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
