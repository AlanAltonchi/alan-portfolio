<script lang="ts">
	import { Card } from '$lib/components';
	import type { Snippet } from 'svelte';

	let {
		title,
		subtitle,
		children,
		showCard = true
	} = $props<{
		title: string;
		subtitle?: string;
		children: Snippet;
		showCard?: boolean;
	}>();
</script>

<div class="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
	<div class="w-full max-w-md space-y-8">
		<div class="text-center">
			<h2 class="text-3xl font-bold">{title}</h2>
			{#if subtitle}
				<p class="mt-2 text-gray-600 dark:text-gray-400">
					{@html subtitle}
				</p>
			{/if}
		</div>

		{#if showCard}
			<Card class="mt-8">
				{@render children()}
			</Card>
		{:else}
			<div class="mt-8">
				{@render children()}
			</div>
		{/if}
	</div>
</div>
