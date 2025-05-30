<script lang="ts">
	import { supabase } from '$lib/db.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import { onMount } from 'svelte';
	import type { RealtimePresenceState } from '@supabase/supabase-js';

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
	let presenceChannel: ReturnType<typeof supabase.channel> | null = null;

	async function setupPresence() {
		if (!authStore.user) return;

		// Create presence channel
		presenceChannel = supabase.channel(`presence:${boardId}`, {
			config: {
				presence: {
					key: authStore.user.id
				}
			}
		});

		// Track user presence
		presenceChannel
			.on('presence', { event: 'sync' }, () => {
				if (presenceChannel) {
					const presenceState = presenceChannel.presenceState() as RealtimePresenceState;
					updateActiveUsers(presenceState);
				}
			})
			.on('presence', { event: 'join' }, ({ key, newPresences }: { key: string; newPresences: unknown[] }) => {
				console.log('User joined:', key, newPresences);
			})
			.on('presence', { event: 'leave' }, ({ key, leftPresences }: { key: string; leftPresences: unknown[] }) => {
				console.log('User left:', key, leftPresences);
			});

		// Join the presence channel
		await presenceChannel.subscribe(async (status: string) => {
			if (status === 'SUBSCRIBED' && presenceChannel) {
				// Track current user's presence
				await presenceChannel.track({
					user_id: authStore.user!.id,
					email: authStore.user!.email,
					joined_at: new Date().toISOString()
				});
			}
		});
	}

	function updateActiveUsers(presenceState: RealtimePresenceState) {
		const users: PresenceUser[] = [];

		for (const userId in presenceState) {
			const presences = presenceState[userId];
			if (presences && presences.length > 0) {
				const presence = presences[0] as {
					email?: string;
					full_name?: string | null;
					avatar_url?: string | null;
					joined_at?: string;
					user_id?: string;
				}; // Take the first presence
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
		<span class="text-sm text-gray-600 dark:text-gray-400"> Active: </span>

		<div class="flex -space-x-2">
			{#each activeUsers as user, index (user.user_id)}
				{#if index < maxUsers - 1 || activeUsers.length <= maxUsers}
					<div
						class="group relative"
						title="{getUserDisplayName(user)} - {formatLastSeen(user.last_seen)}"
					>
						<Avatar
							src={user.avatar_url}
							alt={getUserDisplayName(user)}
							size="sm"
							class="border-2 border-white transition-transform hover:z-10 hover:scale-110 dark:border-gray-800"
						/>

						<!-- Online indicator -->
						<div
							class="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full
							border-2 border-white bg-green-500 dark:border-gray-800"
						></div>

						<!-- Tooltip -->
						<div
							class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2
							-translate-x-1/2 transform rounded bg-gray-900 px-2 py-1 text-xs
							text-white opacity-0 transition-opacity group-hover:opacity-100"
						>
							{getUserDisplayName(user)}
							<div class="text-xs text-gray-300">
								{formatLastSeen(user.last_seen)}
							</div>
						</div>
					</div>
				{/if}
			{/each}

			{#if activeUsers.length > maxUsers}
				<div
					class="flex h-8 w-8 items-center justify-center rounded-full border-2
					border-white bg-gray-200 text-xs font-medium text-gray-600
					dark:border-gray-800 dark:bg-gray-700 dark:text-gray-300"
				>
					+{activeUsers.length - (maxUsers - 1)}
				</div>
			{/if}
		</div>
	</div>
{/if}
