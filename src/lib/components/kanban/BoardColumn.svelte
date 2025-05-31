<script lang="ts">
	import { kanbanStore } from '$lib/stores/kanban.svelte';
	import KanbanCard from './KanbanCard.svelte';
	import type { Column, DragItem, Card } from '$lib/types/kanban';

	interface Props {
		column: Column;
		boardId: string;
		onCardClick?: (card: Card) => void;
		onDeleteColumn?: (column: Column) => void;
	}

	let { column, boardId, onCardClick, onDeleteColumn }: Props = $props();

	const cards = $derived(column.cards || []);
	let dragOver = $state(false);
	let editingTitle = $state(false);
	let titleInput = $state(column.title);
	let showAddCard = $state(false);
	let newCardTitle = $state('');
	let newCardTitleInput = $state<HTMLTextAreaElement>();

	// Computed class for drag over state
	const dragOverClasses = $derived(
		dragOver ? 'ring-4 ring-blue-500 ring-offset-4 scale-105 shadow-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30' : ''
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

	function handleCardClick(card: Card) {
		onCardClick?.(card);
	}

	function handleDeleteColumn() {
		onDeleteColumn?.(column);
	}

	async function createCard() {
		if (!newCardTitle.trim()) return;
		
		try {
			showAddCard = false;
			await kanbanStore.createCard({
				title: newCardTitle.trim(),
				column_id: column.id,
				board_id: boardId
			});
			
			// Reset form
			newCardTitle = '';
		} catch (error) {
			console.error('Error creating card:', error);
		}
	}

	function handleAddCardKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			createCard();
		} else if (e.key === 'Escape') {
			newCardTitle = '';
			showAddCard = false;
		}
	}

	function startAddingCard() {
		showAddCard = true;
		// Focus the input after the DOM updates
		setTimeout(() => {
			newCardTitleInput?.focus();
		}, 0);
	}

	function cancelAddCard() {
		newCardTitle = '';
		showAddCard = false;
	}
</script>

<div
	class="group/column relative flex h-full max-h-[calc(100vh-12rem)] w-80 flex-shrink-0 flex-col rounded-2xl bg-gradient-to-b from-white/90 to-gray-50/90 backdrop-blur-sm shadow-xl transition-all duration-300 hover:shadow-2xl dark:from-gray-800/90 dark:to-gray-900/90 {dragOverClasses}"
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	role="region"
	aria-label="Column: {column.title}"
>
	<!-- Decorative gradient border -->
	<div class="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 blur-xl opacity-0 transition-opacity duration-300 group-hover/column:opacity-100"></div>
	
	<!-- Column header -->
	<div class="relative z-10 rounded-t-2xl bg-gradient-to-r from-gray-100/80 to-gray-200/80 px-6 py-4 backdrop-blur-sm dark:from-gray-700/80 dark:to-gray-800/80">
		<div class="flex items-center justify-between">
			{#if editingTitle}
				<input
					type="text"
					bind:value={titleInput}
					onblur={updateTitle}
					onkeydown={handleTitleKeydown}
					class="flex-1 mr-1 rounded-lg border border-gray-300 bg-white/90 px-3 py-2 font-bold text-gray-900 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800/90 dark:text-white"
				/>
			{:else}
				<button
					class="group/title cursor-pointer text-left text-xl font-black text-gray-800 transition-all duration-300 hover:text-transparent hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:bg-clip-text dark:text-gray-100"
					onclick={() => {
						editingTitle = true;
						titleInput = column.title;
					}}
				>
					{column.title}
				</button>
			{/if}

			<div class="flex items-center gap-2">
				<span
					class="inline-flex h-8 min-w-[2rem] items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 px-3 text-sm font-bold text-white shadow-lg"
				>
					{cards.length}
				</span>
				
				<!-- Delete button - only visible on column hover -->
				{#if !editingTitle}
				<button
					onclick={handleDeleteColumn}
					class="opacity-0 cursor-pointer group-hover/column:opacity-100 transition-all duration-300 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white hover:scale-110 dark:text-red-400 dark:hover:text-white"
					title="Delete column"
					aria-label="Delete column {column.title}"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
					</svg>
				</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- Cards container -->
	<div
		class="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent flex-1 space-y-4 overflow-y-auto px-4 py-4"
	>
		{#each cards as card, index (card.id)}
			<div style="animation: fadeIn 0.3s ease-out {index * 0.05}s both">
				<KanbanCard {card} columnId={column.id} {boardId} {index} onCardClick={handleCardClick} />
			</div>
		{/each}
	</div>

	<!-- Add card section -->
	<div class="p-4">
		{#if showAddCard}
			<!-- Inline card creation form -->
			<div class="rounded-xl bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-sm shadow-lg ring-1 ring-gray-200/50 transition-all duration-300 dark:from-gray-800/90 dark:to-gray-900/90 dark:ring-gray-700/50">
				<!-- Card preview header -->
				<div class="border-b border-gray-200/30 bg-gradient-to-r from-blue-500/5 to-purple-500/5 px-4 py-2 backdrop-blur-sm dark:border-gray-700/30 dark:from-blue-500/10 dark:to-purple-500/10">
					<div class="text-xs font-medium text-gray-500 dark:text-gray-400">New Card</div>
				</div>
				
				<!-- Card content -->
				<div class="p-4">
					<textarea
						bind:this={newCardTitleInput}
						bind:value={newCardTitle}
						onkeydown={handleAddCardKeydown}
						placeholder="Enter card title..."
						class="w-full resize-none rounded-lg border border-gray-200/50 bg-white/70 px-3 py-2 text-gray-900 placeholder-gray-500 backdrop-blur-sm transition-all duration-200 focus:border-blue-500/50 focus:bg-white/90 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700/50 dark:bg-gray-800/70 dark:text-white dark:placeholder-gray-400 dark:focus:bg-gray-800/90"
						rows="2"
					></textarea>
				</div>
				
				<!-- Action buttons -->
				<div class="flex items-center justify-between gap-2 border-t border-gray-200/30 bg-gray-50/50 px-4 py-3 backdrop-blur-sm dark:border-gray-700/30 dark:bg-gray-800/50">
				
					<div class="flex items-center gap-2">
						<button
							onclick={cancelAddCard}
							class="rounded-lg cursor-pointer px-3 py-1.5 text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-gray-200/50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-200"
						>
							Cancel
						</button>
						<button
							onclick={createCard}
							disabled={!newCardTitle.trim()}
							class="rounded-lg cursor-pointer bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-1.5 text-sm font-medium text-white shadow-md transition-all duration-200 hover:from-blue-600 hover:to-purple-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
						>
							Add Card
						</button>
					</div>
				</div>
			</div>
		{:else}
			<!-- Add card button -->
			<button
				onclick={startAddingCard}
				class="group cursor-pointer relative w-full overflow-hidden rounded-xl border-2 border-dashed border-gray-300/50 bg-gradient-to-br from-gray-100/50 to-gray-200/30 p-4 text-base font-semibold text-gray-600 transition-all duration-300 hover:border-blue-400 hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 hover:shadow-lg dark:border-gray-600/50 dark:from-gray-800/50 dark:to-gray-700/30 dark:text-gray-400 dark:hover:border-blue-500 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 dark:hover:text-blue-300"
			>
				<span class="relative z-10 flex items-center justify-center gap-3">
					<svg
						class="h-5 w-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-90"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					Add Card
				</span>
				<!-- Hover effect gradient -->
				<div class="absolute inset-0 -z-10 bg-gradient-to-r from-blue-400/0 via-purple-400/0 to-pink-400/0 opacity-0 transition-all duration-500 group-hover:from-blue-400/10 group-hover:via-purple-400/10 group-hover:to-pink-400/10 group-hover:opacity-100"></div>
			</button>
		{/if}
	</div>
</div>
