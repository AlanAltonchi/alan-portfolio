<script lang="ts">
	import { Button } from '$lib/components';

	let { onEditClick }: { onEditClick: () => void } = $props();
</script>

<div class="flex items-center justify-between">
	<div>
		<h1 class="text-3xl font-bold">My Profile</h1>
		<p class="mt-2 text-gray-600 dark:text-gray-400">
			Manage your personal information and preferences
		</p>
	</div>
	<Button onclick={onEditClick}>
		<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
			></path>
		</svg>
		Edit Profile
	</Button>
</div>
