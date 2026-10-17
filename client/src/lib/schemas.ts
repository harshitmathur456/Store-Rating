import { z } from 'zod';

// eslint-disable-next-line no-control-regex
const controlCharsRegex = /[\x00-\x1F\x7F]/;

const sanitizedString = (_maxLen?: number) =>
  z
    .string()
    .trim()
    .refine((val) => !controlCharsRegex.test(val), {
      message: 'Must not contain control characters.',
    });

export const nameSchema = sanitizedString(60).pipe(
  z
    .string()
    .min(20, 'Name must be between 20 and 60 characters.')
    .max(60, 'Name must be between 20 and 60 characters.')
);

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, 'Enter a valid email address.')
  .email('Enter a valid email address.');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be 8 to 16 characters and include an uppercase letter and a special character.')
  .max(16, 'Password must be 8 to 16 characters and include an uppercase letter and a special character.')
  .refine((val) => /[A-Z]/.test(val), {
    message: 'Password must be 8 to 16 characters and include an uppercase letter and a special character.',
  })
  .refine((val) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(val), {
    message: 'Password must be 8 to 16 characters and include an uppercase letter and a special character.',
  });

export const addressSchema = sanitizedString(400).pipe(
  z
    .string()
    .min(1, 'Address is required.')
    .max(400, 'Address must be at most 400 characters.')
);

export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  address: addressSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required.'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const createUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  address: addressSchema,
  role: z.enum(['ADMIN', 'USER', 'OWNER'], {
    errorMap: () => ({ message: 'Invalid role.' }),
  }),
});

export const createStoreSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  address: addressSchema,
  ownerId: z.string().uuid().optional().nullable(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateStoreInput = z.infer<typeof createStoreSchema>;
