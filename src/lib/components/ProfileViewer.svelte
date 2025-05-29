<script lang="ts">
	import { onMount } from 'svelte';
	import { Card } from '$lib/components';
	import type { Profile } from '$lib/stores/profile.svelte';

	let { profile, isCurrentUser = false } = $props<{
		profile: Profile;
		isCurrentUser?: boolean;
	}>();

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<Card class="p-6">
	<div class="flex flex-col gap-6 sm:flex-row">
		<!-- Avatar -->
		<div class="flex flex-shrink-0 justify-center sm:justify-start">
			<div
				class="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
			>
				{#if profile.avatar_url}
					<img
						src={profile.avatar_url}
						alt="{profile.name || 'User'}'s avatar"
						class="h-full w-full object-cover"
						loading="lazy"
					/>
				{:else}
					<svg class="h-12 w-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
						/>
					</svg>
				{/if}
			</div>
		</div>

		<!-- Profile Info -->
		<div class="min-w-0 flex-1">
			<div class="mb-4 flex items-start justify-between">
				<div>
					<h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
						{profile.name || 'Anonymous User'}
						{#if isCurrentUser}
							<span
								class="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
							>
								You
							</span>
						{/if}
					</h3>
					<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Last updated: {formatDate(profile.updated_at)}
					</p>
				</div>
			</div>

			<!-- Bio -->
			{#if profile.bio}
				<div class="mb-4">
					<h4 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">About</h4>
					<p class="leading-relaxed text-gray-600 dark:text-gray-400">
						{profile.bio}
					</p>
				</div>
			{/if}

			<!-- Interests -->
			{#if profile.interests && profile.interests.length > 0}
				<div>
					<h4 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Interests</h4>
					<div class="flex flex-wrap gap-2">
						{#each profile.interests as interest}
							<span
								class="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800 dark:bg-gray-700 dark:text-gray-200"
							>
								{interest}
							</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Empty state -->
			{#if !profile.bio && (!profile.interests || profile.interests.length === 0)}
				<div class="py-8 text-center">
					<svg
						class="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
						></path>
					</svg>
					<p class="text-gray-500 dark:text-gray-400">
						{#if isCurrentUser}
							Your profile is looking a bit empty. Add some information about yourself!
						{:else}
							This user hasn't added any information to their profile yet.
						{/if}
					</p>
				</div>
			{/if}
		</div>
	</div>
</Card>
