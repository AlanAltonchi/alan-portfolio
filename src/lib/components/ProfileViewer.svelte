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
	<div class="flex flex-col sm:flex-row gap-6">
		<!-- Avatar -->
		<div class="flex-shrink-0 flex justify-center sm:justify-start">
			<div class="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
				{#if profile.avatar_url}
					<img 
						src={profile.avatar_url} 
						alt="{profile.name || 'User'}'s avatar" 
						class="w-full h-full object-cover"
						loading="lazy"
					/>
				{:else}
					<svg class="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
						<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
					</svg>
				{/if}
			</div>
		</div>

		<!-- Profile Info -->
		<div class="flex-1 min-w-0">
			<div class="flex items-start justify-between mb-4">
				<div>
					<h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
						{profile.name || 'Anonymous User'}
						{#if isCurrentUser}
							<span class="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
								You
							</span>
						{/if}
					</h3>
					<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
						Last updated: {formatDate(profile.updated_at)}
					</p>
				</div>
			</div>

			<!-- Bio -->
			{#if profile.bio}
				<div class="mb-4">
					<h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">About</h4>
					<p class="text-gray-600 dark:text-gray-400 leading-relaxed">
						{profile.bio}
					</p>
				</div>
			{/if}

			<!-- Interests -->
			{#if profile.interests && profile.interests.length > 0}
				<div>
					<h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Interests</h4>
					<div class="flex flex-wrap gap-2">
						{#each profile.interests as interest}
							<span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
								{interest}
							</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Empty state -->
			{#if !profile.bio && (!profile.interests || profile.interests.length === 0)}
				<div class="text-center py-8">
					<svg class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
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