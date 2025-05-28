import type { SupabaseClient, Session, User } from '@supabase/supabase-js';
import { invalidate } from '$app/navigation';
import { authStore, setUserProfile } from '$lib/stores/auth.svelte';
import { validateUserExists, handleInvalidSession, loadUserProfile } from './auth-validation';

/**
 * Handles user validation and profile loading on mount
 */
export async function handleUserOnMount(
	supabase: SupabaseClient,
	user: User | null
): Promise<void> {
	if (!user?.id) return;

	const exists = await validateUserExists(supabase, user.id);
	if (!exists) {
		await handleInvalidSession(supabase);
		return;
	}

	const profile = await loadUserProfile(supabase, user.id);
	setUserProfile(profile);
}

/**
 * Handles auth state changes
 */
export async function handleAuthStateChange(
	supabase: SupabaseClient,
	event: string,
	newSession: Session | null,
	currentSession: Session | null
): Promise<void> {
	// Validate user exists when signing in or refreshing token
	if (newSession?.user?.id && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
		const userExists = await validateUserExists(supabase, newSession.user.id);
		if (!userExists) {
			await handleInvalidSession(supabase);
			return;
		}

		const profile = await loadUserProfile(supabase, newSession.user.id);
		setUserProfile(profile);
	}

	// Invalidate auth if session changed
	if (newSession?.expires_at !== currentSession?.expires_at) {
		invalidate('supabase:auth');
	}

	// Update auth store for state changes
	if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
		authStore.setAuth(newSession, newSession?.user ?? null);
	} else if (event === 'SIGNED_OUT') {
		authStore.clearAuth();
	}
} 