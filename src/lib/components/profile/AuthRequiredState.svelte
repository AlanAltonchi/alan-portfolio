<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components';
</script>

<div class="flex items-center justify-center min-h-[50vh]">
	<div class="text-center">
		<h2 class="text-2xl font-semibold mb-4">Authentication Required</h2>
		<p class="text-gray-600 dark:text-gray-400 mb-6">
			Please sign in to view your profile.
		</p>
		<Button onclick={() => goto('/auth/login')}>
			Sign In
		</Button>
	</div>
</div> 