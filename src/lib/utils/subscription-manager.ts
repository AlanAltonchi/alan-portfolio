import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

/**
 * Manages realtime subscriptions and their cleanup
 */
export class SubscriptionManager {
	private subscriptions: RealtimeChannel[] = [];
	private supabase: SupabaseClient;

	constructor(supabase: SupabaseClient) {
		this.supabase = supabase;
	}

	/**
	 * Add a subscription to be managed
	 */
	addSubscription(subscription: RealtimeChannel): void {
		this.subscriptions.push(subscription);
	}

	/**
	 * Remove a specific subscription
	 */
	removeSubscription(subscription: RealtimeChannel): void {
		const index = this.subscriptions.indexOf(subscription);
		if (index > -1) {
			this.subscriptions.splice(index, 1);
			this.supabase.removeChannel(subscription);
		}
	}

	/**
	 * Clean up all subscriptions
	 */
	cleanup(): void {
		this.subscriptions.forEach(subscription => {
			this.supabase.removeChannel(subscription);
		});
		this.subscriptions = [];
	}

	/**
	 * Get count of active subscriptions
	 */
	getSubscriptionCount(): number {
		return this.subscriptions.length;
	}

	/**
	 * Check if there are any active subscriptions
	 */
	hasActiveSubscriptions(): boolean {
		return this.subscriptions.length > 0;
	}
}

// Global subscription manager instance
let globalSubscriptionManager: SubscriptionManager | null = null;

/**
 * Get or create the global subscription manager
 */
export function getSubscriptionManager(supabase: SupabaseClient): SubscriptionManager {
	if (!globalSubscriptionManager) {
		globalSubscriptionManager = new SubscriptionManager(supabase);
	}
	return globalSubscriptionManager;
}

/**
 * Clean up all global subscriptions
 */
export function cleanupAllSubscriptions(): void {
	if (globalSubscriptionManager) {
		globalSubscriptionManager.cleanup();
	}
} 