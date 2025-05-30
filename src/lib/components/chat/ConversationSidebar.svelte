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

<div
	class="flex w-1/3 flex-col border-r border-gray-200/50 bg-gradient-to-b from-gray-50/30 to-white/30 backdrop-blur-sm dark:border-gray-700/50 dark:from-gray-800/30 dark:to-gray-900/30"
>
	<!-- Header -->
	<div
		class="border-b border-gray-200/50 bg-white/40 p-6 backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-800/40"
	>
		<h2
			class="flex items-center gap-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-xl font-bold text-transparent dark:from-gray-100 dark:to-gray-300"
		>
			<div class="relative">
				<div
					class="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 opacity-20 blur"
				></div>
				<MessageCircle class="relative h-6 w-6 text-blue-600 dark:text-blue-400" />
			</div>
			Chat
		</h2>
	</div>

	<!-- Conversations List -->
	<div class="flex-1 space-y-2 overflow-y-auto p-4">
		{#if conversations.length > 0}
			<div>
				<h3
					class="mb-4 px-2 text-sm font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400"
				>
					Recent Conversations
				</h3>
				{#each conversations as conversation (conversation.id)}
					{@const otherUser = getOtherUser(conversation, currentUserId)}
					<button
						class="group w-full rounded-xl p-4 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-lg {selectedConversation?.id ===
						conversation.id
							? 'border-2 border-blue-200/50 bg-gradient-to-r from-blue-500/10 to-purple-500/10 shadow-lg shadow-blue-500/10 dark:border-blue-400/30 dark:from-blue-600/20 dark:to-purple-600/20 dark:shadow-blue-400/10'
							: 'border border-gray-200/50 bg-white/60 backdrop-blur-sm hover:border-gray-300/50 hover:bg-white/80 dark:border-gray-700/50 dark:bg-gray-800/60 dark:hover:border-gray-600/50 dark:hover:bg-gray-800/80'}"
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
								<div
									class="absolute -right-1 -bottom-1 h-4 w-4 rounded-full border-2 border-white bg-green-500 dark:border-gray-800"
								></div>
							</div>
							<div class="min-w-0 flex-1">
								<div
									class="truncate text-sm font-semibold text-gray-900 transition-colors group-hover:text-gray-800 dark:text-gray-100 dark:group-hover:text-gray-50"
								>
									{otherUser?.profiles?.name || otherUser?.email || 'Unknown User'}
								</div>
								<div class="text-xs font-medium text-gray-500 dark:text-gray-400">
									{formatTime(conversation.updated_at)}
								</div>
							</div>
							{#if selectedConversation?.id === conversation.id}
								<div
									class="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
								></div>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		{/if}

		<!-- Self Chat Option -->
		{#if conversations.length === 0}
			<button
				class="w-full rounded-xl border border-purple-200/50 bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 text-left backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:from-purple-500/20 hover:to-pink-500/20 hover:shadow-lg dark:border-purple-400/30"
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
						<div
							class="absolute -top-1 -right-1 rounded-full bg-white p-1 shadow-lg dark:bg-gray-800"
						>
							<Plus class="h-3 w-3 text-purple-600 dark:text-purple-400" />
						</div>
					</div>
					<div class="min-w-0 flex-1">
						<div class="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
							Start Self Chat
						</div>
						<div class="text-xs font-medium text-gray-500 dark:text-gray-400">
							Chat with yourself for testing
						</div>
					</div>
				</div>
			</button>
		{/if}
	</div>
</div>
