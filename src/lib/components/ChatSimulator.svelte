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

	let { isOpen = $bindable(false), conversationId, currentUserId, supabase, conversation } = $props();

	let messages = $state<Message[]>([]);
	let newMessage = $state('');
	let messagesContainer = $state<HTMLDivElement>();
	let simulatorElement = $state<HTMLDivElement>();
	let isSimulatorFocused = $state(true);
	let isProgrammaticScroll = $state(false);
	let fileInput = $state<HTMLInputElement>();

	// Initialize handlers
	const dragHandler = createDragHandler();
	const typingManager = conversationId && currentUserId ? 
		createTypingManager(supabase, conversationId, currentUserId) : null;
	const messageHandler = conversationId && currentUserId ? 
		createMessageHandler(supabase, conversationId, currentUserId) : null;

	// Get user profiles
	const { mainUser, otherUser } = getUserProfiles(conversation, currentUserId);

	// Realtime manager
	let realtimeManager: ReturnType<typeof createRealtimeManager> | null = null;

	onMount(() => {
		loadMessages();
		setupRealtimeSubscriptions();
		setupEventListeners();
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
			() => { isOpen = false; },
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

{#if isOpen}
	<div
		bind:this={simulatorElement}
		class="fixed z-50 flex h-[500px] w-96 flex-col rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900 {dragHandler.isDragging
			? 'cursor-grabbing'
			: ''}"
		style="left: {dragHandler.position.x}px; top: {dragHandler.position.y}px;"
		data-simulator="true"
	>
		<!-- Header -->
		<div
			class="flex cursor-grab items-center justify-between border-b border-gray-200 p-4 active:cursor-grabbing dark:border-gray-700"
			onmousedown={(e) => simulatorElement && dragHandler.handleMouseDown(e, simulatorElement)}
			role="presentation"
		>
			<h3 class="flex items-center gap-2 text-lg font-semibold select-none">
				<MessageCircle class="h-5 w-5" />
				Chat Simulator ({otherUser?.profiles?.name || 'Test User'})
			</h3>
			<Button variant="ghost" size="sm" onclick={closePopup}>
				<X class="h-4 w-4" />
			</Button>
		</div>

		<!-- Messages -->
		<div bind:this={messagesContainer} class="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100 dark:scrollbar-thumb-blue-700 dark:scrollbar-track-gray-800">
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
							class="rounded-lg {message.image_url && !message.content ? '' : 'px-4 py-2'} {messageFromSimulator
								? message.image_url && !message.content ? '' : 'bg-blue-500 text-white'
								: message.image_url && !message.content ? '' : 'bg-green-500 text-white'}"
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
		<div class="relative border-t border-gray-200 px-4 py-6 dark:border-gray-700">
			<!-- Typing Indicator -->
			{#if typingManager?.mainUserTyping}
				<div class="absolute top-1 left-6 mb-2 text-xs text-gray-500 dark:text-gray-400">
					{mainUser?.profiles?.name || 'Main user'} is typing...
				</div>
			{/if}

			<div class="flex gap-2">
				<input
					type="file"
					accept="image/*"
					bind:this={fileInput}
					onchange={handleImageUpload}
					class="hidden"
				/>
				<Button variant="ghost" size="sm" onclick={() => fileInput?.click()} title="Upload image">
					<Image class="h-4 w-4" />
				</Button>
				<Input
					bind:value={newMessage}
					placeholder="Type as {otherUser?.profiles?.name || 'test user'}..."
					class="flex-1"
					onkeydown={handleKeydown}
					oninput={handleInput}
				/>
				<Button onclick={() => sendMessage()} disabled={!newMessage.trim()}>
					<Send class="h-4 w-4" />
				</Button>
			</div>
		</div>
	</div>
{/if}
