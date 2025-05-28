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

<Card class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
	<div class="text-center">
		<div class="flex justify-center mb-3">
			<div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
				<Sparkles class="w-6 h-6 text-white" />
			</div>
		</div>
		<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
			Quick Demo Access for Recruiters
		</h3>
		<p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
			Generate a demo account instantly to explore all features without registration. Perfect for quick evaluation!
		</p>
		
		<form 
			method="POST" 
			action="?/createDemoUser"
			use:enhance={handleEnhance}
		>
			<input type="hidden" name="userData" value={JSON.stringify(generateDemoUser())} />
			<Button
				type="submit"
				variant="primary"
				size="lg"
				class="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
				{loading}
				disabled={loading}
			>
				<User class="w-4 h-4 mr-2" />
				{loading ? 'Creating Demo Account...' : 'Generate Demo User & Sign In'}
			</Button>
		</form>
		
		<p class="text-xs text-gray-500 dark:text-gray-500 mt-2">
			Demo accounts are automatically cleaned up every 24 hours
		</p>
	</div>
</Card> 