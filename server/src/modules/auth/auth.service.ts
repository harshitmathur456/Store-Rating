import prisma from '../../lib/db.js';
import { hashPassword, verifyPassword, verifyDummyPassword } from '../../lib/password.js';
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
} from '../../lib/tokens.js';
import { ApiError } from '../../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

interface SignupInput {
  name: string;
  email: string;
  password: string;
  address: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 5;

export class AuthService {
  async signup(input: SignupInput) {
    const existing = await prisma.user.findFirst({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw new ApiError(409, 'An account with this email already exists.', 'CONFLICT', [
        { field: 'email', message: 'An account with this email already exists.' },
      ]);
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        address: input.address,
        role: 'USER', // Always USER on public signup
      },
    });

    return user;
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findFirst({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      // Timing-safe: compare against dummy hash
      await verifyDummyPassword();
      throw new ApiError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    // Check lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ApiError(
        401,
        'Account is temporarily locked. Try again later.',
        'ACCOUNT_LOCKED'
      );
    }

    const valid = await verifyPassword(user.passwordHash, input.password);

    if (!valid) {
      const failedCount = user.failedLoginCount + 1;
      const updateData: { failedLoginCount: number; lockedUntil?: Date } = {
        failedLoginCount: failedCount,
      };

      if (failedCount >= MAX_FAILED_ATTEMPTS) {
        updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      throw new ApiError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    // Reset failed login count on success
    if (user.failedLoginCount > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: 0, lockedUntil: null },
      });
    }

    // Generate tokens
    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = generateRefreshToken();
    const familyId = uuidv4();

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        familyId,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }

  async refresh(oldToken: string) {
    const oldHash = hashToken(oldToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: oldHash },
      include: { user: true },
    });

    if (!storedToken) {
      throw new ApiError(401, 'Invalid refresh token.', 'UNAUTHENTICATED');
    }

    // Check if already revoked (reuse detection)
    if (storedToken.revokedAt) {
      // Revoke entire family
      await prisma.refreshToken.updateMany({
        where: { familyId: storedToken.familyId },
        data: { revokedAt: new Date() },
      });
      throw new ApiError(401, 'Token reuse detected. All sessions revoked.', 'UNAUTHENTICATED');
    }

    // Check expiry
    if (storedToken.expiresAt < new Date()) {
      throw new ApiError(401, 'Refresh token expired.', 'UNAUTHENTICATED');
    }

    // Revoke old token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Issue new tokens
    const accessToken = signAccessToken({
      sub: storedToken.user.id,
      role: storedToken.user.role,
    });
    const newRefreshToken = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        userId: storedToken.user.id,
        tokenHash: hashToken(newRefreshToken),
        familyId: storedToken.familyId,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(token: string) {
    const tokenHash = hashToken(token);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (storedToken && !storedToken.revokedAt) {
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });
    }
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError(404, 'User not found.', 'NOT_FOUND');
    }

    const valid = await verifyPassword(user.passwordHash, input.currentPassword);
    if (!valid) {
      throw new ApiError(400, 'Current password is incorrect.', 'VALIDATION_ERROR', [
        { field: 'currentPassword', message: 'Current password is incorrect.' },
      ]);
    }

    const newHash = await hashPassword(input.newPassword);

    // Update password and revoke all refresh tokens
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      }),
      prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }
}
