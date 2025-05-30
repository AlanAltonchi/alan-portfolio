<script lang="ts">
	import { kanbanStore } from '$lib/stores/kanban.svelte';
	import KanbanCard from './KanbanCard.svelte';
	import type { Column, DragItem } from '$lib/types/kanban';

	interface Props {
		column: Column;
		boardId: string;
	}

	let { column, boardId }: Props = $props();

	const cards = $derived(column.cards || []);
	let dragOver = $state(false);
	let editingTitle = $state(false);
	let titleInput = $state(column.title);

	// Computed class for drag over state
	const dragOverClasses = $derived(
		dragOver ? 'ring-2 ring-blue-400 ring-offset-2 bg-blue-50 dark:bg-blue-900/20' : ''
	);

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		dragOver = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;

		const data = e.dataTransfer?.getData('application/json');
		if (!data) return;

		try {
			const dragItem: DragItem = JSON.parse(data);
			if (dragItem.type !== 'card') return;

			// Calculate drop position
			const dropY = e.clientY;
			const target = e.currentTarget as HTMLElement;
			const cardElements = Array.from(target.querySelectorAll('[data-card-id]'));
			let targetIndex = cards.length;

			for (let i = 0; i < cardElements.length; i++) {
				const rect = cardElements[i].getBoundingClientRect();
				if (dropY < rect.top + rect.height / 2) {
					targetIndex = i;
					break;
				}
			}

			kanbanStore.moveCard({
				cardId: dragItem.cardId,
				sourceColumnId: dragItem.columnId,
				targetColumnId: column.id,
				newPosition: targetIndex
			});
		} catch (err) {
			console.error('Error handling drop:', err);
		}
	}

	async function updateTitle() {
		if (titleInput.trim() && titleInput !== column.title) {
			await kanbanStore.updateColumn(column.id, { title: titleInput.trim() });
		}
		editingTitle = false;
	}

	function handleTitleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			updateTitle();
		} else if (e.key === 'Escape') {
			titleInput = column.title;
			editingTitle = false;
		}
	}
</script>

<div
	class="flex max-h-full w-80 flex-shrink-0 flex-col rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm transition-all duration-200 dark:border-gray-700 dark:bg-gray-800 {dragOverClasses}"
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	role="region"
	aria-label="Column: {column.title}"
>
	<!-- Column header -->
	<div class="mb-5 flex items-center justify-between">
		{#if editingTitle}
			<input
				type="text"
				bind:value={titleInput}
				onblur={updateTitle}
				onkeydown={handleTitleKeydown}
				class="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 font-semibold text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
			/>
		{:else}
			<button
				class="cursor-pointer text-left text-lg font-bold text-gray-900 transition-colors duration-150 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
				onclick={() => {
					editingTitle = true;
					titleInput = column.title;
				}}
			>
				{column.title}
			</button>
		{/if}

		<span
			class="ml-3 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-gray-200 px-2 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
		>
			{cards.length}
		</span>
	</div>

	<!-- Cards container -->
	<div
		class="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent flex-1 space-y-3 overflow-y-auto px-1"
	>
		{#each cards as card, index (card.id)}
			<KanbanCard {card} columnId={column.id} {boardId} {index} />
		{/each}
	</div>

	<!-- Add card button -->
	<button
		onclick={() => {
			const title = prompt('Card title:');
			if (title?.trim()) {
				kanbanStore.createCard({
					title: title.trim(),
					column_id: column.id,
					board_id: boardId
				});
			}
		}}
		class="group mt-5 w-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 p-3 text-sm font-medium text-gray-600 transition-all duration-200 hover:border-gray-400 hover:bg-gray-200 hover:text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:bg-gray-600 dark:hover:text-gray-200"
	>
		<span class="flex items-center justify-center gap-2">
			<svg
				class="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Add Card
		</span>
	</button>
</div>
