<script lang="ts">
	import { Avatar, Button } from '$lib/components';
	import { Trash2, MoreVertical } from 'lucide-svelte';
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

<div class="flex items-center justify-between border-b border-gray-200/60 p-5 dark:border-gray-700/60 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
	<div class="flex items-center gap-4">
		<div class="relative group">
			<Avatar
				src={otherUser?.profiles?.avatar_url}
				name={otherUser?.profiles?.name || undefined}
				email={otherUser?.email}
				size="md"
				class="ring-2 ring-gray-100 dark:ring-gray-800 group-hover:ring-gray-200 dark:group-hover:ring-gray-700 transition-all duration-200"
			/>
			<!-- Enhanced online status indicator -->
			<div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full shadow-sm">
				<div class="w-full h-full bg-green-400 rounded-full animate-pulse opacity-75"></div>
			</div>
		</div>
		<div class="flex-1 min-w-0">
			<div class="font-semibold text-gray-900 dark:text-gray-100 truncate">
				{otherUser?.profiles?.name || otherUser?.email || 'Unknown User'}
			</div>
			<div class="flex items-center gap-2 text-sm">
				<div class="flex items-center gap-1.5 text-green-600 dark:text-green-400">
					<div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
					<span class="font-medium">Active now</span>
				</div>
				<span class="text-gray-300 dark:text-gray-600">•</span>
				<span class="text-gray-500 dark:text-gray-400 text-xs">
					Last seen recently
				</span>
			</div>
		</div>
	</div>
	
	<div class="flex items-center gap-1">
		<Button 
			variant="ghost" 
			size="sm" 
			onclick={onShowSimulator}
			class="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 font-medium"
		>
			Simulate 2nd User
		</Button>
		
		<div class="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
		
		<Button 
			variant="ghost" 
			size="sm" 
			onclick={onDeleteConversation}
			class="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
		>
			<Trash2 class="h-4 w-4" />
		</Button>
		

	</div>
</div>
