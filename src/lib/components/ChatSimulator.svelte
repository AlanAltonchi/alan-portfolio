<script lang="ts">
	import { Avatar, Button, Input } from '$lib/components';
	import type { Message } from '$lib/types';
	import { formatTime, renderMarkdown, scrollToBottomWithImageLoad } from '$lib/utils/chat';
	import {
		createDragHandler,
		createMessageHandler,
		createRealtimeManager,
		createTypingManager,
		getUserProfiles,
		isFromSimulator
	} from '$lib/utils/chat-simulator.svelte';
	import { Image, MessageCircle, Send, X } from 'lucide-svelte';
	import { onDestroy, onMount } from 'svelte';

	let {
		isOpen = $bindable(false),
		conversationId,
		currentUserId,
		supabase,
		conversation
	} = $props<{
		isOpen?: boolean;
		conversationId: string;
		currentUserId: string;
		supabase: any;
		conversation: any;
	}>();

	let messages = $state<Message[]>([]);
	let newMessage = $state('');
	let messagesContainer = $state<HTMLDivElement>();
	let simulatorElement = $state<HTMLDivElement>();
	let isSimulatorFocused = $state(true);
	let isProgrammaticScroll = $state(false);
	let fileInput = $state<HTMLInputElement>();
	let textareaElement = $state<HTMLTextAreaElement>();

	// Initialize handlers
	const dragHandler = createDragHandler();
	const typingManager =
		conversationId && currentUserId
			? createTypingManager(supabase, conversationId, currentUserId)
			: null;
	const messageHandler =
		conversationId && currentUserId
			? createMessageHandler(supabase, conversationId, currentUserId)
			: null;

	// Get user profiles
	const { mainUser, otherUser } = getUserProfiles(conversation, currentUserId);

	// Realtime manager
	let realtimeManager: ReturnType<typeof createRealtimeManager> | null = null;

	// Auto-resize textarea and manage scrollbar visibility
	function handleTextareaInput(event: Event) {
		const textarea = event.target as HTMLTextAreaElement;
		
		// Reset height to auto to get the correct scrollHeight
		textarea.style.height = 'auto';
		
		// Calculate the new height (max 4 lines for simulator)
		const lineHeight = 20; // Approximate line height in pixels
		const maxHeight = lineHeight * 4; // 4 lines max for simulator
		const newHeight = Math.min(textarea.scrollHeight, maxHeight);
		
		textarea.style.height = `${newHeight}px`;
		
		// Call the original input handler
		handleInput();
	}

	// Reset textarea height when message is sent
	$effect(() => {
		if (!newMessage.trim() && textareaElement) {
			textareaElement.style.height = 'auto';
		}
	});

	onMount(() => {
		// Set up realtime subscriptions first
		setupRealtimeSubscriptions();
		setupEventListeners();
	});

	// Reload messages whenever the simulator opens
	$effect(() => {
		if (isOpen) {
			// Load messages with a small delay to ensure database consistency
			setTimeout(() => {
				loadMessages();
			}, 100);
		}
	});

	onDestroy(() => {
		realtimeManager?.cleanup();
		typingManager?.cleanup();
	});

	function setupRealtimeSubscriptions() {
		if (!conversationId) return;

		realtimeManager = createRealtimeManager(
			supabase,
			conversationId,
			handleMessageUpdate,
			() => {
				isOpen = false;
			},
			(isTyping) => typingManager?.setMainUserTyping(isTyping)
		);

		realtimeManager.subscribeToMessages();
		realtimeManager.subscribeToConversationDeletion();
		realtimeManager.subscribeToTyping();
	}

	function handleMessageUpdate(payload: { eventType: string; new: Message; old: Message }) {
		if (payload.eventType === 'INSERT') {
			messages = [...messages, payload.new];
			if (payload.new.image_url) {
				scrollToBottomWithImageLoad(messagesContainer || null);
			} else {
				setTimeout(() => scrollToBottom(), 50);
			}
		} else if (payload.eventType === 'UPDATE') {
			messages = messages.map((m) => (m.id === payload.new.id ? payload.new : m));
		} else if (payload.eventType === 'DELETE') {
			messages = messages.filter((m) => m.id !== payload.old.id);
		}
	}

	function setupEventListeners() {
		const handleSimulatorInteraction = (event: Event) => {
			const target = event.target;
			if (target && target instanceof Element && target.closest('[data-simulator="true"]')) {
				isSimulatorFocused = true;
				if (conversationId && !isProgrammaticScroll) {
					markSimulatorMessagesAsRead();
				}
			}
		};

		document.addEventListener('click', handleSimulatorInteraction);
		document.addEventListener('scroll', handleSimulatorInteraction, true);
		document.addEventListener('keydown', handleSimulatorInteraction);

		return () => {
			document.removeEventListener('click', handleSimulatorInteraction);
			document.removeEventListener('scroll', handleSimulatorInteraction, true);
			document.removeEventListener('keydown', handleSimulatorInteraction);
		};
	}

	async function loadMessages() {
		if (!messageHandler) return;

		messages = await messageHandler.loadMessages();
		setTimeout(scrollToBottom, 100);
	}

	async function markSimulatorMessagesAsRead() {
		if (!messageHandler || !isSimulatorFocused) return;

		const hasUnreadMainUserMessages = messages.some((m) => {
			return !isFromSimulator(m) && !m.read_at;
		});

		if (hasUnreadMainUserMessages) {
			await messageHandler.markMessagesAsRead();
		}
	}

	async function sendMessage(imageUrl?: string) {
		if (!messageHandler || (!newMessage.trim() && !imageUrl)) return;

		const sentMessage = await messageHandler.sendMessage(newMessage, imageUrl);
		if (sentMessage) {
			newMessage = '';
			typingManager?.stopTyping();
		}
	}

	function scrollToBottom() {
		if (messagesContainer) {
			isProgrammaticScroll = true;
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
			setTimeout(() => {
				isProgrammaticScroll = false;
			}, 100);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		} else {
			typingManager?.startTyping();
		}
	}

	function handleInput() {
		typingManager?.startTyping();
	}

	async function handleImageUpload(event: Event) {
		if (!messageHandler) return;

		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const imageUrl = await messageHandler.uploadImage(file);
		if (imageUrl) {
			await sendMessage(imageUrl);
		}

		target.value = '';
	}

	function closePopup() {
		isOpen = false;
	}
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

{#if isOpen}
	<div
		bind:this={simulatorElement}
		class="fixed z-50 flex h-[500px] w-96 flex-col rounded-lg border border-gray-200/30 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md shadow-2xl dark:border-gray-700/30 {dragHandler.isDragging
			? 'cursor-grabbing'
			: ''}"
		style="left: {dragHandler.position.x}px; top: {dragHandler.position.y}px;"
		data-simulator="true"
	>
		<!-- Header -->
		<div
			class="flex cursor-grab items-center justify-between border-b border-gray-200/30 p-4 active:cursor-grabbing dark:border-gray-700/30 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm"
			onmousedown={(e) => simulatorElement && dragHandler.handleMouseDown(e, simulatorElement)}
			role="presentation"
		>
			<h3 class="flex items-center gap-2 text-lg font-semibold select-none text-gray-800 dark:text-gray-200">
				<MessageCircle class="h-5 w-5" />
				Chat Simulator ({otherUser?.profiles?.name || 'Test User'})
			</h3>
			<Button variant="ghost" size="sm" onclick={closePopup} class="hover:bg-white/50 dark:hover:bg-gray-700/50">
				<X class="h-4 w-4" />
			</Button>
		</div>

		<!-- Messages -->
		<div
			bind:this={messagesContainer}
			class="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-4"
		>
			{#each messages as message}
				{@const messageFromSimulator = isFromSimulator(message)}
				<div class="flex {messageFromSimulator ? 'justify-end' : 'justify-start'} gap-2">
					{#if !messageFromSimulator}
						<div class="flex-shrink-0">
							<Avatar
								src={mainUser?.profiles?.avatar_url}
								name={mainUser?.profiles?.name || 'Main User'}
								email={mainUser?.email || 'main@user.com'}
								size="sm"
							/>
						</div>
					{/if}
					<div class="max-w-xs">
						<div
							class="rounded-lg {message.image_url && !message.content
								? ''
								: 'px-4 py-2'} {messageFromSimulator
								? message.image_url && !message.content
									? ''
									: 'bg-blue-500 text-white'
								: message.image_url && !message.content
									? ''
									: 'bg-green-500 text-white'}"
						>
							{#if message.content}
								<div class="prose prose-sm prose-invert max-w-none text-sm">
									{@html renderMarkdown(message.content)}
								</div>
							{/if}
							{#if message.image_url}
								<img
									src={message.image_url}
									alt="Shared img"
									class="{message.content ? 'mt-2' : ''} max-w-full rounded"
									onload={() => scrollToBottom()}
								/>
							{/if}
						</div>
						<div
							class="mt-1 text-xs text-gray-500 dark:text-gray-400 {messageFromSimulator
								? 'text-right'
								: 'text-left'}"
						>
							{formatTime(message.created_at)}
							<span class="ml-1 text-xs">
								{messageFromSimulator
									? `(${otherUser?.profiles?.name || 'Test User'})`
									: `(${mainUser?.profiles?.name || 'Main User'})`}
							</span>
							{#if messageFromSimulator}
								<span
									title={message.read_at ? 'Read' : 'Sent'}
									class="ml-1 select-none {message.read_at ? 'text-green-500' : 'text-gray-400'}"
								>
									{message.read_at ? '✓✓' : '✓'}
								</span>
							{/if}
						</div>
					</div>
					{#if messageFromSimulator}
						<div class="flex-shrink-0">
							<Avatar
								src={otherUser?.profiles?.avatar_url}
								name={otherUser?.profiles?.name || 'Test User'}
								email={otherUser?.email || 'test@simulator.com'}
								size="sm"
								isSimulator={true}
								class="bg-gradient-to-br from-indigo-500 to-blue-600"
							/>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Message Input -->
		<div class="relative border-t border-gray-200/30 px-4 py-4 dark:border-gray-700/30 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md">
			<!-- Typing Indicator -->
			{#if typingManager?.mainUserTyping}
				<div class="absolute -top-6 left-4 mb-2 px-3 py-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
					<div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
						<div class="flex gap-1">
							<div class="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
							<div class="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
							<div class="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
						</div>
						<span class="font-medium">
							{mainUser?.profiles?.name || 'Main user'} is typing...
						</span>
					</div>
				</div>
			{/if}

			<div class="flex gap-3 items-end">
				<input
					type="file"
					accept="image/*"
					bind:this={fileInput}
					onchange={handleImageUpload}
					class="hidden"
				/>
				<Button 
					variant="ghost" 
					size="sm" 
					onclick={() => fileInput?.click()} 
					title="Upload image"
					class="h-[40px] w-[40px] my-auto bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 hover:bg-blue-50/80 dark:hover:bg-blue-900/20 hover:border-blue-200/50 dark:hover:border-blue-400/30 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl group rounded-xl flex items-center justify-center"
				>
					<Image class="h-4 w-4 shrink-0 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
				</Button>
				
				<div class="flex-1 relative">
					<textarea
						bind:this={textareaElement}
						bind:value={newMessage}
						placeholder="Type as {otherUser?.profiles?.name || 'test user'}..."
						class="w-full resize-none rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm px-3 py-2.5 text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 focus:outline-none dark:text-white transition-all duration-200 shadow-lg hover:shadow-xl custom-scrollbar {newMessage.includes('\n') || (textareaElement?.scrollHeight || 0) > 50 ? 'multi-line-textarea' : 'single-line-textarea'}"
						rows="1"
						style="min-height: 40px; max-height: 80px; line-height: 18px;"
						onkeydown={handleKeydown}
						oninput={handleTextareaInput}
					></textarea>
					<!-- Floating label effect -->
					<div class="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none opacity-0 transition-opacity duration-200 {newMessage.trim() ? 'opacity-100' : ''}"></div>
				</div>
				
				<Button 
					onclick={() => sendMessage()} 
					disabled={!newMessage.trim()}
					class="h-[40px] w-[40px] my-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-600 dark:disabled:to-gray-700 text-white shadow-lg hover:shadow-xl disabled:shadow-none hover:scale-105 disabled:scale-100 transition-all duration-200 rounded-xl flex items-center justify-center"
				>
					<Send class="h-4 w-4 shrink-0" />
				</Button>
			</div>

			<!-- Enhanced Info Section - More Subtle -->
			<div class="mt-2 space-y-1">
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
			</div>
		</div>
	</div>
{/if}
