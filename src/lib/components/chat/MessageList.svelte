<script lang="ts">
	import MessageBubble from './MessageBubble.svelte';
	import type { Message, ConversationWithUsers } from '$lib/types';

	let {
		messages,
		conversation,
		currentUserId,
		onImageLoad,
		messagesContainer = $bindable()
	} = $props<{
		messages: Message[];
		conversation: ConversationWithUsers;
		currentUserId: string;
		onImageLoad?: () => void;
		messagesContainer?: HTMLDivElement;
	}>();
</script>

<div
	bind:this={messagesContainer}
	class="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800"
	role="presentation"
>
	{#each messages as message}
		<MessageBubble {message} {conversation} {currentUserId} {onImageLoad} />
	{/each}
</div>
