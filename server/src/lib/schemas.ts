import { z } from 'zod';

// Control characters and null bytes regex
const controlCharsRegex = /[\x00-\x1F\x7F]/;

const sanitizedString = (maxLen: number) =>
  z
    .string()
    .trim()
    .refine((val) => !controlCharsRegex.test(val), {
      message: 'Must not contain control characters.',
    });

export const nameSchema = sanitizedString(60)
  .pipe(
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
  .refine((val) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(val), {
    message: 'Password must be 8 to 16 characters and include an uppercase letter and a special character.',
  });

export const addressSchema = sanitizedString(400).pipe(
  z
    .string()
    .min(1, 'Address is required.')
    .max(400, 'Address must be at most 400 characters.')
);

export const roleSchema = z.enum(['ADMIN', 'USER', 'OWNER'], {
  errorMap: () => ({ message: 'Invalid role.' }),
});

export const ratingSchema = z
  .number()
  .int('Rating must be a whole number from 1 to 5.')
  .min(1, 'Rating must be a whole number from 1 to 5.')
  .max(5, 'Rating must be a whole number from 1 to 5.');

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const sortOrderSchema = z.enum(['asc', 'desc']).default('asc');

// Auth schemas
export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  address: addressSchema,
}).strict();

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required.'),
}).strict();

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your new password.'),
}).strict().refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

// Admin schemas
export const createUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  address: addressSchema,
  role: roleSchema,
}).strict();

export const createStoreSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  address: addressSchema,
  ownerId: z.string().uuid().optional().nullable(),
}).strict();

// Rating schema
export const submitRatingSchema = z.object({
  rating: ratingSchema,
}).strict();

// Filter schemas
export const userFilterSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  role: roleSchema.optional(),
  sortBy: z.enum(['name', 'email', 'address', 'role']).default('name'),
  order: sortOrderSchema,
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const storeFilterSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  sortBy: z.enum(['name', 'email', 'address', 'rating']).default('name'),
  order: sortOrderSchema,
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const userStoreFilterSchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  sortBy: z.enum(['name', 'avgRating']).default('name'),
  order: sortOrderSchema,
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const ownerRatingsFilterSchema = z.object({
  sortBy: z.enum(['name', 'rating', 'date']).default('date'),
  order: sortOrderSchema,
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});
