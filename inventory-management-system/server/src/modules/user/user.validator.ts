import { z } from 'zod';

const registerSchema = z.object({
  name: z.string({ required_error: 'Name is required' }).trim().min(2, { message: 'Name must have at least 2 characters' }),
  email: z.string({ required_error: 'Email is required' }).trim().email({ message: 'Please enter a valid email address' }),
  password: z.string({ required_error: 'Password is required' }).min(6, { message: 'Password must have at least 6 characters' }),
  confirmPassword: z.string().optional()
});

const updatedProfileSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  avatar: z.string().optional()
});

const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).trim().email({ message: 'Please enter a valid email address' }),
  password: z.string({ required_error: 'Password is required' }).min(1, { message: 'Password is required' })
});

const changePasswordSchema = z.object({
  oldPassword: z
    .string({ required_error: 'Old Password is required!' })
    .min(6, { message: 'old password must have 6 characters' }),
  newPassword: z
    .string({ required_error: 'New Password is required!' })
    .min(6, { message: 'new password must have 6 characters' })
});

const userValidator = { registerSchema, loginSchema, updatedProfileSchema, changePasswordSchema };
export default userValidator;
