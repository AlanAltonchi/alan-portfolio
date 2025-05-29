import { authStore, userStore } from '$lib/stores/auth.svelte';
import { chatStore } from '$lib/stores/chat.svelte';
import { profileStore } from '$lib/stores/profile.svelte';

/**
 * Resets all user-specific stores to their initial state
 * Called when user logs out or when switching between users
 */
export function resetAllUserStores(): void {
	try {
		// Reset auth-related stores
		authStore.clearAuth();
		resetUserStore();

		// Reset chat store (conversations, messages, etc.)
		chatStore.reset();

		// Reset profile store (cached profiles, etc.)
		profileStore.reset();

		console.log('All user stores have been reset');
	} catch (error) {
		console.error('Error resetting user stores:', error);
	}
}

/**
 * Resets the user store to its initial state
 */
function resetUserStore(): void {
	userStore.user = null;
}

/**
 * Resets stores when switching users (not logging out)
 * This is more aggressive and ensures no data leakage
 */
export function resetStoresForUserSwitch(): void {
	try {
		// Clean up any active subscriptions first
		chatStore.destroy();

		// Reset all user-specific data
		resetAllUserStores();

		console.log('Stores reset for user switch');
	} catch (error) {
		console.error('Error resetting stores for user switch:', error);
	}
}
