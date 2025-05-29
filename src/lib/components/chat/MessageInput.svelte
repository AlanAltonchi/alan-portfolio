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
	let textareaElement = $state<HTMLTextAreaElement>();

	const inputHandlers = createMessageInputHandlers({
		startTyping: onStartTyping,
		stopTyping: onStopTyping,
		sendMessage: onSendMessage
	});

	const isSelfConversation = $derived(conversation.user_a === conversation.user_b);

	// Auto-resize textarea and manage scrollbar visibility
	function handleTextareaInput(event: Event) {
		const textarea = event.target as HTMLTextAreaElement;
		
		// Reset height to auto to get the correct scrollHeight
		textarea.style.height = 'auto';
		
		// Calculate the new height (max 6 lines)
		const lineHeight = 20; // Approximate line height in pixels
		const maxHeight = lineHeight * 6; // 6 lines max
		const newHeight = Math.min(textarea.scrollHeight, maxHeight);
		
		textarea.style.height = `${newHeight}px`;
		
		// Call the original input handler
		inputHandlers.handleInput(event);
	}

	// Reset textarea height when message is sent
	$effect(() => {
		if (!newMessage.trim() && textareaElement) {
			textareaElement.style.height = 'auto';
		}
	});
</script>

<style>
	/* Custom scrollbar styling that matches the design */
	.custom-scrollbar {
		scrollbar-width: thin;
		scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
	}
	
	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
	}
	
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
		border-radius: 10px;
	}
	
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: rgba(156, 163, 175, 0.3);
		border-radius: 10px;
		transition: background-color 0.2s ease;
	}
	
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: rgba(156, 163, 175, 0.5);
	}
	
	/* Dark mode scrollbar */
	:global(.dark) .custom-scrollbar {
		scrollbar-color: rgba(75, 85, 99, 0.4) transparent;
	}
	
	:global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
		background: rgba(75, 85, 99, 0.4);
	}
	
	:global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: rgba(75, 85, 99, 0.6);
	}
	
	/* Hide scrollbar when content fits in one line */
	.single-line-textarea {
		overflow: hidden;
	}
	
	.multi-line-textarea {
		overflow-y: auto;
	}
</style>

<div class="relative border-t border-gray-200/30 px-6 py-6 dark:border-gray-700/30 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md">
	<!-- Typing Indicator -->
	{#if otherUserTyping}
		<div class="absolute -top-8 left-6 mb-2 px-3 py-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
			<div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
				<div class="flex gap-1">
					<div class="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
					<div class="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
					<div class="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
				</div>
				<span class="font-medium">
					{isSelfConversation ? 'Test user is typing...' : 'Someone is typing...'}
				</span>
			</div>
		</div>
	{/if}

	<div class="flex gap-3 items-end">
		<input
			type="file"
			accept="image/*"
			bind:this={fileInput}
			onchange={onImageUpload}
			class="hidden"
		/>
		<Button 
			variant="ghost" 
			size="sm" 
			onclick={() => fileInput?.click()} 
			title="Upload image"
			class="h-[46px] w-[46px] my-auto bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 hover:bg-blue-50/80 dark:hover:bg-blue-900/20 hover:border-blue-200/50 dark:hover:border-blue-400/30 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl group rounded-2xl flex items-center justify-center"
		>
			<Image class="h-4 w-4 shrink-0 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
		</Button>
		
		<div class="flex-1 relative">
			<textarea
				bind:this={textareaElement}
				bind:value={newMessage}
				placeholder="Type a message..."
				class="w-full resize-none rounded-2xl border border-gray-300/50 dark:border-gray-600/50 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm px-4 py-3 text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 focus:outline-none dark:text-white transition-all duration-200 shadow-lg hover:shadow-xl custom-scrollbar {newMessage.includes('\n') || (textareaElement?.scrollHeight || 0) > 60 ? 'multi-line-textarea' : 'single-line-textarea'}"
				rows="1"
				style="min-height: 46px; max-height: 120px; line-height: 20px;"
				onkeydown={inputHandlers.handleKeydown}
				oninput={handleTextareaInput}
			></textarea>
			<!-- Floating label effect -->
			<div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none opacity-0 transition-opacity duration-200 {newMessage.trim() ? 'opacity-100' : ''}"></div>
		</div>
		
		<Button 
			onclick={onSendMessage} 
			disabled={!newMessage.trim()}
			class="h-[46px] w-[46px] my-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-600 dark:disabled:to-gray-700 text-white shadow-lg hover:shadow-xl disabled:shadow-none hover:scale-105 disabled:scale-100 transition-all duration-200 rounded-2xl flex items-center justify-center"
		>
			<Send class="h-4 w-4 shrink-0" />
		</Button>
	</div>

	<!-- Enhanced Info Section - More Subtle -->
	<div class="mt-3 space-y-1.5">
		<!-- Keyboard Shortcuts Info -->
		<div class="flex items-center gap-2 text-[12px] text-gray-400 dark:text-gray-500">
			<div class="flex items-center gap-1">
				<kbd class="px-1.5 py-0.5 bg-gray-100/50 dark:bg-gray-700/50 rounded text-[11px] font-mono border border-gray-200/30 dark:border-gray-600/30">Enter</kbd>
				<span>to send</span>
			</div>
			<span class="text-gray-300/50 dark:text-gray-600/50">•</span>
			<div class="flex items-center gap-1">
				<kbd class="px-1.5 py-0.5 bg-gray-100/50 dark:bg-gray-700/50 rounded text-[11px] font-mono border border-gray-200/30 dark:border-gray-600/30">Shift</kbd>
				<span>+</span>
				<kbd class="px-1.5 py-0.5 bg-gray-100/50 dark:bg-gray-700/50 rounded text-[11px] font-mono border border-gray-200/30 dark:border-gray-600/30">Enter</kbd>
				<span>for new line</span>
			</div>
		</div>

		<!-- Markdown Info -->
		<div class="text-[12px] text-gray-400 dark:text-gray-500">
			<span class="font-medium text-gray-500 dark:text-gray-400">Markdown supported:</span>
			<div class="flex flex-wrap gap-1.5 mt-0.5">
				<code class="px-1 py-0.5 bg-gray-100/30 dark:bg-gray-700/30 rounded text-[10px]">**bold**</code>
				<code class="px-1 py-0.5 bg-gray-100/30 dark:bg-gray-700/30 rounded text-[10px]">*italic*</code>
				<code class="px-1 py-0.5 bg-gray-100/30 dark:bg-gray-700/30 rounded text-[10px]">`code`</code>
				<code class="px-1 py-0.5 bg-gray-100/30 dark:bg-gray-700/30 rounded text-[10px]">[links](url)</code>
				<code class="px-1 py-0.5 bg-gray-100/30 dark:bg-gray-700/30 rounded text-[10px]">> quotes</code>
				<code class="px-1 py-0.5 bg-gray-100/30 dark:bg-gray-700/30 rounded text-[10px]">- lists</code>
			</div>
		</div>
	</div>
</div>
