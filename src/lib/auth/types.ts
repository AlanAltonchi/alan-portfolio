import type { User, Session } from '@supabase/supabase-js';

export interface DemoUserData {
	email: string;
	password: string;
	name: string;
	company: string;
	role: string;
}

export interface AuthFormData {
	email: string;
	password: string;
	confirmPassword?: string;
	name?: string;
}

export interface AuthState {
	loading: boolean;
	error: string;
	success: string;
}

export interface AuthResult {
	success: boolean;
	error?: string;
	user?: User;
	session?: Session;
}
