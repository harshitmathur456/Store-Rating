import { describe, it, expect } from 'vitest';
import {
  nameSchema,
  emailSchema,
  passwordSchema,
  addressSchema,
  signupSchema,
  createUserSchema,
  createStoreSchema,
  changePasswordSchema,
  submitRatingSchema,
} from '../src/lib/schemas.js';

describe('Validation Schemas (Strict PRD Compliance)', () => {
  describe('Name Schema (20 to 60 characters, trimmed, no control chars)', () => {
    it('accepts valid 20-char name', () => {
      const valid = 'Johnathan Alex Smith'; // 20 chars
      expect(nameSchema.safeParse(valid).success).toBe(true);
    });

    it('accepts valid 60-char name', () => {
      const valid = 'A'.repeat(60);
      expect(nameSchema.safeParse(valid).success).toBe(true);
    });

    it('rejects name shorter than 20 characters', () => {
      const res = nameSchema.safeParse('Short Name');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Name must be between 20 and 60 characters.');
      }
    });

    it('rejects name longer than 60 characters', () => {
      const res = nameSchema.safeParse('A'.repeat(61));
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Name must be between 20 and 60 characters.');
      }
    });

    it('rejects control characters', () => {
      const res = nameSchema.safeParse('Valid Length Name Here\x00WithNull');
      expect(res.success).toBe(false);
    });
  });

  describe('Password Schema (8 to 16 characters, 1 uppercase, 1 special character)', () => {
    it('accepts valid password', () => {
      expect(passwordSchema.safeParse('Admin@1234').success).toBe(true);
      expect(passwordSchema.safeParse('Secret#Pass99').success).toBe(true);
    });

    it('rejects password shorter than 8 characters', () => {
      const res = passwordSchema.safeParse('Ad@12');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe(
          'Password must be 8 to 16 characters and include an uppercase letter and a special character.'
        );
      }
    });

    it('rejects password longer than 16 characters', () => {
      const res = passwordSchema.safeParse('Admin@1234567890123');
      expect(res.success).toBe(false);
    });

    it('rejects password without uppercase letter', () => {
      const res = passwordSchema.safeParse('admin@1234');
      expect(res.success).toBe(false);
    });

    it('rejects password without special character', () => {
      const res = passwordSchema.safeParse('Admin12345');
      expect(res.success).toBe(false);
    });
  });

  describe('Email Schema (Valid format, max 254 chars, trimmed, lowercased)', () => {
    it('normalizes email to lowercase and trims', () => {
      const res = emailSchema.safeParse('  User@Example.COM  ');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe('user@example.com');
      }
    });

    it('rejects invalid email formats', () => {
      const res = emailSchema.safeParse('not-an-email');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Enter a valid email address.');
      }
    });
  });

  describe('Address Schema (Max 400 characters, required)', () => {
    it('accepts valid address', () => {
      expect(addressSchema.safeParse('123 High Street, London, UK').success).toBe(true);
    });

    it('rejects empty address', () => {
      const res = addressSchema.safeParse('');
      expect(res.success).toBe(false);
    });

    it('rejects address exceeding 400 characters', () => {
      const res = addressSchema.safeParse('A'.repeat(401));
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Address must be at most 400 characters.');
      }
    });
  });

  describe('Rating Schema (Integer 1 to 5)', () => {
    it('accepts integer ratings 1 through 5', () => {
      for (let r = 1; r <= 5; r++) {
        expect(submitRatingSchema.safeParse({ rating: r }).success).toBe(true);
      }
    });

    it('rejects non-integer or out of bounds ratings', () => {
      expect(submitRatingSchema.safeParse({ rating: 0 }).success).toBe(false);
      expect(submitRatingSchema.safeParse({ rating: 6 }).success).toBe(false);
      expect(submitRatingSchema.safeParse({ rating: 3.5 }).success).toBe(false);
    });
  });

  describe('Change Password Matching', () => {
    it('validates matching new passwords', () => {
      const res = changePasswordSchema.safeParse({
        currentPassword: 'OldPassword@1',
        newPassword: 'NewPassword@2',
        confirmPassword: 'NewPassword@2',
      });
      expect(res.success).toBe(true);
    });

    it('rejects mismatching new passwords', () => {
      const res = changePasswordSchema.safeParse({
        currentPassword: 'OldPassword@1',
        newPassword: 'NewPassword@2',
        confirmPassword: 'DifferentPassword@2',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Passwords do not match.');
      }
    });
  });

  describe('Mass Assignment Protection (Zod strict)', () => {
    it('rejects unexpected fields in signup payload', () => {
      const res = signupSchema.safeParse({
        name: 'Johnathan Alexander Smith',
        email: 'user@example.com',
        password: 'Password@123',
        address: '123 Test St',
        role: 'ADMIN', // injected field!
      });
      expect(res.success).toBe(false);
    });
  });
});
