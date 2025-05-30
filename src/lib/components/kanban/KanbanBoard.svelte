<script lang="ts">
	import { kanbanStore } from '$lib/stores/kanban.svelte';
	import BoardColumn from './BoardColumn.svelte';
	import BoardHeader from './BoardHeader.svelte';
	import type { Board } from '$lib/types/kanban';

	interface Props {
		board: Board;
	}

	let { board }: Props = $props();

	// const state = $derived(kanbanStore.state); // Unused
	const columns = $derived(board.columns || []);
</script>

<div class="flex h-full flex-col">
	<BoardHeader {board} />

	<div class="flex-1 overflow-x-auto">
		<div class="flex min-h-full gap-4 p-4">
			{#each columns as column (column.id)}
				<BoardColumn {column} boardId={board.id} />
			{/each}

			<!-- Add column button -->
			<div class="w-80 flex-shrink-0">
				<button
					onclick={() =>
						kanbanStore.createColumn({
							board_id: board.id,
							title: 'New Column'
						})}
					class="w-full rounded-lg border-2 border-dashed border-gray-300 p-4 transition-colors hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
				>
					<span class="text-gray-500 dark:text-gray-400">+ Add Column</span>
				</button>
			</div>
		</div>
	</div>
</div>
