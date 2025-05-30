<script lang="ts">
	import { supabase } from '$lib/db.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import type { CardLabel } from '$lib/types/kanban';
	import { Plus, X, Check } from 'lucide-svelte';
	
	interface Props {
		cardId: string;
		boardId: string;
	}
	
	let { cardId, boardId }: Props = $props();
	
	let labels = $state<CardLabel[]>([]);
	let assignedLabelIds = $state<Set<string>>(new Set());
	let isCreating = $state(false);
	let newLabelName = $state('');
	let newLabelColor = $state('#3b82f6');
	let showDropdown = $state(false);
	let isLoading = $state(true);
	
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
		'#6b7280', // gray
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
		
		// Load assigned labels for this card
		const { data: assignments, error: assignError } = await supabase
			.from('card_label_assignments')
			.select('label_id')
			.eq('card_id', cardId);
			
		if (!assignError && assignments) {
			assignedLabelIds = new Set(assignments.map(a => a.label_id));
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
		
		if (assignedLabelIds.has(labelId)) {
			// Remove assignment
			const { error } = await supabase
				.from('card_label_assignments')
				.delete()
				.eq('card_id', cardId)
				.eq('label_id', labelId);
				
			if (!error) {
				assignedLabelIds.delete(labelId);
				assignedLabelIds = assignedLabelIds;
			}
		} else {
			// Add assignment
			const { error } = await supabase
				.from('card_label_assignments')
				.insert({
					card_id: cardId,
					label_id: labelId
				});
				
			if (!error) {
				assignedLabelIds.add(labelId);
				assignedLabelIds = assignedLabelIds;
			}
		}
	}
	
	async function deleteLabel(labelId: string) {
		if (!authStore.user || !confirm('Delete this label? It will be removed from all cards.')) return;
		
		const { error } = await supabase
			.from('card_labels')
			.delete()
			.eq('id', labelId);
			
		if (!error) {
			labels = labels.filter(l => l.id !== labelId);
			assignedLabelIds.delete(labelId);
			assignedLabelIds = assignedLabelIds;
		}
	}
	
	$effect(() => {
		loadLabels();
	});
</script>

<div class="relative">
	<!-- Assigned Labels Display -->
	<div class="flex flex-wrap items-center gap-2">
		{#each labels.filter(l => assignedLabelIds.has(l.id)) as label}
			<span
				class="inline-flex items-center px-2 py-1 text-xs font-medium text-white rounded"
				style="background-color: {label.color}"
			>
				{label.name}
			</span>
		{/each}
		
		<button
			onclick={() => showDropdown = !showDropdown}
			class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 
				dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 
				dark:hover:bg-gray-700 transition-colors"
		>
			<Plus class="w-3 h-3" />
			Add Label
		</button>
	</div>
	
	<!-- Dropdown -->
	{#if showDropdown}
		<div class="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-md 
			shadow-lg border border-gray-200 dark:border-gray-700 z-50">
			<div class="p-2">
				{#if isCreating}
					<!-- Create New Label -->
					<div class="space-y-2 p-2 border border-gray-200 dark:border-gray-700 rounded">
						<input
							type="text"
							bind:value={newLabelName}
							placeholder="Label name"
							class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 
								rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
							onkeydown={(e) => e.key === 'Enter' && createLabel()}
						/>
						
						<div class="flex flex-wrap gap-1">
							{#each predefinedColors as color}
								<button
									onclick={() => newLabelColor = color}
									class="w-6 h-6 rounded border-2 {
										newLabelColor === color 
											? 'border-gray-900 dark:border-white' 
											: 'border-transparent'
									}"
									style="background-color: {color}"
								/>
							{/each}
						</div>
						
						<div class="flex gap-2">
							<button
								onclick={createLabel}
								disabled={!newLabelName.trim()}
								class="flex-1 px-2 py-1 text-xs font-medium text-white bg-blue-600 
									rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Create
							</button>
							<button
								onclick={() => {
									isCreating = false;
									newLabelName = '';
									newLabelColor = '#3b82f6';
								}}
								class="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 
									hover:text-gray-800 dark:hover:text-gray-200"
							>
								Cancel
							</button>
						</div>
					</div>
				{:else}
					<!-- Label List -->
					{#if isLoading}
						<div class="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
							Loading labels...
						</div>
					{:else if labels.length === 0}
						<div class="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
							No labels yet
						</div>
					{:else}
						<div class="max-h-64 overflow-y-auto">
							{#each labels as label}
								<div class="flex items-center gap-2 p-1 rounded hover:bg-gray-100 
									dark:hover:bg-gray-700 group">
									<button
										onclick={() => toggleLabel(label.id)}
										class="flex-1 flex items-center gap-2 text-left"
									>
										<span
											class="inline-block w-4 h-4 rounded"
											style="background-color: {label.color}"
										/>
										<span class="text-sm text-gray-700 dark:text-gray-300">
											{label.name}
										</span>
										{#if assignedLabelIds.has(label.id)}
											<Check class="w-3 h-3 text-green-600 dark:text-green-400 ml-auto" />
										{/if}
									</button>
									
									<button
										onclick={(e) => {
											e.stopPropagation();
											deleteLabel(label.id);
										}}
										class="p-1 opacity-0 group-hover:opacity-100 text-red-600 
											dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
									>
										<X class="w-3 h-3" />
									</button>
								</div>
							{/each}
						</div>
					{/if}
					
					<div class="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
						<button
							onclick={() => isCreating = true}
							class="w-full flex items-center gap-2 px-2 py-1 text-sm text-gray-600 
								dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 
								hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
						>
							<Plus class="w-4 h-4" />
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
		onclick={() => showDropdown = false}
	/>
{/if}