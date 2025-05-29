import type { SupabaseClient } from '@supabase/supabase-js';
import { goto, invalidate } from '$app/navigation';
import { authStore } from '$lib/stores/auth.svelte';
import type { AuthResult, AuthFormData } from './types.js';
import { loginSchema, signupSchema } from './validation.js';

export class AuthService {
	constructor(private supabase: SupabaseClient) {}

	async signUp(formData: AuthFormData): Promise<AuthResult> {
		try {
			// Validate form data
			const result = signupSchema.safeParse(formData);
			if (!result.success) {
				return {
					success: false,
					error: result.error.errors[0].message
				};
			}

			const { data, error } = await this.supabase.auth.signUp({
				email: formData.email,
				password: formData.password
			});

			if (error) {
				return {
					success: false,
					error: error.message
				};
			}

			return {
				success: true,
				user: data.user,
				session: data.session
			};
		} catch (err) {
			console.error('Signup error:', err);
			return {
				success: false,
				error: 'An unexpected error occurred'
			};
		}
	}

	async signIn(formData: AuthFormData): Promise<AuthResult> {
		try {
			// Validate form data
			const result = loginSchema.safeParse(formData);
			if (!result.success) {
				return {
					success: false,
					error: result.error.errors[0].message
				};
			}

			const { data, error } = await this.supabase.auth.signInWithPassword({
				email: formData.email,
				password: formData.password
			});

			if (error) {
				return {
					success: false,
					error: error.message
				};
			}

			return {
				success: true,
				user: data.user,
				session: data.session
			};
		} catch (err) {
			console.error('Login error:', err);
			return {
				success: false,
				error: 'An unexpected error occurred'
			};
		}
	}

	async handleAuthSuccess(user: any, session: any, redirectPath = '/'): Promise<void> {
		authStore.setAuth(session, user);
		await invalidate('supabase:auth');
		setTimeout(() => goto(redirectPath), 1000);
	}

	async signInDemoUser(email: string): Promise<AuthResult> {
		try {
			const { data, error } = await this.supabase.auth.signInWithPassword({
				email,
				password: 'Demo123456'
			});

			if (error) {
				return {
					success: false,
					error: 'Demo account created but sign-in failed. Please try again.'
				};
			}

			return {
				success: true,
				user: data.user,
				session: data.session
			};
		} catch (err) {
			console.error('Demo signin error:', err);
			return {
				success: false,
				error: 'Failed to sign in to demo account. Please try again.'
			};
		}
	}
}
