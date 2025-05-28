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
}

export interface AuthState {
	loading: boolean;
	error: string;
	success: string;
}

export interface AuthResult {
	success: boolean;
	error?: string;
	user?: any;
	session?: any;
} 