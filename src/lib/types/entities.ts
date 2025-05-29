import type { Tables } from './database.js';

// Main entity types (using Row types from database)
export type User = Tables<'users'>;
export type Profile = Tables<'profiles'>;
export type Task = Tables<'tasks'>;
export type Message = Tables<'messages'>;
export type Conversation = Tables<'conversations'>;
export type Email = Tables<'emails'>;
export type Event = Tables<'events'>;
export type TypingStatus = Tables<'typing_status'>;

// Extended types with relationships (for when you need joined data)
export type MessageWithSender = Message & {
	sender: User;
	receiver: User;
};

// This matches the actual query structure from the server
export type ConversationWithUsers = Conversation & {
	user_a_profile: {
		id: string;
		email: string;
		profiles: {
			name: string | null;
			avatar_url: string | null;
		} | null;
	};
	user_b_profile: {
		id: string;
		email: string;
		profiles: {
			name: string | null;
			avatar_url: string | null;
		} | null;
	};
};

export type UserWithProfile = User & {
	profile: Profile;
};

// Task status enum (based on your database schema)
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

// Common utility types
export type ID = string;
export type Timestamp = string;

// API response types
export type ApiResponse<T> = {
	data: T | null;
	error: string | null;
	success: boolean;
};

export type PaginatedResponse<T> = ApiResponse<T[]> & {
	pagination: {
		page: number;
		limit: number;
		total: number;
		hasMore: boolean;
	};
};
