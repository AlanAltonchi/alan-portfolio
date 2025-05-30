<script lang="ts">
	import { supabase } from '$lib/db.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { kanbanStore } from '$lib/stores/kanban.svelte';
	import type { CardLabel } from '$lib/types/kanban';
	import { Plus, X, Check } from 'lucide-svelte';

	interface Props {
		cardId: string;
		boardId: string;
	}

	let { cardId, boardId }: Props = $props();

	let labels = $state<CardLabel[]>([]);
	let isCreating = $state(false);
	let newLabelName = $state('');
	let newLabelColor = $state('#3b82f6');
	let showDropdown = $state(false);
	let isLoading = $state(true);

	// Derive assigned label IDs from the kanban store's current board state
	let assignedLabelIds = $derived(() => {
		if (!kanbanStore.state.currentBoard?.columns) return new Set<string>();

		for (const column of kanbanStore.state.currentBoard.columns) {
			if (column.cards) {
				const card = column.cards.find((c) => c.id === cardId);
				if (card?.card_label_assignments) {
					return new Set(card.card_label_assignments.map((a) => a.label_id));
				}
			}
		}
		return new Set<string>();
	});

	const predefinedColors = [
		'#ef4444', // red
		'#f97316', // orange
		'#f59e0b', // amber
		'#84cc16', // lime
		'#22c55e', // green
		'#14b8a6', // teal
		'#3b82f6', // blue
		'#8b5cf6', // violet
		'#ec4899', // pink
		'#6b7280' // gray
	];

	async function loadLabels() {
		if (!authStore.user) return;

		isLoading = true;

		// Load all labels for this board
		const { data: boardLabels, error: labelsError } = await supabase
			.from('card_labels')
			.select('*')
			.eq('board_id', boardId)
			.order('name');

		if (!labelsError && boardLabels) {
			labels = boardLabels;
		}

		isLoading = false;
	}

	async function createLabel() {
		if (!authStore.user || !newLabelName.trim()) return;

		const { data, error } = await supabase
			.from('card_labels')
			.insert({
				board_id: boardId,
				name: newLabelName.trim(),
				color: newLabelColor
			})
			.select()
			.single();

		if (!error && data) {
			labels = [...labels, data];
			newLabelName = '';
			newLabelColor = '#3b82f6';
			isCreating = false;

			// Auto-assign the new label to the card
			await toggleLabel(data.id);
		}
	}

	async function toggleLabel(labelId: string) {
		if (!authStore.user) return;

		const isAssigning = !assignedLabelIds().has(labelId);

		try {
			// Use the kanban store's optimistic update method
			await kanbanStore.updateCardLabels(cardId, labelId, isAssigning);
		} catch (error) {
			console.error('Error toggling label:', error);
			// The kanban store will handle rollback automatically
		}
	}

	async function deleteLabel(labelId: string) {
		if (!authStore.user || !confirm('Delete this label? It will be removed from all cards.'))
			return;

		const { error } = await supabase.from('card_labels').delete().eq('id', labelId);

		if (!error) {
			labels = labels.filter((l) => l.id !== labelId);
		}
	}

	$effect(() => {
		loadLabels();
	});
</script>

<div class="relative">
	<!-- Assigned Labels Display -->
	<div class="flex flex-wrap items-center gap-2">
		{#each labels.filter((l) => assignedLabelIds().has(l.id)) as label (label.id)}
			<span
				class="inline-flex items-center rounded px-2 py-1 text-xs font-medium text-white"
				style="background-color: {label.color}"
			>
				{label.name}
			</span>
		{/each}

		<button
			onclick={() => (showDropdown = !showDropdown)}
			onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (showDropdown = !showDropdown)}
			class="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs
				font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800
				dark:text-gray-400 dark:hover:bg-gray-700"
			aria-label="{showDropdown ? 'Close' : 'Open'} label menu"
			aria-expanded={showDropdown}
		>
			<Plus class="h-3 w-3" />
			Add Label
		</button>
	</div>

	<!-- Dropdown -->
	{#if showDropdown}
		<div
			class="absolute top-full left-0 z-50 mt-1 w-64 rounded-md border
			border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="p-2">
				{#if isCreating}
					<!-- Create New Label -->
					<div class="space-y-2 rounded border border-gray-200 p-2 dark:border-gray-700">
						<input
							type="text"
							bind:value={newLabelName}
							placeholder="Label name"
							class="w-full rounded border border-gray-300 bg-white px-2 py-1
								text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
							onkeydown={(e) => e.key === 'Enter' && createLabel()}
						/>

						<div class="flex flex-wrap gap-1">
							{#each predefinedColors as color (color)}
								<button
									onclick={() => (newLabelColor = color)}
									onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (newLabelColor = color)}
									class="h-6 w-6 rounded border-2 {newLabelColor === color
										? 'border-gray-900 dark:border-white'
										: 'border-transparent'}"
									style="background-color: {color}"
									aria-label="Select color {color}"
									type="button"
								></button>
							{/each}
						</div>

						<div class="flex gap-2">
							<button
								onclick={createLabel}
								onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && createLabel()}
								disabled={!newLabelName.trim()}
								class="flex-1 rounded bg-blue-600 px-2 py-1 text-xs font-medium
									text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
								type="button"
							>
								Create
							</button>
							<button
								onclick={() => {
									isCreating = false;
									newLabelName = '';
									newLabelColor = '#3b82f6';
								}}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										isCreating = false;
										newLabelName = '';
										newLabelColor = '#3b82f6';
									}
								}}
								class="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-800
									dark:text-gray-400 dark:hover:text-gray-200"
								type="button"
							>
								Cancel
							</button>
						</div>
					</div>
				{:else}
					<!-- Label List -->
					{#if isLoading}
						<div class="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
							Loading labels...
						</div>
					{:else if labels.length === 0}
						<div class="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
							No labels yet
						</div>
					{:else}
						<div class="max-h-64 overflow-y-auto">
							{#each labels as label (label.id)}
								<div class="group flex w-full items-center gap-2 rounded p-1 select-none hover:bg-gray-100 dark:hover:bg-gray-700">
									<button
										class="flex flex-1 items-center gap-2 text-left"
										onclick={() => toggleLabel(label.id)}
										onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleLabel(label.id)}
										aria-label="{assignedLabelIds().has(label.id) ? 'Remove' : 'Add'} label {label.name}"
										type="button"
									>
										<span
											class="inline-block h-4 w-4 rounded"
											style="background-color: {label.color}"
										></span>
										<span class="text-sm text-gray-700 dark:text-gray-300">
											{label.name}
										</span>
										{#if assignedLabelIds().has(label.id)}
											<Check class="ml-auto h-3 w-3 text-green-600 dark:text-green-400" />
										{/if}
									</button>

									<button
										onclick={(e) => {
											e.stopPropagation();
											deleteLabel(label.id);
										}}
										onkeydown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.stopPropagation();
												deleteLabel(label.id);
											}
										}}
										class="p-1 text-red-600 opacity-0 group-hover:opacity-100
											hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
										aria-label="Delete label {label.name}"
										type="button"
									>
										<X class="h-3 w-3" />
									</button>
								</div>
							{/each}
						</div>
					{/if}

					<div class="mt-2 border-t border-gray-200 pt-2 dark:border-gray-700">
						<button
							onclick={() => (isCreating = true)}
							onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (isCreating = true)}
							class="flex w-full items-center gap-2 rounded px-2 py-1 text-sm
								text-gray-600 hover:bg-gray-100 hover:text-gray-800
								dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
							type="button"
						>
							<Plus class="h-4 w-4" />
							Create new label
						</button>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<!-- Click outside to close -->
{#if showDropdown}
	<div 
		class="fixed inset-0 z-40" 
		onclick={() => (showDropdown = false)}
		onkeydown={(e) => e.key === 'Escape' && (showDropdown = false)}
		role="button"
		tabindex="-1"
		aria-label="Close label menu"
	></div>
{/if}
