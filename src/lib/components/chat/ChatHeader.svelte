<script lang="ts">
	import { Avatar, Button } from '$lib/components';
	import { Trash2 } from 'lucide-svelte';
	import { getOtherUser } from '$lib/utils/chat';
	import type { ConversationWithUsers } from '$lib/types';

	let { conversation, currentUserId, onShowSimulator, onDeleteConversation } = $props<{
		conversation: ConversationWithUsers;
		currentUserId: string;
		onShowSimulator: () => void;
		onDeleteConversation: () => void;
	}>();

	const otherUser = $derived(getOtherUser(conversation, currentUserId));
</script>

<div
	class="flex items-center justify-between border-b border-gray-200/60 bg-white/95 p-5 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-900/95"
>
	<div class="flex items-center gap-4">
		<div class="group relative">
			<Avatar
				src={otherUser?.profiles?.avatar_url}
				name={otherUser?.profiles?.name || undefined}
				email={otherUser?.email}
				size="md"
				class="ring-2 ring-gray-100 transition-all duration-200 group-hover:ring-gray-200 dark:ring-gray-800 dark:group-hover:ring-gray-700"
			/>
			<!-- Enhanced online status indicator -->
			<div
				class="absolute -right-1 -bottom-1 h-4 w-4 rounded-full border-2 border-white bg-green-500 shadow-sm dark:border-gray-900"
			>
				<div class="h-full w-full animate-pulse rounded-full bg-green-400 opacity-75"></div>
			</div>
		</div>
		<div class="min-w-0 flex-1">
			<div class="truncate font-semibold text-gray-900 dark:text-gray-100">
				{otherUser?.profiles?.name || otherUser?.email || 'Unknown User'}
			</div>
			<div class="flex items-center gap-2 text-sm">
				<div class="flex items-center gap-1.5 text-green-600 dark:text-green-400">
					<div class="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
					<span class="font-medium">Active now</span>
				</div>
				<span class="text-gray-300 dark:text-gray-600">•</span>
				<span class="text-xs text-gray-500 dark:text-gray-400"> Last seen recently </span>
			</div>
		</div>
	</div>

	<div class="flex items-center gap-1">
		<Button
			variant="ghost"
			size="sm"
			onclick={onShowSimulator}
			class="font-medium text-gray-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
		>
			Simulate 2nd User
		</Button>

		<div class="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700"></div>

		<Button
			variant="ghost"
			size="sm"
			onclick={onDeleteConversation}
			class="text-gray-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
		>
			<Trash2 class="h-4 w-4" />
		</Button>
	</div>
</div>
