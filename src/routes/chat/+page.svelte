<script lang="ts">
	import {
		ConversationSidebar,
		ChatHeader,
		MessageList,
		MessageInput,
		ChatSimulator
	} from '$lib/components';
	import { supabase } from '$lib/db.svelte';
	import { chatStore } from '$lib/stores/chat.svelte';
	import {
		createWindowFocusHandlers,
		createInteractionHandlers,
		setupEventListeners
	} from '$lib/handlers/chat';
	import { MessageCircle } from 'lucide-svelte';
	import { onMount, onDestroy } from 'svelte';

	let { data } = $props();
	let messagesContainer = $state<HTMLDivElement>();

	// Initialize chat store
	onMount(() => {
		if (data.currentUserId) {
			chatStore.initialize(supabase, data.currentUserId);
			chatStore.setConversations(data.conversations);
		}
	});

	// Set messagesContainer whenever it changes
	$effect(() => {
		if (messagesContainer) {
			chatStore.setMessagesContainer(messagesContainer);
		}
	});

	// Scroll to bottom when messages load or change
	$effect(() => {
		if (chatStore.messages.length > 0 && messagesContainer) {
			setTimeout(() => {
				chatStore.scrollToBottom();
			}, 50);
		}
	});

	// Set up event handlers for read receipts
	onMount(() => {
		const windowHandlers = createWindowFocusHandlers(
			{ markMessagesAsRead: () => chatStore.markMessagesAsRead() },
			() => chatStore.selectedConversation,
			(focused) => chatStore.setWindowFocused(focused)
		);

		const interactionHandlers = createInteractionHandlers(
			{ markMessagesAsRead: () => chatStore.markMessagesAsRead() },
			() => chatStore.selectedConversation,
			() => chatStore.isWindowFocused
		);

		const cleanup = setupEventListeners(windowHandlers, interactionHandlers);
		return cleanup;
	});

	// Cleanup on destroy
	onDestroy(() => {
		chatStore.destroy();
	});

	// Event handlers
	async function handleSelectConversation(conversation: any) {
		await chatStore.selectConversation(conversation);
	}

	async function handleCreateSelfConversation() {
		await chatStore.createSelfConversation();
	}

	async function handleSendMessage() {
		await chatStore.sendMessage();
	}

	async function handleImageUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const imageUrl = await chatStore.uploadImage(file);
		if (imageUrl) {
			await chatStore.sendMessage(imageUrl);
		}

		// Reset file input
		target.value = '';
	}

	async function handleDeleteConversation() {
		await chatStore.deleteConversation();
	}

	function handleShowSimulator() {
		chatStore.setShowSimulator(true);
	}

	function handleStartTyping() {
		chatStore.startTyping();
	}

	function handleStopTyping() {
		chatStore.stopTyping();
	}

	function handleImageLoad() {
		chatStore.scrollToBottom();
	}
</script>

<div
	class="flex h-[calc(100vh-8rem)] overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-900"
>
	<!-- Sidebar -->
	<ConversationSidebar
		conversations={chatStore.conversations}
		selectedConversation={chatStore.selectedConversation}
		currentUserId={data.currentUserId || ''}
		onSelectConversation={handleSelectConversation}
		onCreateSelfConversation={handleCreateSelfConversation}
	/>

	<!-- Chat Panel -->
	<div class="chat-panel flex flex-1 flex-col">
		{#if chatStore.selectedConversation}
			<!-- Chat Header -->
			<ChatHeader
				conversation={chatStore.selectedConversation}
				currentUserId={data.currentUserId || ''}
				onShowSimulator={handleShowSimulator}
				onDeleteConversation={handleDeleteConversation}
			/>

			<!-- Messages -->
			<MessageList
				messages={chatStore.messages}
				conversation={chatStore.selectedConversation}
				currentUserId={data.currentUserId || ''}
				onImageLoad={handleImageLoad}
				bind:messagesContainer
			/>

			<!-- Message Input -->
			<MessageInput
				bind:newMessage={chatStore.newMessage}
				conversation={chatStore.selectedConversation}
				otherUserTyping={chatStore.otherUserTyping}
				onSendMessage={handleSendMessage}
				onImageUpload={handleImageUpload}
				onStartTyping={handleStartTyping}
				onStopTyping={handleStopTyping}
			/>
		{:else}
			<!-- No conversation selected -->
			<div class="flex flex-1 items-center justify-center">
				<div class="text-center">
					<MessageCircle class="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
					<h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
						Select a conversation
					</h3>
					<p class="text-gray-500 dark:text-gray-400">
						Choose a conversation from the sidebar or start a new chat
					</p>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Chat Simulator -->
{#if chatStore.selectedConversation}
	<ChatSimulator
		bind:isOpen={chatStore.showSimulator}
		conversationId={chatStore.selectedConversation.id}
		currentUserId={data.currentUserId || ''}
		conversation={chatStore.selectedConversation}
		{supabase}
	/>
{/if}
