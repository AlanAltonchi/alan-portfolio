<script lang="ts">
	import { Card } from '$lib/components';

	let {
		title,
		subtitle,
		children,
		showCard = true
	} = $props<{
		title: string;
		subtitle?: string;
		children: any;
		showCard?: boolean;
	}>();
</script>

<div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
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