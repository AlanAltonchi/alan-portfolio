<script lang="ts">
	import { onMount } from 'svelte';
	import { DeveloperDrawer, Navigation, DeveloperModeToggle } from '$lib/components';
	import { authStore } from '$lib/stores/auth.svelte';
	import { handleUserOnMount, handleAuthStateChange } from '$lib/utils';
	import '../app.css';

	let { data, children } = $props();
	let { session, supabase, user } = $derived(data);

	// Developer mode state
	let showDeveloperDrawer = $state(false);

	// Update auth store when data changes
	$effect(() => {
		authStore.setAuth(session, user);
	});

	onMount(() => {
		// Handle user validation and profile loading on mount
		handleUserOnMount(supabase, user);

		// Set up auth state change listener
		const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
			await handleAuthStateChange(supabase, event, newSession, session);
		});

		return () => data.subscription.unsubscribe();
	});
</script>

<div class="min-h-screen bg-white text-gray-900 transition-colors dark:bg-gray-900 dark:text-white">
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
