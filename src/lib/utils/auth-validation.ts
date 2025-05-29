import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { goto } from '$app/navigation';
import { authStore } from '$lib/stores/auth.svelte';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';

/**
 * Validates if a user still exists in the database
 */
export async function validateUserExists(
	supabase: SupabaseClient,
	userId: string
): Promise<boolean> {
	try {
		// Use the provided supabase client instead of creating a new one
		const { data: profile, error: profileError } = await supabase
			.from('profiles')
			.select('id')
			.eq('id', userId)
			.single();

		// Return true if no error and profile exists
		return !profileError && !!profile;
	} catch (error) {
		console.error('Error validating user exists:', error);
		return false;
	}
}

/**
 * Handles invalid sessions by clearing auth and redirecting
 */
export async function handleInvalidSession(supabase: SupabaseClient): Promise<void> {
	authStore.clearAuth();
	await supabase.auth.signOut();
	goto('/');
}

/**
 * Loads user profile data
 */
export async function loadUserProfile(supabase: SupabaseClient, userId: string): Promise<any> {
	try {
		const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

		if (error) {
			console.error('Error loading user profile:', error);
			return null;
		}

		return data;
	} catch (error) {
		console.error('Error loading user profile:', error);
		return null;
	}
}
