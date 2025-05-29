<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components';
</script>

<div class="flex min-h-[50vh] items-center justify-center">
	<div class="text-center">
		<h2 class="mb-4 text-2xl font-semibold">Authentication Required</h2>
		<p class="mb-6 text-gray-600 dark:text-gray-400">Please sign in to view your profile.</p>
		<Button onclick={() => goto('/auth/login')}>Sign In</Button>
	</div>
</div>
