<script lang="ts">
	import { supabase } from '$lib/db.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import {
		Plus,
		Edit,
		Move,
		Trash2,
		MessageSquare,
		Paperclip,
		CheckSquare,
		Filter
	} from 'lucide-svelte';

	interface Activity {
		id: string;
		board_id: string;
		user_id: string | null;
		action: string;
		metadata: {
			card_title?: string;
			board_title?: string;
			source_column_name?: string;
			target_column_name?: string;
			[key: string]: unknown;
		};
		created_at: string;
		user?: {
			id: string;
			email: string;
			full_name?: string | null;
		} | null;
	}

	interface Props {
		boardId: string;
		cardId?: string; // Optional: filter activities for specific card
		maxItems?: number;
		showFilters?: boolean;
	}

	let { boardId, cardId, maxItems = 50, showFilters = true }: Props = $props();

	let activities = $state<Activity[]>([]);
	let isLoading = $state(true);
	let selectedActions = $state<Set<string>>(new Set());
	let showFilterDropdown = $state(false);

	const actionTypes = [
		{ value: 'board_created', label: 'Board Created', icon: Plus },
		{ value: 'board_updated', label: 'Board Updated', icon: Edit },
		{ value: 'card_created', label: 'Card Created', icon: Plus },
		{ value: 'card_updated', label: 'Card Updated', icon: Edit },
		{ value: 'card_moved', label: 'Card Moved', icon: Move },
		{ value: 'card_deleted', label: 'Card Deleted', icon: Trash2 },
		{ value: 'comment_added', label: 'Comment Added', icon: MessageSquare },
		{ value: 'attachment_added', label: 'Attachment Added', icon: Paperclip },
		{ value: 'checklist_updated', label: 'Checklist Updated', icon: CheckSquare }
	];

	async function loadActivities() {
		if (!authStore.user) return;

		isLoading = true;

		try {
			let query = supabase
				.from('board_activities')
				.select('*')
				.eq('board_id', boardId)
				.order('created_at', { ascending: false })
				.limit(maxItems);

			// Apply action filter if any selected
			if (selectedActions.size > 0) {
				query = query.in('action', Array.from(selectedActions));
			}

			const { data: activitiesData, error } = await query;

			if (error) throw error;

			// Filter activities for specific card if cardId is provided
			let filteredActivities = activitiesData || [];
			if (cardId) {
				// For card-specific activities, we need to get the card title first
				const { data: cardData } = await supabase
					.from('cards')
					.select('title')
					.eq('id', cardId)
					.single();

				const cardTitle = cardData?.title;

				// Filter activities that are related to this specific card
				filteredActivities = filteredActivities.filter((activity) => {
					// Check if the activity metadata contains this card's title
					if (activity.metadata && cardTitle) {
						const metadata = activity.metadata as { card_title?: string; [key: string]: unknown };
						return metadata.card_title === cardTitle;
					}
					return false;
				});
			}

			// Get unique user IDs (filter out null values)
			const userIds = [
				...new Set(
					filteredActivities?.map((a) => a.user_id).filter((id): id is string => id !== null) || []
				)
			];

			// Get user details
			const { data: usersData } = await supabase
				.from('users')
				.select('id, email')
				.in('id', userIds);

			// Combine activities with user data
			activities = (filteredActivities || []).map((activity) => ({
				...activity,
				user: usersData?.find((u) => u.id === activity.user_id) || null
			})) as Activity[];
		} catch (err) {
			console.error('Error loading activities:', err);
		} finally {
			isLoading = false;
		}
	}

	function getActivityIcon(action: string) {
		const actionType = actionTypes.find((t) => t.value === action);
		return actionType?.icon || Plus;
	}

	function getActivityColor(action: string): string {
		if (action.includes('created')) return 'text-green-600 dark:text-green-400';
		if (action.includes('updated') || action.includes('moved'))
			return 'text-blue-600 dark:text-blue-400';
		if (action.includes('deleted')) return 'text-red-600 dark:text-red-400';
		return 'text-gray-600 dark:text-gray-400';
	}

	function formatActivityMessage(activity: Activity): string {
		const userName = activity.user?.full_name || activity.user?.email?.split('@')[0] || 'Someone';
		const metadata = activity.metadata || {};

		switch (activity.action) {
			case 'board_created':
				return `${userName} created the board "${metadata.board_title || 'Untitled'}"`;
			case 'board_updated':
				return `${userName} updated the board settings`;
			case 'card_created':
				return `${userName} created card "${metadata.card_title || 'Untitled'}"`;
			case 'card_updated':
				return `${userName} updated a card`;
			case 'card_moved': {
				const sourceCol = metadata.source_column_name || 'Unknown Column';
				const targetCol = metadata.target_column_name || 'Unknown Column';
				const cardTitle = metadata.card_title || 'a card';
				if (sourceCol === targetCol) {
					return `${userName} reordered card "${cardTitle}" within ${sourceCol}`;
				} else {
					return `${userName} moved card "${cardTitle}" from ${sourceCol} to ${targetCol}`;
				}
			}
			case 'card_deleted':
				return `${userName} deleted a card`;
			case 'comment_added':
				return `${userName} added a comment`;
			case 'attachment_added':
				return `${userName} added an attachment`;
			case 'checklist_updated':
				return `${userName} updated a checklist`;
			default:
				return `${userName} performed an action`;
		}
	}

	function formatRelativeTime(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);

		if (diffMins < 1) return 'just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
		if (diffMins < 10080) return `${Math.floor(diffMins / 1440)}d ago`;

		return date.toLocaleDateString();
	}

	function toggleActionFilter(action: string) {
		if (selectedActions.has(action)) {
			selectedActions.delete(action);
		} else {
			selectedActions.add(action);
		}
		selectedActions = selectedActions;
		loadActivities();
	}

	function clearFilters() {
		selectedActions.clear();
		selectedActions = selectedActions;
		showFilterDropdown = false;
		loadActivities();
	}

	$effect(() => {
		loadActivities();

		// Set up real-time subscription for new activities
		const channel = supabase
			.channel(`activities:${boardId}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'board_activities',
					filter: `board_id=eq.${boardId}`
				},
				() => loadActivities()
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	});
</script>

<div class="space-y-4">
	<!-- Header and Filters -->
	{#if showFilters}
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-semibold text-gray-900 dark:text-white">Activity Feed</h3>

			<div class="relative">
				<button
					onclick={() => (showFilterDropdown = !showFilterDropdown)}
					class="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5
						text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800
						{selectedActions.size > 0
						? 'border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20'
						: ''}"
				>
					<Filter class="h-4 w-4" />
					Filter
					{#if selectedActions.size > 0}
						<span class="rounded-full bg-blue-600 px-1.5 py-0.5 text-xs text-white">
							{selectedActions.size}
						</span>
					{/if}
				</button>

				{#if showFilterDropdown}
					<div
						class="absolute top-full right-0 z-50 mt-1 w-64 rounded-md
						border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
					>
						<div class="p-3">
							<div class="mb-2 flex items-center justify-between">
								<span class="text-sm font-medium text-gray-700 dark:text-gray-300">
									Filter by Action
								</span>
								{#if selectedActions.size > 0}
									<button
										onclick={clearFilters}
										class="text-xs text-blue-600 hover:underline dark:text-blue-400"
									>
										Clear all
									</button>
								{/if}
							</div>

							<div class="max-h-[350px] space-y-1 overflow-y-auto">
								{#each actionTypes as actionType (actionType.value)}
									<button
										onclick={() => toggleActionFilter(actionType.value)}
										class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left
											text-sm hover:bg-gray-100 dark:hover:bg-gray-700
											{selectedActions.has(actionType.value)
											? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
											: 'text-gray-700 dark:text-gray-300'}"
									>
										<actionType.icon class="h-4 w-4" />
										{actionType.label}
									</button>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Activity List -->
	{#if isLoading}
		<div class="space-y-3">
			{#each Array(5) as _, i (i)}
				<div class="flex animate-pulse gap-3 rounded-md bg-gray-50 p-3 dark:bg-gray-800">
					<div class="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600"></div>
					<div class="flex-1 space-y-2">
						<div class="h-4 w-3/4 rounded bg-gray-300 dark:bg-gray-600"></div>
						<div class="h-3 w-1/4 rounded bg-gray-200 dark:bg-gray-700"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if activities.length === 0}
		<div class="py-8 text-center text-gray-500 dark:text-gray-400">
			{selectedActions.size > 0 ? 'No activities match your filters' : 'No activities yet'}
		</div>
	{:else}
		<div class="max-h-[500px] space-y-2 overflow-y-auto">
			{#each activities as activity (activity.id)}
				{@const Icon = getActivityIcon(activity.action)}
				<div
					class="flex gap-3 rounded-md bg-gray-50 p-3 transition-colors
					hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
				>
					<div class="flex-shrink-0">
						<div
							class="flex h-8 w-8 items-center justify-center
							rounded-full border-2 border-gray-200
							bg-white dark:border-gray-600 dark:bg-gray-700"
						>
							<Icon class="h-4 w-4 {getActivityColor(activity.action)}" />
						</div>
					</div>

					<div class="min-w-0 flex-1">
						<p class="text-sm text-gray-900 dark:text-white">
							{formatActivityMessage(activity)}
						</p>
						<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
							{formatRelativeTime(activity.created_at)}
						</p>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Click outside to close filter dropdown -->
{#if showFilterDropdown}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div 
		class="fixed inset-0 z-40" 
		onclick={() => (showFilterDropdown = false)}
		role="button"
		tabindex="-1"
		aria-label="Close filter dropdown"
	></div>
{/if}
