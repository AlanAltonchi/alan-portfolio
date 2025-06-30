<script lang="ts">
	import KanbanBoard from '$lib/components/kanban/KanbanBoard.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { kanbanStore } from '$lib/stores/kanban.svelte';
	import { onDestroy } from 'svelte';

	const state = $derived(kanbanStore.state);
	const user = $derived(authStore.user);

	onDestroy(() => {
		kanbanStore.cleanup();
	});
</script>

<div class="flex h-screen flex-col">
	{#if !user}
		<div class="flex flex-1 items-center justify-center">
			<div class="text-center">
				<p class="mb-4 text-gray-600 dark:text-gray-400">Please sign in to view this board</p>
				<a href="/auth/login" class="text-blue-600 hover:underline"> Sign In </a>
			</div>
		</div>
	{:else if state.loading}
		<div class="flex flex-1 items-center justify-center">
			<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
		</div>
	{:else if state.error}
		<div class="flex flex-1 items-center justify-center">
			<div class="text-center">
				<p class="mb-4 text-red-600 dark:text-red-400">{state.error}</p>
				<a href="/kanban" class="text-blue-600 hover:underline"> Back to Boards </a>
			</div>
		</div>
	{:else if state.currentBoard}
		<KanbanBoard board={state.currentBoard} />
	{:else}
		<div class="flex flex-1 items-center justify-center">
			<div class="text-center">
				<p class="mb-4 text-gray-600 dark:text-gray-400">Board not found</p>
				<a href="/kanban" class="text-blue-600 hover:underline"> Back to Boards </a>
			</div>
		</div>
	{/if}
</div>
