<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		ProfileEditor,
		ProfileViewer,
		ProfilePageHeader,
		ProfileLoadingState,
		ProfileErrorState,
		AuthRequiredState
	} from '$lib/components';
	import { authStore } from '$lib/stores/auth.svelte';
	import { profileStore } from '$lib/stores/profile.svelte';

	let showEditor = $state(false);

	// Redirect to login if not authenticated
	onMount(() => {
		if (!authStore.isAuthenticated) {
			goto('/auth/login');
			return;
		}
	});

	function handleRetry() {
		// Reset error state and reload the page to retry
		profileStore.setError(null);
		window.location.reload();
	}
</script>

<svelte:head>
	<title>My Profile</title>
</svelte:head>

{#if authStore.isAuthenticated}
	<div class="space-y-6">
		<ProfilePageHeader onEditClick={() => (showEditor = true)} />

		{#if profileStore.loading}
			<ProfileLoadingState />
		{:else if profileStore.error}
			<ProfileErrorState error={profileStore.error} onRetry={handleRetry} />
		{:else if profileStore.currentProfile}
			<ProfileViewer profile={profileStore.currentProfile} isCurrentUser={true} />
		{/if}
	</div>

	<ProfileEditor bind:open={showEditor} />
{:else}
	<AuthRequiredState />
{/if}
