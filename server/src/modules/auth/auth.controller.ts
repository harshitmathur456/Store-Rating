import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { env } from '../../config/env.js';

const authService = new AuthService();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export class AuthController {
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.signup(req.body);
      res.status(201).json({
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessToken, refreshToken, user } = await authService.login(req.body);

      res.cookie('access_token', accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie('refresh_token', refreshToken, {
        ...COOKIE_OPTIONS,
        path: '/api/auth/refresh',
        maxAge: env.JWT_REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      });

      // Also set refresh_token path for logout
      res.cookie('refresh_token_logout', refreshToken, {
        ...COOKIE_OPTIONS,
        path: '/api/auth/logout',
        maxAge: env.JWT_REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      });

      res.json({
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const oldRefreshToken = req.cookies?.refresh_token;
      if (!oldRefreshToken) {
        res.status(401).json({
          error: { code: 'UNAUTHENTICATED', message: 'No refresh token.' },
        });
        return;
      }

      const { accessToken, refreshToken } = await authService.refresh(oldRefreshToken);

      res.cookie('access_token', accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refresh_token', refreshToken, {
        ...COOKIE_OPTIONS,
        path: '/api/auth/refresh',
        maxAge: env.JWT_REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      });

      res.cookie('refresh_token_logout', refreshToken, {
        ...COOKIE_OPTIONS,
        path: '/api/auth/logout',
        maxAge: env.JWT_REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      });

      res.json({ data: { message: 'Token refreshed.' } });
    } catch (err) {
      // Clear cookies on refresh failure
      res.clearCookie('access_token', COOKIE_OPTIONS);
      res.clearCookie('refresh_token', { ...COOKIE_OPTIONS, path: '/api/auth/refresh' });
      res.clearCookie('refresh_token_logout', { ...COOKIE_OPTIONS, path: '/api/auth/logout' });
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refresh_token_logout || req.cookies?.refresh_token;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      res.clearCookie('access_token', COOKIE_OPTIONS);
      res.clearCookie('refresh_token', { ...COOKIE_OPTIONS, path: '/api/auth/refresh' });
      res.clearCookie('refresh_token_logout', { ...COOKIE_OPTIONS, path: '/api/auth/logout' });

      res.json({ data: { message: 'Logged out successfully.' } });
    } catch (err) {
      // Clear cookies even on error
      res.clearCookie('access_token', COOKIE_OPTIONS);
      res.clearCookie('refresh_token', { ...COOKIE_OPTIONS, path: '/api/auth/refresh' });
      res.clearCookie('refresh_token_logout', { ...COOKIE_OPTIONS, path: '/api/auth/logout' });
      next(err);
    }
  }

  async me(req: Request, res: Response) {
    res.json({
      data: {
        id: req.user!.id,
        name: req.user!.name,
        email: req.user!.email,
        role: req.user!.role,
      },
    });
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.changePassword(req.user!.id, req.body);
      res.json({ data: { message: 'Password updated successfully.' } });
    } catch (err) {
      next(err);
    }
  }
}
