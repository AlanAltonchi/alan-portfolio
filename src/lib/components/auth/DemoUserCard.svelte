<script lang="ts">
	import { Button, Card } from '$lib/components';
	import { generateDemoUser } from '$lib/auth';
	import { enhance } from '$app/forms';
	import { User, Sparkles } from 'lucide-svelte';
	import type { SubmitFunction } from '@sveltejs/kit';

	let { loading = $bindable(false) } = $props();

	const handleEnhance: SubmitFunction = () => {
		loading = true;

		return async ({ result, update }) => {
			await update();
		};
	};
</script>

<Card
	class="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 dark:border-blue-800 dark:from-blue-900/20 dark:to-purple-900/20"
>
	<div class="text-center">
		<div class="mb-3 flex justify-center">
			<div
				class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
			>
				<Sparkles class="h-6 w-6 text-white" />
			</div>
		</div>
		<h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
			Quick Demo Access for Recruiters
		</h3>
		<p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
			Generate a demo account instantly to explore all features without registration. Perfect for
			quick evaluation!
		</p>

		<form method="POST" action="?/createDemoUser" use:enhance={handleEnhance}>
			<input type="hidden" name="userData" value={JSON.stringify(generateDemoUser())} />
			<Button
				type="submit"
				variant="primary"
				size="lg"
				class="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
				{loading}
				disabled={loading}
			>
				<User class="mr-2 h-4 w-4" />
				{loading ? 'Creating Demo Account...' : 'Generate Demo User & Sign In'}
			</Button>
		</form>

		<p class="mt-2 text-xs text-gray-500 dark:text-gray-500">
			Demo accounts are automatically cleaned up every 24 hours
		</p>
	</div>
</Card>
