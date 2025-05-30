<script lang="ts">
	import { supabase } from '$lib/db.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import { onMount } from 'svelte';
	
	interface PresenceUser {
		user_id: string;
		email: string;
		full_name?: string | null;
		avatar_url?: string | null;
		last_seen: string;
	}
	
	interface Props {
		boardId: string;
		maxUsers?: number;
	}
	
	let { boardId, maxUsers = 8 }: Props = $props();
	
	let activeUsers = $state<PresenceUser[]>([]);
	let presenceChannel: any = null;
	
	async function setupPresence() {
		if (!authStore.user) return;
		
		// Create presence channel
		presenceChannel = supabase.channel(`presence:${boardId}`, {
			config: {
				presence: {
					key: authStore.user.id,
				},
			},
		});
		
		// Track user presence
		presenceChannel
			.on('presence', { event: 'sync' }, () => {
				const presenceState = presenceChannel.presenceState();
				updateActiveUsers(presenceState);
			})
			.on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
				console.log('User joined:', key, newPresences);
			})
			.on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
				console.log('User left:', key, leftPresences);
			});
		
		// Join the presence channel
		await presenceChannel.subscribe(async (status: string) => {
			if (status === 'SUBSCRIBED') {
				// Track current user's presence
				await presenceChannel.track({
					user_id: authStore.user!.id,
					email: authStore.user!.email,
					joined_at: new Date().toISOString(),
				});
			}
		});
	}
	
	function updateActiveUsers(presenceState: any) {
		const users: PresenceUser[] = [];
		
		for (const userId in presenceState) {
			const presences = presenceState[userId];
			if (presences.length > 0) {
				const presence = presences[0]; // Take the first presence
				users.push({
					user_id: userId,
					email: presence.email || '',
					full_name: presence.full_name || null,
					avatar_url: presence.avatar_url || null,
					last_seen: presence.joined_at || new Date().toISOString()
				});
			}
		}
		
		activeUsers = users.slice(0, maxUsers);
	}
	
	function getUserDisplayName(user: PresenceUser): string {
		return user.full_name || user.email.split('@')[0];
	}
	
	function formatLastSeen(lastSeen: string): string {
		const date = new Date(lastSeen);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		
		if (diffMins < 1) return 'Active now';
		if (diffMins < 60) return `Active ${diffMins}m ago`;
		return `Active ${Math.floor(diffMins / 60)}h ago`;
	}
	
	onMount(() => {
		setupPresence();
		
		return () => {
			if (presenceChannel) {
				presenceChannel.unsubscribe();
			}
		};
	});
</script>

{#if activeUsers.length > 0}
	<div class="flex items-center gap-2">
		<span class="text-sm text-gray-600 dark:text-gray-400">
			Active:
		</span>
		
		<div class="flex -space-x-2">
			{#each activeUsers as user, index}
				{#if index < maxUsers - 1 || activeUsers.length <= maxUsers}
					<div 
						class="relative group"
						title="{getUserDisplayName(user)} - {formatLastSeen(user.last_seen)}"
					>
						<Avatar
							src={user.avatar_url}
							alt={getUserDisplayName(user)}
							size="sm"
							class="border-2 border-white dark:border-gray-800 hover:z-10 transition-transform hover:scale-110"
						/>
						
						<!-- Online indicator -->
						<div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 
							border-2 border-white dark:border-gray-800 rounded-full">
						</div>
						
						<!-- Tooltip -->
						<div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
							px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 
							group-hover:opacity-100 transition-opacity pointer-events-none z-20">
							{getUserDisplayName(user)}
							<div class="text-xs text-gray-300">
								{formatLastSeen(user.last_seen)}
							</div>
						</div>
					</div>
				{/if}
			{/each}
			
			{#if activeUsers.length > maxUsers}
				<div class="flex items-center justify-center w-8 h-8 bg-gray-200 dark:bg-gray-700 
					text-xs font-medium text-gray-600 dark:text-gray-300 rounded-full 
					border-2 border-white dark:border-gray-800">
					+{activeUsers.length - (maxUsers - 1)}
				</div>
			{/if}
		</div>
	</div>
{/if}