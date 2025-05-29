<script lang="ts">
	import { Button } from '$lib/components';

	let { error, onRetry }: { error: string; onRetry: () => void } = $props();
</script>

<div class="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
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
			<h3 class="font-medium text-red-800 dark:text-red-200">Error loading profile</h3>
			<p class="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
		</div>
	</div>
	<Button variant="outline" size="sm" onclick={onRetry} class="mt-4">Try Again</Button>
</div>
