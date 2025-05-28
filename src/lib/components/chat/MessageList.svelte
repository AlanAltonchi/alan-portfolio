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
	class="scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100 dark:scrollbar-thumb-blue-700 dark:scrollbar-track-gray-800 flex-1 space-y-4 overflow-y-auto p-4"
	role="presentation"
>
	{#each messages as message}
		<MessageBubble 
			{message}
			{conversation}
			{currentUserId}
			{onImageLoad}
		/>
	{/each}
</div> 