<script lang="ts">
	import { supabase } from '$lib/db.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import { Plus, Check, UserPlus } from 'lucide-svelte';

	interface BoardMember {
		user_id: string;
		email: string;
		full_name: string | null;
		avatar_url: string | null;
	}

	interface Props {
		cardId: string;
		boardId: string;
	}

	let { cardId, boardId }: Props = $props();

	let boardMembers = $state<BoardMember[]>([]);
	let assignedUserIds = $state<Set<string>>(new Set());
	let showDropdown = $state(false);
	let isLoading = $state(true);
	let isInviting = $state(false);
	let inviteEmail = $state('');

	async function loadMembers() {
		if (!authStore.user) return;

		isLoading = true;

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
					full_name: null, // We'll use email for display since full_name isn't in users table
					avatar_url: null
				}));
			}
		}

		// Load assigned users for this card
		const { data: assignments, error: assignError } = await supabase
			.from('card_assignees')
			.select('user_id')
			.eq('card_id', cardId);

		if (!assignError && assignments) {
			assignedUserIds = new Set(assignments.map((a) => a.user_id));
		}

		isLoading = false;
	}

	async function toggleAssignment(userId: string) {
		if (!authStore.user) return;

		if (assignedUserIds.has(userId)) {
			// Remove assignment
			const { error } = await supabase
				.from('card_assignees')
				.delete()
				.eq('card_id', cardId)
				.eq('user_id', userId);

			if (!error) {
				assignedUserIds.delete(userId);
				assignedUserIds = assignedUserIds;
			}
		} else {
			// Add assignment
			const { error } = await supabase.from('card_assignees').insert({
				card_id: cardId,
				user_id: userId
			});

			if (!error) {
				assignedUserIds.add(userId);
				assignedUserIds = assignedUserIds;
			}
		}
	}

	async function inviteMember() {
		if (!authStore.user || !inviteEmail.trim()) return;

		// Check if user exists
		const { data: profile, error: profileError } = await supabase
			.from('profiles')
			.select('id')
			.eq('email', inviteEmail.trim())
			.single();

		if (profileError || !profile) {
			alert('User not found. They must sign up first.');
			return;
		}

		// Check if already a member
		const existing = boardMembers.find((m) => m.user_id === profile.id);
		if (existing) {
			alert('User is already a board member.');
			return;
		}

		// Add as board member
		const { error } = await supabase.from('board_members').insert({
			board_id: boardId,
			user_id: profile.id,
			role: 'member'
		});

		if (!error) {
			inviteEmail = '';
			isInviting = false;
			await loadMembers();
		}
	}

	function getMemberDisplayName(member: BoardMember): string {
		return member.full_name || member.email.split('@')[0];
	}

	$effect(() => {
		loadMembers();
	});
</script>

<div class="relative">
	<!-- Assigned Members Display -->
	<div class="flex flex-wrap items-center gap-2">
		{#each boardMembers.filter((m) => assignedUserIds.has(m.user_id)) as member (member.user_id)}
			<div class="flex items-center gap-1">
				<Avatar src={member.avatar_url} alt={getMemberDisplayName(member)} size="sm" />
				<span class="text-xs text-gray-600 dark:text-gray-400">
					{getMemberDisplayName(member)}
				</span>
			</div>
		{/each}

		<button
			onclick={() => (showDropdown = !showDropdown)}
			class="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs
				font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800
				dark:text-gray-400 dark:hover:bg-gray-700"
		>
			<Plus class="h-3 w-3" />
			Assign
		</button>
	</div>

	<!-- Dropdown -->
	{#if showDropdown}
		<div
			class="absolute top-full left-0 z-50 mt-1 w-64 rounded-md border
			border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="p-2">
				{#if isInviting}
					<!-- Invite New Member -->
					<div class="space-y-2 rounded border border-gray-200 p-2 dark:border-gray-700">
						<input
							type="email"
							bind:value={inviteEmail}
							placeholder="Email address"
							class="w-full rounded border border-gray-300 bg-white px-2 py-1
								text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
							onkeydown={(e) => e.key === 'Enter' && inviteMember()}
						/>

						<div class="flex gap-2">
							<button
								onclick={inviteMember}
								disabled={!inviteEmail.trim()}
								class="flex-1 rounded bg-blue-600 px-2 py-1 text-xs font-medium
									text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
							>
								Add to Board
							</button>
							<button
								onclick={() => {
									isInviting = false;
									inviteEmail = '';
								}}
								class="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-800
									dark:text-gray-400 dark:hover:text-gray-200"
							>
								Cancel
							</button>
						</div>
					</div>
				{:else}
					<!-- Member List -->
					{#if isLoading}
						<div class="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
							Loading members...
						</div>
					{:else if boardMembers.length === 0}
						<div class="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
							No board members yet
						</div>
					{:else}
						<div class="max-h-64 overflow-y-auto">
							{#each boardMembers as member (member.user_id)}
								<button
									onclick={() => toggleAssignment(member.user_id)}
									class="flex w-full items-center gap-2 rounded p-2 hover:bg-gray-100
										dark:hover:bg-gray-700"
								>
									<Avatar src={member.avatar_url} alt={getMemberDisplayName(member)} size="sm" />
									<div class="flex-1 text-left">
										<div class="text-sm font-medium text-gray-700 dark:text-gray-300">
											{getMemberDisplayName(member)}
										</div>
										<div class="text-xs text-gray-500 dark:text-gray-400">
											{member.email}
										</div>
									</div>
									{#if assignedUserIds.has(member.user_id)}
										<Check class="h-4 w-4 text-green-600 dark:text-green-400" />
									{/if}
								</button>
							{/each}
						</div>
					{/if}

					<div class="mt-2 border-t border-gray-200 pt-2 dark:border-gray-700">
						<button
							onclick={() => (isInviting = true)}
							class="flex w-full items-center gap-2 rounded px-2 py-1 text-sm
								text-gray-600 hover:bg-gray-100 hover:text-gray-800
								dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
						>
							<UserPlus class="h-4 w-4" />
							Invite board member
						</button>
					</div>
				{/if}
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
		aria-label="Close member selector dropdown"
	></button>
{/if}
