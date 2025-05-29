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

<div class="flex w-1/3 flex-col border-r border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-b from-gray-50/30 to-white/30 dark:from-gray-800/30 dark:to-gray-900/30 backdrop-blur-sm">
	<!-- Header -->
	<div class="border-b border-gray-200/50 p-6 dark:border-gray-700/50 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
		<h2 class="flex items-center gap-3 text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
			<div class="relative">
				<div class="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-20"></div>
				<MessageCircle class="relative h-6 w-6 text-blue-600 dark:text-blue-400" />
			</div>
			Chat
		</h2>
	</div>

	<!-- Conversations List -->
	<div class="flex-1 overflow-y-auto p-4 space-y-2">
		{#if conversations.length > 0}
			<div>
				<h3 class="mb-4 px-2 text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
					Recent Conversations
				</h3>
				{#each conversations as conversation}
					{@const otherUser = getOtherUser(conversation, currentUserId)}
					<button
						class="w-full rounded-xl p-4 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-lg group {selectedConversation?.id ===
						conversation.id
							? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-blue-200/50 shadow-lg shadow-blue-500/10 dark:from-blue-600/20 dark:to-purple-600/20 dark:border-blue-400/30 dark:shadow-blue-400/10'
							: 'bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:border-gray-300/50 dark:hover:border-gray-600/50'}"
						onclick={() => onSelectConversation(conversation)}
					>
						<div class="flex items-center gap-4">
							<div class="relative">
								<Avatar
									src={otherUser?.profiles?.avatar_url}
									name={otherUser?.profiles?.name || undefined}
									email={otherUser?.email}
									size="md"
								/>
								<div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
							</div>
							<div class="min-w-0 flex-1">
								<div class="truncate text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-gray-800 dark:group-hover:text-gray-50 transition-colors">
									{otherUser?.profiles?.name || otherUser?.email || 'Unknown User'}
								</div>
								<div class="text-xs text-gray-500 dark:text-gray-400 font-medium">
									{formatTime(conversation.updated_at)}
								</div>
							</div>
							{#if selectedConversation?.id === conversation.id}
								<div class="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		{/if}

		<!-- Self Chat Option -->
		{#if conversations.length === 0}
			<button
				class="w-full rounded-xl p-4 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200/50 dark:border-purple-400/30 hover:from-purple-500/20 hover:to-pink-500/20 backdrop-blur-sm"
				onclick={onCreateSelfConversation}
			>
				<div class="flex items-center gap-4">
					<div class="relative">
						<Avatar
							src={null}
							name="Self Chat"
							email="self@chat.com"
							size="md"
							class="bg-gradient-to-br from-purple-500 to-pink-600"
						/>
						<div class="absolute -top-1 -right-1 p-1 bg-white dark:bg-gray-800 rounded-full shadow-lg">
							<Plus class="h-3 w-3 text-purple-600 dark:text-purple-400" />
						</div>
					</div>
					<div class="min-w-0 flex-1">
						<div class="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">Start Self Chat</div>
						<div class="text-xs text-gray-500 dark:text-gray-400 font-medium">
							Chat with yourself for testing
						</div>
					</div>
				</div>
			</button>
		{/if}
	</div>
</div>
