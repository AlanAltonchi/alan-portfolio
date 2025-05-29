<script lang="ts">
	import { Button } from '$lib/components';
	import { Image, Send } from 'lucide-svelte';
	import { createMessageInputHandlers } from '$lib/handlers/chat';
	import type { ConversationWithUsers } from '$lib/types';

	let {
		newMessage = $bindable(),
		conversation,
		otherUserTyping,
		onSendMessage,
		onImageUpload,
		onStartTyping,
		onStopTyping
	} = $props<{
		newMessage: string;
		conversation: ConversationWithUsers;
		otherUserTyping: boolean;
		onSendMessage: () => void;
		onImageUpload: (event: Event) => void;
		onStartTyping: () => void;
		onStopTyping: () => void;
	}>();

	let fileInput = $state<HTMLInputElement>();

	const inputHandlers = createMessageInputHandlers({
		startTyping: onStartTyping,
		stopTyping: onStopTyping,
		sendMessage: onSendMessage
	});

	const isSelfConversation = $derived(conversation.user_a === conversation.user_b);
</script>

<div class="relative border-t border-gray-200 px-4 py-6 dark:border-gray-700">
	<!-- Typing Indicator -->
	{#if otherUserTyping}
		<div class="absolute top-1 left-16 mb-2 text-xs text-gray-500 dark:text-gray-400">
			{isSelfConversation ? 'Test user is typing...' : 'Someone is typing...'}
		</div>
	{/if}

	<div class="flex gap-2">
		<input
			type="file"
			accept="image/*"
			bind:this={fileInput}
			onchange={onImageUpload}
			class="hidden"
		/>
		<Button variant="ghost" size="sm" onclick={() => fileInput?.click()} title="Upload image">
			<Image class="h-4 w-4" />
		</Button>
		<textarea
			bind:value={newMessage}
			placeholder="Type a message..."
			class="flex-1 resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400"
			rows="1"
			onkeydown={inputHandlers.handleKeydown}
			oninput={inputHandlers.handleInput}
		></textarea>
		<Button onclick={onSendMessage} disabled={!newMessage.trim()}>
			<Send class="h-4 w-4" />
		</Button>
	</div>

	<!-- Keyboard Shortcuts Info -->
	<div class="mt-2 ml-14 text-xs text-gray-500 dark:text-gray-400">
		<span class="font-medium">Press Enter to send</span>
		<span class="ml-2">• Shift+Enter for new line</span>
	</div>

	<!-- Markdown Info -->
	<div class="mt-1 ml-14 text-xs text-gray-500 dark:text-gray-400">
		<span class="font-medium">Markdown supported:</span>
		<span class="ml-1">**bold**, *italic*, `code`, [links](url), > quotes, - lists</span>
	</div>
</div>
