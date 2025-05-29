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

<div class="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
	<div class="flex items-center gap-3">
		<Avatar
			src={otherUser?.profiles?.avatar_url}
			name={otherUser?.profiles?.name || undefined}
			email={otherUser?.email}
			size="md"
		/>
		<div>
			<div class="font-medium">
				{otherUser?.profiles?.name || otherUser?.email || 'Unknown User'}
			</div>
			<div class="text-sm text-gray-500 dark:text-gray-400">Online</div>
		</div>
	</div>
	<div class="flex gap-2">
		<Button variant="ghost" size="sm" onclick={onShowSimulator}>Simulate 2nd User</Button>
		<Button variant="ghost" size="sm" onclick={onDeleteConversation}>
			<Trash2 class="h-4 w-4" />
		</Button>
	</div>
</div>
