<script lang="ts">
	import { supabase } from '$lib/db.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { Plus, X, Check, Square, CheckSquare } from 'lucide-svelte';
	
	interface Checklist {
		id: string;
		card_id: string;
		title: string;
		position: number;
		created_at: string;
		checklist_items?: ChecklistItem[];
	}
	
	interface ChecklistItem {
		id: string;
		checklist_id: string;
		content: string;
		is_completed: boolean;
		position: number;
		created_at: string;
		completed_at?: string | null;
	}
	
	interface Props {
		cardId: string;
	}
	
	let { cardId }: Props = $props();
	
	let checklists = $state<Checklist[]>([]);
	let isLoading = $state(true);
	let isCreating = $state(false);
	let newChecklistTitle = $state('');
	let editingChecklistId = $state<string | null>(null);
	let editingItemId = $state<string | null>(null);
	let newItemTitles = $state<Record<string, string>>({});
	
	async function loadChecklists() {
		if (!authStore.user) return;
		
		isLoading = true;
		
		const { data, error } = await supabase
			.from('card_checklists')
			.select(`
				*,
				checklist_items (*)
			`)
			.eq('card_id', cardId)
			.order('position');
			
		if (!error && data) {
			// Sort checklist items by position manually since nested ordering is complex
			checklists = data.map(checklist => ({
				...checklist,
				checklist_items: checklist.checklist_items?.sort((a, b) => a.position - b.position) || []
			}));
		}
		
		isLoading = false;
	}
	
	async function createChecklist() {
		if (!authStore.user || !newChecklistTitle.trim()) return;
		
		const maxPosition = Math.max(0, ...checklists.map(c => c.position));
		
		const { data, error } = await supabase
			.from('card_checklists')
			.insert({
				card_id: cardId,
				title: newChecklistTitle.trim(),
				position: maxPosition + 1
			})
			.select()
			.single();
			
		if (!error && data) {
			checklists = [...checklists, { ...data, checklist_items: [] }];
			newChecklistTitle = '';
			isCreating = false;
		}
	}
	
	async function updateChecklistTitle(checklistId: string, title: string) {
		if (!authStore.user || !title.trim()) return;
		
		const { error } = await supabase
			.from('card_checklists')
			.update({ title: title.trim() })
			.eq('id', checklistId);
			
		if (!error) {
			checklists = checklists.map(c => 
				c.id === checklistId ? { ...c, title: title.trim() } : c
			);
			editingChecklistId = null;
		}
	}
	
	async function deleteChecklist(checklistId: string) {
		if (!authStore.user || !confirm('Delete this checklist?')) return;
		
		const { error } = await supabase
			.from('card_checklists')
			.delete()
			.eq('id', checklistId);
			
		if (!error) {
			checklists = checklists.filter(c => c.id !== checklistId);
		}
	}
	
	async function addChecklistItem(checklistId: string) {
		if (!authStore.user || !newItemTitles[checklistId]?.trim()) return;
		
		const checklist = checklists.find(c => c.id === checklistId);
		if (!checklist) return;
		
		const maxPosition = Math.max(0, ...(checklist.checklist_items?.map(i => i.position) || []));
		
		const { data, error } = await supabase
			.from('checklist_items')
			.insert({
				checklist_id: checklistId,
				content: newItemTitles[checklistId].trim(),
				position: maxPosition + 1,
				is_completed: false
			})
			.select()
			.single();
			
		if (!error && data) {
			checklists = checklists.map(c => 
				c.id === checklistId 
					? { ...c, checklist_items: [...(c.checklist_items || []), data] }
					: c
			);
			newItemTitles[checklistId] = '';
		}
	}
	
	async function toggleItemCompletion(item: ChecklistItem) {
		if (!authStore.user) return;
		
		const { error } = await supabase
			.from('checklist_items')
			.update({ is_completed: !item.is_completed })
			.eq('id', item.id);
			
		if (!error) {
			checklists = checklists.map(c => ({
				...c,
				checklist_items: c.checklist_items?.map(i => 
					i.id === item.id ? { ...i, is_completed: !i.is_completed } : i
				)
			}));
		}
	}
	
	async function updateItemTitle(itemId: string, title: string) {
		if (!authStore.user || !title.trim()) return;
		
		const { error } = await supabase
			.from('checklist_items')
			.update({ content: title.trim() })
			.eq('id', itemId);
			
		if (!error) {
			checklists = checklists.map(c => ({
				...c,
				checklist_items: c.checklist_items?.map(i => 
					i.id === itemId ? { ...i, content: title.trim() } : i
				)
			}));
			editingItemId = null;
		}
	}
	
	async function deleteItem(itemId: string) {
		if (!authStore.user) return;
		
		const { error } = await supabase
			.from('checklist_items')
			.delete()
			.eq('id', itemId);
			
		if (!error) {
			checklists = checklists.map(c => ({
				...c,
				checklist_items: c.checklist_items?.filter(i => i.id !== itemId)
			}));
		}
	}
	
	function getProgress(checklist: Checklist): number {
		const items = checklist.checklist_items || [];
		if (items.length === 0) return 0;
		const completed = items.filter(i => i.is_completed).length;
		return Math.round((completed / items.length) * 100);
	}
	
	$effect(() => {
		loadChecklists();
	});
</script>

<div class="space-y-4">
	{#if isLoading}
		<div class="text-center py-8 text-gray-500 dark:text-gray-400">
			Loading checklists...
		</div>
	{:else}
		<!-- Checklists -->
		{#each checklists as checklist}
			<div class="border border-gray-200 dark:border-gray-700 rounded-md">
				<!-- Checklist Header -->
				<div class="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
					{#if editingChecklistId === checklist.id}
						<input
							type="text"
							value={checklist.title}
							class="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 
								rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									updateChecklistTitle(checklist.id, e.currentTarget.value);
								} else if (e.key === 'Escape') {
									editingChecklistId = null;
								}
							}}
							onblur={(e) => updateChecklistTitle(checklist.id, e.currentTarget.value)}
						/>
					{:else}
						<button
							onclick={() => editingChecklistId = checklist.id}
							class="flex-1 text-left font-medium text-gray-700 dark:text-gray-300 
								hover:text-gray-900 dark:hover:text-white"
						>
							{checklist.title}
						</button>
					{/if}
					
					<div class="flex items-center gap-2 ml-2">
						<span class="text-sm text-gray-500 dark:text-gray-400">
							{getProgress(checklist)}%
						</span>
						<button
							onclick={() => deleteChecklist(checklist.id)}
							class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
						>
							<X class="w-4 h-4" />
						</button>
					</div>
				</div>
				
				<!-- Progress Bar -->
				<div class="h-1 bg-gray-200 dark:bg-gray-700">
					<div
						class="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-300"
						style="width: {getProgress(checklist)}%"
					/>
				</div>
				
				<!-- Checklist Items -->
				<div class="p-3 space-y-1">
					{#each checklist.checklist_items || [] as item}
						<div class="flex items-center gap-2 group">
							<button
								onclick={() => toggleItemCompletion(item)}
								class="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 
									dark:hover:text-gray-200"
							>
								{#if item.is_completed}
									<CheckSquare class="w-4 h-4 text-green-600 dark:text-green-400" />
								{:else}
									<Square class="w-4 h-4" />
								{/if}
							</button>
							
							{#if editingItemId === item.id}
								<input
									type="text"
									value={item.content}
									class="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 
										rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
									onkeydown={(e) => {
										if (e.key === 'Enter') {
											updateItemTitle(item.id, e.currentTarget.value);
										} else if (e.key === 'Escape') {
											editingItemId = null;
										}
									}}
									onblur={(e) => updateItemTitle(item.id, e.currentTarget.value)}
								/>
							{:else}
								<button
									onclick={() => editingItemId = item.id}
									class="flex-1 text-left text-sm {
										item.is_completed 
											? 'text-gray-500 dark:text-gray-400 line-through' 
											: 'text-gray-700 dark:text-gray-300'
									} hover:text-gray-900 dark:hover:text-white"
								>
									{item.content}
								</button>
							{/if}
							
							<button
								onclick={() => deleteItem(item.id)}
								class="p-1 opacity-0 group-hover:opacity-100 text-gray-400 
									hover:text-red-600 dark:hover:text-red-400"
							>
								<X class="w-3 h-3" />
							</button>
						</div>
					{/each}
					
					<!-- Add Item Input -->
					<div class="flex items-center gap-2 mt-2">
						<Plus class="w-4 h-4 text-gray-400" />
						<input
							type="text"
							bind:value={newItemTitles[checklist.id]}
							placeholder="Add an item..."
							class="flex-1 px-2 py-1 text-sm border-0 bg-transparent text-gray-700 
								dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 
								focus:outline-none"
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									addChecklistItem(checklist.id);
								}
							}}
						/>
					</div>
				</div>
			</div>
		{/each}
		
		<!-- Create New Checklist -->
		{#if isCreating}
			<div class="border border-gray-200 dark:border-gray-700 rounded-md p-3">
				<input
					type="text"
					bind:value={newChecklistTitle}
					placeholder="Checklist title"
					class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 
						rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							createChecklist();
						} else if (e.key === 'Escape') {
							isCreating = false;
							newChecklistTitle = '';
						}
					}}
				/>
				<div class="flex gap-2 mt-2">
					<button
						onclick={createChecklist}
						disabled={!newChecklistTitle.trim()}
						class="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded 
							hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Create
					</button>
					<button
						onclick={() => {
							isCreating = false;
							newChecklistTitle = '';
						}}
						class="px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 
							hover:text-gray-800 dark:hover:text-gray-200"
					>
						Cancel
					</button>
				</div>
			</div>
		{:else}
			<button
				onclick={() => isCreating = true}
				class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 
					dark:text-gray-400 border border-gray-300 dark:border-gray-600 
					rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
			>
				<Plus class="w-4 h-4" />
				Add checklist
			</button>
		{/if}
	{/if}
</div>