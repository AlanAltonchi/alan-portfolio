import type { SupabaseClient, Session, User } from '@supabase/supabase-js';
import { invalidate } from '$app/navigation';
import { authStore, setUserProfile } from '$lib/stores/auth.svelte';
import { validateUserExists, handleInvalidSession, loadUserProfile } from './auth-validation';
import { cleanupAllSubscriptions } from './subscription-manager';
import { resetStoresForUserSwitch, resetAllUserStores } from './store-reset';

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
 * Handles auth state changes with proper session validation and cleanup
 */
export async function handleAuthStateChange(
	supabase: SupabaseClient,
	event: string,
	newSession: Session | null,
	currentSession: Session | null
): Promise<void> {

	// Clean up any existing subscriptions when auth state changes
	cleanupAllSubscriptions();

	// Handle sign out immediately - reset all stores
	if (!newSession) {
		resetAllUserStores();
		return;
	}

	// If switching users (different user ID), reset stores to prevent data leakage
	if (currentSession?.user?.id && newSession?.user?.id && 
		currentSession.user.id !== newSession.user.id) {
		resetStoresForUserSwitch();
	}

	// Invalidate auth if session changed
	if (newSession?.expires_at !== currentSession?.expires_at) {
		invalidate('supabase:auth');
	}

	// Use setTimeout to handle async operations properly (like the working example)
	setTimeout(async () => {
		try {
			// Get fresh user data to validate session
			const { data: userData, error: userError } = await supabase.auth.getUser();
			
			if (userError || !userData.user) {
				console.error('Failed to get user:', userError);
				await handleInvalidSession(supabase);
				return;
			}

			// Validate user exists in database
			const userExists = await validateUserExists(supabase, userData.user.id);
			if (!userExists) {
				await handleInvalidSession(supabase);
				return;
			}

			// Load user profile
			const profile = await loadUserProfile(supabase, userData.user.id);
			setUserProfile(profile);

			// Update auth store with validated session and user
			authStore.setAuth(newSession, userData.user);
			

		} catch (error) {
			console.error('Error in auth state change handler:', error);
			await handleInvalidSession(supabase);
		}
	}, 0);
} 