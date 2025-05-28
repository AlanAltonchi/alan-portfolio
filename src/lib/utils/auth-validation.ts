import type { SupabaseClient } from '@supabase/supabase-js';
import { goto } from '$app/navigation';
import { authStore } from '$lib/stores/auth.svelte';

/**
 * Validates if a user still exists in the database
 */
export async function validateUserExists(
	supabase: SupabaseClient,
	userId: string
): Promise<boolean> {
	try {
		const { data: profile, error: profileError } = await supabase
			.from('profiles')
			.select('id')
			.eq('id', userId)
			.single();
		
		return !profileError && !!profile;
	} catch {
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
export async function loadUserProfile(
	supabase: SupabaseClient,
	userId: string
): Promise<any> {
	const { data } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', userId)
		.single();
	
	return data;
} 