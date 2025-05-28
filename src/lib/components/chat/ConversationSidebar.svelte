<script lang="ts">
	import { Avatar } from '$lib/components';
	import { MessageCircle, Plus } from 'lucide-svelte';
	import { formatTime, getOtherUser } from '$lib/utils/chat';
	import type { ConversationWithUsers } from '$lib/types';

	let { 
		conversations,
		selectedConversation,
		currentUserId,
		onSelectConversation,
		onCreateSelfConversation
	} = $props<{
		conversations: ConversationWithUsers[];
		selectedConversation: ConversationWithUsers | null;
		currentUserId: string;
		onSelectConversation: (conversation: ConversationWithUsers) => void;
		onCreateSelfConversation: () => void;
	}>();
</script>

<div class="flex w-1/3 flex-col border-r border-gray-200 dark:border-gray-700">
	<!-- Header -->
	<div class="border-b border-gray-200 p-4 dark:border-gray-700">
		<h2 class="flex items-center gap-2 text-lg font-semibold">
			<MessageCircle class="h-5 w-5" />
			Chat
		</h2>
	</div>

	<!-- Conversations List -->
	<div class="flex-1 overflow-y-auto">
		{#if conversations.length > 0}
			<div class="p-2">
				<h3 class="mb-2 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">
					Recent Conversations
				</h3>
				{#each conversations as conversation}
					{@const otherUser = getOtherUser(conversation, currentUserId)}
					<button
						class="w-full rounded-lg p-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 {selectedConversation?.id ===
						conversation.id
							? 'border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
							: ''}"
						onclick={() => onSelectConversation(conversation)}
					>
						<div class="flex items-center gap-3">
							<Avatar
								src={otherUser?.profiles?.avatar_url}
								name={otherUser?.profiles?.name || undefined}
								email={otherUser?.email}
								size="md"
							/>
							<div class="min-w-0 flex-1">
								<div class="truncate text-sm font-medium">
									{otherUser?.profiles?.name || otherUser?.email || 'Unknown User'}
								</div>
								<div class="text-xs text-gray-500 dark:text-gray-400">
									{formatTime(conversation.updated_at)}
								</div>
							</div>
						</div>
					</button>
				{/each}
			</div>
		{/if}
		
		<!-- Self Chat Option -->
		{#if conversations.length === 0}
			<button
				class="w-full rounded-lg p-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
				onclick={onCreateSelfConversation}
			>
				<div class="flex items-center gap-3">
					<Avatar
						src={null}
						name="Self Chat"
						email="self@chat.com"
						size="sm"
						class="bg-gradient-to-br from-purple-500 to-pink-600"
					/>
					<div class="min-w-0 flex-1">
						<div class="truncate text-sm font-medium">Start Self Chat</div>
						<div class="text-xs text-gray-500 dark:text-gray-400">
							Chat with yourself for testing
						</div>
					</div>
					<Plus class="h-4 w-4 text-gray-400" />
				</div>
			</button>
		{/if}
	</div>
</div> 