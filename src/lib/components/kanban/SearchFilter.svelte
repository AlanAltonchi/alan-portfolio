<script lang="ts">
	import { kanbanStore } from '$lib/stores/kanban.svelte';
	import type { CardLabel } from '$lib/types/kanban';
	import { Search, Filter, User } from 'lucide-svelte';
	import { supabase } from '$lib/db.svelte';
	import { authStore } from '$lib/stores/auth.svelte';

	interface Props {
		boardId: string;
	}

	let { boardId }: Props = $props();

	let showDropdown = $state(false);
	let labels = $state<CardLabel[]>([]);
	let boardMembers = $state<Array<{ user_id: string; email: string; full_name: string | null }>>(
		[]
	);

	// Filter states
	let searchQuery = $state(kanbanStore.filterState.searchQuery || '');
	let selectedLabels = $state<Set<string>>(new Set(kanbanStore.filterState.labels || []));
	let selectedAssignees = $state<Set<string>>(new Set(kanbanStore.filterState.assignees || []));
	let selectedPriorities = $state<Set<string>>(new Set(kanbanStore.filterState.priorities || []));
	let dueDateFilter = $state(kanbanStore.filterState.dueDate || '');

	const priorities = [
		{ value: 'urgent', label: 'Urgent', color: 'bg-red-500' },
		{ value: 'high', label: 'High', color: 'bg-orange-500' },
		{ value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
		{ value: 'low', label: 'Low', color: 'bg-green-500' }
	];

	const dueDateOptions = [
		{ value: '', label: 'Any time' },
		{ value: 'overdue', label: 'Overdue' },
		{ value: 'today', label: 'Due today' },
		{ value: 'week', label: 'Due this week' },
		{ value: 'month', label: 'Due this month' },
		{ value: 'none', label: 'No due date' }
	];

	async function loadFilterData() {
		if (!authStore.user) return;

		// Load labels
		const { data: labelData } = await supabase
			.from('card_labels')
			.select('*')
			.eq('board_id', boardId)
			.order('name');

		if (labelData) {
			labels = labelData;
		}

		// Load board members - get user info from users table via board_members
		const { data: memberData } = await supabase
			.from('board_members')
			.select('user_id')
			.eq('board_id', boardId);

		if (memberData) {
			// Get user details from users table
			const userIds = memberData.map((m) => m.user_id);
			const { data: userData } = await supabase.from('users').select('id, email').in('id', userIds);

			if (userData) {
				boardMembers = userData.map((u) => ({
					user_id: u.id,
					email: u.email,
					full_name: null // We'll use email for display since full_name isn't in users table
				}));
			}
		}
	}

	function applyFilters() {
		kanbanStore.setFilters({
			searchQuery: searchQuery.trim(),
			labels: Array.from(selectedLabels),
			assignees: Array.from(selectedAssignees),
			priorities: Array.from(selectedPriorities),
			dueDate: dueDateFilter
		});
		showDropdown = false;
	}

	function clearFilters() {
		searchQuery = '';
		selectedLabels.clear();
		selectedAssignees.clear();
		selectedPriorities.clear();
		dueDateFilter = '';
		kanbanStore.clearFilters();
		showDropdown = false;
	}

	function toggleLabel(labelId: string) {
		if (selectedLabels.has(labelId)) {
			selectedLabels.delete(labelId);
		} else {
			selectedLabels.add(labelId);
		}
		selectedLabels = selectedLabels;
	}

	function toggleAssignee(userId: string) {
		if (selectedAssignees.has(userId)) {
			selectedAssignees.delete(userId);
		} else {
			selectedAssignees.add(userId);
		}
		selectedAssignees = selectedAssignees;
	}

	function togglePriority(priority: string) {
		if (selectedPriorities.has(priority)) {
			selectedPriorities.delete(priority);
		} else {
			selectedPriorities.add(priority);
		}
		selectedPriorities = selectedPriorities;
	}

	let hasActiveFilters = $derived(
		searchQuery.trim() !== '' ||
			selectedLabels.size > 0 ||
			selectedAssignees.size > 0 ||
			selectedPriorities.size > 0 ||
			dueDateFilter !== ''
	);

	$effect(() => {
		loadFilterData();
	});
</script>

<div class="relative">
	<div class="flex items-center gap-2">
		<!-- Search Input -->
		<div class="relative max-w-md flex-1">
			<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search cards..."
				class="w-full rounded-md border border-gray-300 bg-white py-2 pr-4 pl-10
					text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500
					focus:outline-none dark:border-gray-600
					dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:ring-blue-400"
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						applyFilters();
					}
				}}
			/>
		</div>

		<!-- Filter Button -->
		<button
			onclick={() => (showDropdown = !showDropdown)}
			class="relative flex items-center gap-2 rounded-md border border-gray-300
				bg-white px-4 py-2 text-gray-700
				transition-colors hover:bg-gray-50 dark:border-gray-600
				dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
		>
			<Filter class="h-4 w-4" />
			Filters
			{#if hasActiveFilters}
				<span class="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-600"></span>
			{/if}
		</button>
	</div>

	<!-- Filter Dropdown -->
	{#if showDropdown}
		<div
			class="absolute top-full right-0 z-50 mt-2 w-96 rounded-lg border
			border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="space-y-4 p-4">
				<!-- Priority Filter -->
				<div>
					<h3 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Priority</h3>
					<div class="flex flex-wrap gap-2">
						{#each priorities as priority (priority.value)}
							<button
								onclick={() => togglePriority(priority.value)}
								class="rounded-full border px-3 py-1 text-xs font-medium transition-colors {selectedPriorities.has(
									priority.value
								)
									? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
									: 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-gray-500'}"
							>
								<span class="inline-block h-2 w-2 rounded-full {priority.color} mr-1"></span>
								{priority.label}
							</button>
						{/each}
					</div>
				</div>

				<!-- Labels Filter -->
				{#if labels.length > 0}
					<div>
						<h3 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Labels</h3>
						<div class="flex flex-wrap gap-2">
							{#each labels as label (label.id)}
								<button
									onclick={() => toggleLabel(label.id)}
									class="rounded-full px-3 py-1 text-xs font-medium text-white transition-opacity {selectedLabels.has(
										label.id
									)
										? 'opacity-100'
										: 'opacity-60 hover:opacity-100'}"
									style="background-color: {label.color}"
								>
									{#if selectedLabels.has(label.id)}
										<span class="mr-1">✓</span>
									{/if}
									{label.name}
								</button>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Assignees Filter -->
				{#if boardMembers.length > 0}
					<div>
						<h3 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Assignees</h3>
						<div class="flex flex-wrap gap-2">
							{#each boardMembers as member (member.user_id)}
								<button
									onclick={() => toggleAssignee(member.user_id)}
									class="rounded-full border px-3 py-1 text-xs font-medium transition-colors {selectedAssignees.has(
										member.user_id
									)
										? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
										: 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-gray-500'}"
								>
									<User class="mr-1 inline h-3 w-3" />
									{member.full_name || member.email.split('@')[0]}
								</button>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Due Date Filter -->
				<div>
					<h3 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</h3>
					<select
						bind:value={dueDateFilter}
						class="w-full rounded-md border border-gray-300 bg-white px-3 py-2
							text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					>
						{#each dueDateOptions as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>

				<!-- Action Buttons -->
				<div
					class="flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-700"
				>
					<button
						onclick={clearFilters}
						class="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400
							dark:hover:text-gray-200"
					>
						Clear all
					</button>
					<button
						onclick={applyFilters}
						class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white
							transition-colors hover:bg-blue-700"
					>
						Apply Filters
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Click outside to close -->
{#if showDropdown}
	<button
		class="fixed inset-0 z-40"
		onclick={() => (showDropdown = false)}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				showDropdown = false;
			}
		}}
		aria-label="Close filter dropdown"
	></button>
{/if}
