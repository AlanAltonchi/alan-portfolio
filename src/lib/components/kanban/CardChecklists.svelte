<script lang="ts">
	import { supabase } from '$lib/db.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { Plus, X, Square, CheckSquare } from 'lucide-svelte';

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
			.select(
				`
				*,
				checklist_items (*)
			`
			)
			.eq('card_id', cardId)
			.order('position');

		if (!error && data) {
			// Sort checklist items by position manually since nested ordering is complex
			checklists = data.map((checklist) => ({
				...checklist,
				checklist_items: checklist.checklist_items?.sort((a, b) => a.position - b.position) || []
			}));
		}

		isLoading = false;
	}

	async function createChecklist() {
		if (!authStore.user || !newChecklistTitle.trim()) return;

		const maxPosition = Math.max(0, ...checklists.map((c) => c.position));

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
			checklists = checklists.map((c) =>
				c.id === checklistId ? { ...c, title: title.trim() } : c
			);
			editingChecklistId = null;
		}
	}

	async function deleteChecklist(checklistId: string) {
		if (!authStore.user || !confirm('Delete this checklist?')) return;

		const { error } = await supabase.from('card_checklists').delete().eq('id', checklistId);

		if (!error) {
			checklists = checklists.filter((c) => c.id !== checklistId);
		}
	}

	async function addChecklistItem(checklistId: string) {
		if (!authStore.user || !newItemTitles[checklistId]?.trim()) return;

		const checklist = checklists.find((c) => c.id === checklistId);
		if (!checklist) return;

		const maxPosition = Math.max(0, ...(checklist.checklist_items?.map((i) => i.position) || []));

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
			checklists = checklists.map((c) =>
				c.id === checklistId ? { ...c, checklist_items: [...(c.checklist_items || []), data] } : c
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
			checklists = checklists.map((c) => ({
				...c,
				checklist_items: c.checklist_items?.map((i) =>
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
			checklists = checklists.map((c) => ({
				...c,
				checklist_items: c.checklist_items?.map((i) =>
					i.id === itemId ? { ...i, content: title.trim() } : i
				)
			}));
			editingItemId = null;
		}
	}

	async function deleteItem(itemId: string) {
		if (!authStore.user) return;

		const { error } = await supabase.from('checklist_items').delete().eq('id', itemId);

		if (!error) {
			checklists = checklists.map((c) => ({
				...c,
				checklist_items: c.checklist_items?.filter((i) => i.id !== itemId)
			}));
		}
	}

	function getProgress(checklist: Checklist): number {
		const items = checklist.checklist_items || [];
		if (items.length === 0) return 0;
		const completed = items.filter((i) => i.is_completed).length;
		return Math.round((completed / items.length) * 100);
	}

	$effect(() => {
		loadChecklists();
	});
</script>

<div class="space-y-4">
	{#if isLoading}
		<div class="py-8 text-center text-gray-500 dark:text-gray-400">Loading checklists...</div>
	{:else}
		<!-- Checklists -->
		{#each checklists as checklist (checklist.id)}
			<div class="rounded-md border border-gray-200 dark:border-gray-700">
				<!-- Checklist Header -->
				<div
					class="flex items-center justify-between border-b border-gray-200 p-3 dark:border-gray-700"
				>
					{#if editingChecklistId === checklist.id}
						<input
							type="text"
							value={checklist.title}
							class="flex-1 rounded border border-gray-300 bg-white px-2 py-1
								text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
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
							onclick={() => (editingChecklistId = checklist.id)}
							class="flex-1 text-left font-medium text-gray-700 hover:text-gray-900
								dark:text-gray-300 dark:hover:text-white"
						>
							{checklist.title}
						</button>
					{/if}

					<div class="ml-2 flex items-center gap-2">
						<span class="text-sm text-gray-500 dark:text-gray-400">
							{getProgress(checklist)}%
						</span>
						<button
							onclick={() => deleteChecklist(checklist.id)}
							class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
						>
							<X class="h-4 w-4" />
						</button>
					</div>
				</div>

				<!-- Progress Bar -->
				<div class="h-1 bg-gray-200 dark:bg-gray-700">
					<div
						class="h-full bg-blue-600 transition-all duration-300 dark:bg-blue-400"
						style="width: {getProgress(checklist)}%"
					></div>
				</div>

				<!-- Checklist Items -->
				<div class="space-y-1 p-3">
					{#each checklist.checklist_items || [] as item (item.id)}
						<div class="group flex items-center gap-2">
							<button
								onclick={() => toggleItemCompletion(item)}
								class="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400
									dark:hover:text-gray-200"
							>
								{#if item.is_completed}
									<CheckSquare class="h-4 w-4 text-green-600 dark:text-green-400" />
								{:else}
									<Square class="h-4 w-4" />
								{/if}
							</button>

							{#if editingItemId === item.id}
								<input
									type="text"
									value={item.content}
									class="flex-1 rounded border border-gray-300 bg-white px-2 py-1
										text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
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
									onclick={() => (editingItemId = item.id)}
									class="flex-1 text-left text-sm {item.is_completed
										? 'text-gray-500 line-through dark:text-gray-400'
										: 'text-gray-700 dark:text-gray-300'} hover:text-gray-900 dark:hover:text-white"
								>
									{item.content}
								</button>
							{/if}

							<button
								onclick={() => deleteItem(item.id)}
								class="p-1 text-gray-400 opacity-0 group-hover:opacity-100
									hover:text-red-600 dark:hover:text-red-400"
							>
								<X class="h-3 w-3" />
							</button>
						</div>
					{/each}

					<!-- Add Item Input -->
					<div class="mt-2 flex items-center gap-2">
						<Plus class="h-4 w-4 text-gray-400" />
						<input
							type="text"
							bind:value={newItemTitles[checklist.id]}
							placeholder="Add an item..."
							class="flex-1 border-0 bg-transparent px-2 py-1 text-sm text-gray-700
								placeholder-gray-400 focus:outline-none dark:text-gray-300
								dark:placeholder-gray-500"
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
			<div class="rounded-md border border-gray-200 p-3 dark:border-gray-700">
				<input
					type="text"
					bind:value={newChecklistTitle}
					placeholder="Checklist title"
					class="w-full rounded border border-gray-300 bg-white px-2 py-1
						text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							createChecklist();
						} else if (e.key === 'Escape') {
							isCreating = false;
							newChecklistTitle = '';
						}
					}}
				/>
				<div class="mt-2 flex gap-2">
					<button
						onclick={createChecklist}
						disabled={!newChecklistTitle.trim()}
						class="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white
							hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Create
					</button>
					<button
						onclick={() => {
							isCreating = false;
							newChecklistTitle = '';
						}}
						class="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800
							dark:text-gray-400 dark:hover:text-gray-200"
					>
						Cancel
					</button>
				</div>
			</div>
		{:else}
			<button
				onclick={() => (isCreating = true)}
				class="flex w-full items-center gap-2 rounded-md border border-gray-300 px-3
					py-2 text-sm text-gray-600 transition-colors
					hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
			>
				<Plus class="h-4 w-4" />
				Add checklist
			</button>
		{/if}
	{/if}
</div>
