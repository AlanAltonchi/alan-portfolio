<script lang="ts">
	import { kanbanStore } from '$lib/stores/kanban.svelte';
	import BoardColumn from './BoardColumn.svelte';
	import BoardHeader from './BoardHeader.svelte';
	import CardModal from './CardModal.svelte';
	import ConfirmationModal from '$lib/components/ui/ConfirmationModal.svelte';
	import type { Board, Card, Column } from '$lib/types/kanban';

	interface Props {
		board: Board;
	}

	let { board }: Props = $props();

	// const state = $derived(kanbanStore.state); // Unused
	const columns = $derived(board.columns || []);
	let selectedCard = $state<Card | null>(null);
	let showCardModal = $state(false);
	let columnToDelete = $state<Column | null>(null);
	let showDeleteConfirmation = $state(false);

	// Computed confirmation message
	const deleteConfirmationMessage = $derived(() => {
		if (!columnToDelete) return '';
		const hasCards = columnToDelete.cards?.length || 0;
		const cardWarning = hasCards > 0 ? ` This will also delete ${hasCards} card${hasCards === 1 ? '' : 's'} in this column.` : '';
		return `This action cannot be undone.${cardWarning}`;
	});

	function handleCardClick(card: Card) {
		selectedCard = card;
		showCardModal = true;
	}

	function closeCardModal() {
		showCardModal = false;
		selectedCard = null;
	}

	function handleDeleteColumn(column: Column) {
		columnToDelete = column;
		showDeleteConfirmation = true;
	}

	async function confirmDeleteColumn() {
		if (!columnToDelete) return;
		
		showDeleteConfirmation = false;
		try {
			await kanbanStore.deleteColumn(columnToDelete.id);
		} catch (error) {
			console.error('Failed to delete column:', error);
			alert('Failed to delete column. Please try again.');
		} finally {
			columnToDelete = null;
		}
	}

	function cancelDeleteColumn() {
		showDeleteConfirmation = false;
		columnToDelete = null;
	}
</script>

<div class="flex h-full flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
	<BoardHeader {board} />

	<div class="flex-1 overflow-x-auto">
		<div class="flex min-h-full gap-6 p-6">
			{#each columns as column, index (column.id)}
				<div style="animation: slideInUp 0.4s ease-out {index * 0.1}s both">
					<BoardColumn {column} boardId={board.id} onCardClick={handleCardClick} onDeleteColumn={handleDeleteColumn} />
				</div>
			{/each}

			<!-- Add column button -->
			<div class="w-80 flex-shrink-0" style="animation: slideInUp 0.4s ease-out {columns.length * 0.1}s both">
				<button
					onclick={() =>
						kanbanStore.createColumn({
							board_id: board.id,
							title: 'New Column'
						})}
					class="group relative h-full w-full rounded-2xl border-2 border-dashed border-gray-300/50 bg-gradient-to-br from-gray-100/50 to-gray-200/30 p-6 transition-all duration-300 hover:border-gray-400 hover:from-gray-100 hover:to-gray-200/50 hover:shadow-lg dark:border-gray-600/50 dark:from-gray-800/50 dark:to-gray-700/30 dark:hover:border-gray-500 dark:hover:from-gray-800 dark:hover:to-gray-700/50"
				>
					<div class="flex flex-col items-center justify-center space-y-3">
						<div class="rounded-full bg-gray-200/50 p-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-gray-300/50 dark:bg-gray-700/50 dark:group-hover:bg-gray-600/50">
							<svg class="h-8 w-8 text-gray-500 transition-colors duration-300 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
							</svg>
						</div>
						<span class="text-lg font-semibold text-gray-600 transition-colors duration-300 group-hover:text-gray-800 dark:text-gray-300 dark:group-hover:text-gray-100">Add Column</span>
					</div>
				</button>
			</div>
		</div>
	</div>
</div>

<!-- Card Modal -->
{#if selectedCard}
	<CardModal card={selectedCard} isOpen={showCardModal} onClose={closeCardModal} />
{/if}

<!-- Delete Column Confirmation Modal -->
<ConfirmationModal
	isOpen={showDeleteConfirmation}
	title="Delete Column"
	message={deleteConfirmationMessage()}
	confirmText="Delete"
	cancelText="Cancel"
	confirmVariant="danger"
	onConfirm={confirmDeleteColumn}
	onCancel={cancelDeleteColumn}
/>
