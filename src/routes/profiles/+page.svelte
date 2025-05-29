<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Button, ProfileViewer } from '$lib/components';
	import { authStore } from '$lib/stores/auth.svelte';
	import { profileStore } from '$lib/stores/profile.svelte';

	// Redirect to login if not authenticated
	onMount(() => {
		if (!authStore.isAuthenticated) {
			goto('/auth/login');
			return;
		}

		profileStore.fetchAllProfiles();
	});

	function refreshProfiles() {
		profileStore.fetchAllProfiles();
	}
</script>

<svelte:head>
	<title>User Profiles</title>
</svelte:head>

{#if authStore.isAuthenticated}
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold">User Profiles</h1>
				<p class="mt-2 text-gray-600 dark:text-gray-400">Discover and connect with other users</p>
			</div>
		</div>

		{#if profileStore.loading}
			<div class="flex items-center justify-center py-12">
				<div class="flex items-center space-x-2">
					<svg class="h-5 w-5 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<span class="text-gray-600 dark:text-gray-400">Loading profiles...</span>
				</div>
			</div>
		{:else if profileStore.error}
			<div
				class="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20"
			>
				<div class="flex items-center">
					<svg
						class="mr-2 h-5 w-5 text-red-600 dark:text-red-400"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						></path>
					</svg>
					<div>
						<h3 class="font-medium text-red-800 dark:text-red-200">Error loading profiles</h3>
						<p class="mt-1 text-sm text-red-700 dark:text-red-300">{profileStore.error}</p>
					</div>
				</div>
				<Button variant="outline" size="sm" onclick={refreshProfiles} class="mt-4">
					Try Again
				</Button>
			</div>
		{:else if profileStore.profiles.length === 0}
			<div class="py-12 text-center">
				<svg
					class="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-gray-600"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
					></path>
				</svg>
				<h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">No profiles found</h3>
				<p class="mb-4 text-gray-600 dark:text-gray-400">
					There are no user profiles to display at the moment.
				</p>
				<Button onclick={refreshProfiles} variant="outline">Refresh</Button>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{#each profileStore.profiles as profile (profile.id)}
					<ProfileViewer {profile} isCurrentUser={profile.id === authStore.user?.id} />
				{/each}
			</div>

			<div class="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
				Showing {profileStore.profiles.length} profile{profileStore.profiles.length === 1
					? ''
					: 's'}
			</div>
		{/if}
	</div>
{:else}
	<div class="flex min-h-[50vh] items-center justify-center">
		<div class="text-center">
			<h2 class="mb-4 text-2xl font-semibold">Authentication Required</h2>
			<p class="mb-6 text-gray-600 dark:text-gray-400">Please sign in to view user profiles.</p>
			<Button onclick={() => goto('/auth/login')}>Sign In</Button>
		</div>
	</div>
{/if}
