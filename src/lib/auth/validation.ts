import { z } from 'zod';

export const loginSchema = z.object({
	email: z.string().email('Please enter a valid email address'),
	password: z.string().min(6, 'Password must be at least 6 characters')
});

export const signupSchema = z
	.object({
		email: z.string().email('Please enter a valid email address'),
		password: z.string().min(6, 'Password must be at least 6 characters'),
		confirmPassword: z.string(),
		name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters')
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword']
	});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
