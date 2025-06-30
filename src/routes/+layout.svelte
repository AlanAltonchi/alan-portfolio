<script lang="ts">
	import { page } from '$app/stores';
	import { DeveloperDrawer, DeveloperModeToggle, Navigation } from '$lib/components';
	import { authStore } from '$lib/stores/auth.svelte';
	import { handleAuthStateChange, handleUserOnMount } from '$lib/utils';
	import { setupNavigationPreloading } from '$lib/utils/preload';
	import { getSubscriptionManager } from '$lib/utils/subscription-manager';
	import { onDestroy, onMount } from 'svelte';
	import '../app.css';

	let { data, children } = $props();
	let { session, supabase, user } = $derived(data);

	// Developer mode state
	let showDeveloperDrawer = $state(false);

	// Store auth subscription for cleanup
	let authSubscription: { data: { subscription: { unsubscribe: () => void } } } | null = null;

	// Update auth store when data changes
	$effect(() => {
		authStore.setAuth(session, user);
	});

	onMount(() => {
		// Handle user validation and profile loading on mount
		handleUserOnMount(supabase, user);

		// Initialize subscription manager
		getSubscriptionManager(supabase);

		// Set up navigation preloading
		const cleanupPreloading = setupNavigationPreloading();

		// Set up auth state change listener
		authSubscription = supabase.auth.onAuthStateChange(async (event, newSession) => {
			await handleAuthStateChange(supabase, event, newSession, session);
		});

		// Return cleanup function
		return () => {
			if (cleanupPreloading) cleanupPreloading();
		};
	});

	onDestroy(() => {
		// Clean up auth subscription
		if (authSubscription?.data?.subscription) {
			authSubscription.data.subscription.unsubscribe();
			authSubscription = null;
		}

		// Clean up all other subscriptions
		const subscriptionManager = getSubscriptionManager(supabase);
		subscriptionManager.cleanup();
	});
</script>

{#if $page.url.pathname.includes('prototypes')}
	{@render children()}
{:else}
	<div
		class="min-h-screen bg-white text-gray-900 transition-colors dark:bg-gray-900 dark:text-white"
	>
		<!-- Header with navigation -->
		<Navigation {supabase} />

		<!-- Main content -->
		<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			{@render children()}
		</main>

		<!-- Developer Mode Toggle Button -->
		<DeveloperModeToggle onclick={() => (showDeveloperDrawer = !showDeveloperDrawer)} />

		<!-- Developer Drawer -->
		<DeveloperDrawer open={showDeveloperDrawer} onclose={() => (showDeveloperDrawer = false)} />
	</div>
{/if}
