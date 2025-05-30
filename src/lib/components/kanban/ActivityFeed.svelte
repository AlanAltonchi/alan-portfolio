<script lang="ts">
	import { supabase } from '$lib/db.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import { 
		Plus, 
		Edit, 
		Move, 
		Trash2, 
		MessageSquare, 
		Paperclip, 
		CheckSquare,
		Calendar,
		Users,
		Filter,
		X
	} from 'lucide-svelte';
	
	interface Activity {
		id: string;
		board_id: string;
		user_id: string | null;
		action: string;
		metadata: any;
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
				filteredActivities = filteredActivities.filter(activity => {
					// Check if the activity metadata contains this card's title
					if (activity.metadata && cardTitle) {
						return activity.metadata.card_title === cardTitle;
					}
					return false;
				});
			}
			
			// Get unique user IDs (filter out null values)
			const userIds = [...new Set(filteredActivities?.map(a => a.user_id).filter((id): id is string => id !== null) || [])];
			
			// Get user details
			const { data: usersData } = await supabase
				.from('users')
				.select('id, email')
				.in('id', userIds);
			
			// Combine activities with user data
			activities = (filteredActivities || []).map(activity => ({
				...activity,
				user: usersData?.find(u => u.id === activity.user_id) || null
			})) as Activity[];
		} catch (err) {
			console.error('Error loading activities:', err);
		} finally {
			isLoading = false;
		}
	}
	
	function getActivityIcon(action: string) {
		const actionType = actionTypes.find(t => t.value === action);
		return actionType?.icon || Plus;
	}
	
	function getActivityColor(action: string): string {
		if (action.includes('created')) return 'text-green-600 dark:text-green-400';
		if (action.includes('updated') || action.includes('moved')) return 'text-blue-600 dark:text-blue-400';
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
			case 'card_moved':
				const sourceCol = metadata.source_column_name || 'Unknown Column';
				const targetCol = metadata.target_column_name || 'Unknown Column';
				const cardTitle = metadata.card_title || 'a card';
				if (sourceCol === targetCol) {
					return `${userName} reordered card "${cardTitle}" within ${sourceCol}`;
				} else {
					return `${userName} moved card "${cardTitle}" from ${sourceCol} to ${targetCol}`;
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
			<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
				Activity Feed
			</h3>
			
			<div class="relative">
				<button
					onclick={() => showFilterDropdown = !showFilterDropdown}
					class="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 
						dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800
						{selectedActions.size > 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' : ''}"
				>
					<Filter class="w-4 h-4" />
					Filter
					{#if selectedActions.size > 0}
						<span class="px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
							{selectedActions.size}
						</span>
					{/if}
				</button>
				
				{#if showFilterDropdown}
					<div class="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-gray-800 
						rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
						<div class="p-3">
							<div class="flex items-center justify-between mb-2">
								<span class="text-sm font-medium text-gray-700 dark:text-gray-300">
									Filter by Action
								</span>
								{#if selectedActions.size > 0}
									<button
										onclick={clearFilters}
										class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
									>
										Clear all
									</button>
								{/if}
							</div>
							
							<div class="space-y-1 max-h-[350px] overflow-y-auto">
								{#each actionTypes as actionType}
									<button
										onclick={() => toggleActionFilter(actionType.value)}
										class="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded 
											hover:bg-gray-100 dark:hover:bg-gray-700 text-left
											{selectedActions.has(actionType.value) 
												? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' 
												: 'text-gray-700 dark:text-gray-300'}"
									>
										<actionType.icon class="w-4 h-4" />
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
			{#each Array(5) as _}
				<div class="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md animate-pulse">
					<div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
					<div class="flex-1 space-y-2">
						<div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
						<div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if activities.length === 0}
		<div class="text-center py-8 text-gray-500 dark:text-gray-400">
			{selectedActions.size > 0 ? 'No activities match your filters' : 'No activities yet'}
		</div>
	{:else}
		<div class="space-y-2 max-h-[500px] overflow-y-auto">
			{#each activities as activity}
				{@const Icon = getActivityIcon(activity.action)}
				<div class="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md 
					hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
					<div class="flex-shrink-0">
						<div class="w-8 h-8 rounded-full bg-white dark:bg-gray-700 
							border-2 border-gray-200 dark:border-gray-600 
							flex items-center justify-center">
							<Icon class="w-4 h-4 {getActivityColor(activity.action)}" />
						</div>
					</div>
					
					<div class="flex-1 min-w-0">
						<p class="text-sm text-gray-900 dark:text-white">
							{formatActivityMessage(activity)}
						</p>
						<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
	<div
		class="fixed inset-0 z-40"
		onclick={() => showFilterDropdown = false}
	/>
{/if}