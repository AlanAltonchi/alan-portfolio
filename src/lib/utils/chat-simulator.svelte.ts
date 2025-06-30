import type {
	SupabaseClient,
	RealtimeChannel,
	RealtimePostgresChangesPayload
} from '@supabase/supabase-js';
import type { Message, ConversationWithUsers } from '$lib/types';

export interface SimulatorPosition {
	x: number;
	y: number;
}

export interface DragState {
	isDragging: boolean;
	offset: { x: number; y: number };
}

export interface TypingState {
	isTyping: boolean;
	mainUserTyping: boolean;
	timeout: NodeJS.Timeout | null;
}

/**
 * Handles drag functionality for the chat simulator
 */
export function createDragHandler() {
	const dragState = $state<DragState>({
		isDragging: false,
		offset: { x: 0, y: 0 }
	});

	let position = $state<SimulatorPosition>({ x: 100, y: 100 });

	function handleMouseDown(event: MouseEvent, element: HTMLElement) {
		if (!element) return;

		dragState.isDragging = true;
		const rect = element.getBoundingClientRect();
		dragState.offset = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
		event.preventDefault();
	}

	function handleMouseMove(event: MouseEvent) {
		if (!dragState.isDragging) return;

		const newX = Math.max(0, Math.min(window.innerWidth - 384, event.clientX - dragState.offset.x));
		const newY = Math.max(
			0,
			Math.min(window.innerHeight - 500, event.clientY - dragState.offset.y)
		);

		position = { x: newX, y: newY };
	}

	function handleMouseUp() {
		dragState.isDragging = false;
		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', handleMouseUp);
	}

	return {
		get isDragging() {
			return dragState.isDragging;
		},
		get position() {
			return position;
		},
		handleMouseDown
	};
}

/**
 * Manages typing status for chat simulator
 */
export function createTypingManager(
	supabase: SupabaseClient,
	conversationId: string,
	currentUserId: string
) {
	const typingState = $state<TypingState>({
		isTyping: false,
		mainUserTyping: false,
		timeout: null
	});

	async function startTyping() {
		if (!typingState.isTyping) {
			typingState.isTyping = true;

			await supabase.from('typing_status').upsert(
				{
					conversation_id: conversationId,
					user_id: currentUserId,
					is_typing: true,
					is_simulator: true,
					updated_at: new Date().toISOString()
				},
				{
					onConflict: 'conversation_id,user_id,is_simulator'
				}
			);
		}

		if (typingState.timeout) {
			clearTimeout(typingState.timeout);
		}

		typingState.timeout = setTimeout(stopTyping, 3000);
	}

	async function stopTyping() {
		if (typingState.isTyping) {
			typingState.isTyping = false;

			await supabase
				.from('typing_status')
				.delete()
				.eq('conversation_id', conversationId)
				.eq('user_id', currentUserId)
				.eq('is_simulator', true);
		}

		if (typingState.timeout) {
			clearTimeout(typingState.timeout);
			typingState.timeout = null;
		}
	}

	function setMainUserTyping(isTyping: boolean) {
		typingState.mainUserTyping = isTyping;
	}

	function cleanup() {
		if (typingState.isTyping) {
			stopTyping();
		}
	}

	return {
		get isTyping() {
			return typingState.isTyping;
		},
		get mainUserTyping() {
			return typingState.mainUserTyping;
		},
		startTyping,
		stopTyping,
		setMainUserTyping,
		cleanup
	};
}

/**
 * Manages realtime subscriptions for chat simulator
 */
export function createRealtimeManager(
	supabase: SupabaseClient,
	conversationId: string,
	onMessageUpdate: (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => void,
	onConversationDeleted: () => void,
	onTypingUpdate: (isTyping: boolean) => void
) {
	let channels: RealtimeChannel[] = [];

	function subscribeToMessages() {
		const channel = supabase
			.channel(`simulator_messages:${conversationId}`)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'messages',
					filter: `conversation_id=eq.${conversationId}`
				},
				onMessageUpdate
			)
			.subscribe();

		channels.push(channel);
		return channel;
	}

	function subscribeToConversationDeletion() {
		const channel = supabase
			.channel(`conversation:${conversationId}`)
			.on(
				'postgres_changes',
				{
					event: 'DELETE',
					schema: 'public',
					table: 'conversations',
					filter: `id=eq.${conversationId}`
				},
				onConversationDeleted
			)
			.subscribe();

		channels.push(channel);
		return channel;
	}

	function subscribeToTyping() {
		const channel = supabase
			.channel(`simulator_typing:${conversationId}`)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'typing_status',
					filter: `conversation_id=eq.${conversationId}`
				},
				(payload) => {
					if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
						const typingData = payload.new;
						onTypingUpdate(!typingData.is_simulator && typingData.is_typing);
					} else if (payload.eventType === 'DELETE') {
						onTypingUpdate(false);
					}
				}
			)
			.subscribe();

		channels.push(channel);
		return channel;
	}

	function cleanup() {
		channels.forEach((channel) => supabase.removeChannel(channel));
		channels = [];
	}

	return {
		subscribeToMessages,
		subscribeToConversationDeletion,
		subscribeToTyping,
		cleanup
	};
}

/**
 * Handles message operations for chat simulator
 */
export function createMessageHandler(
	supabase: SupabaseClient,
	conversationId: string,
	currentUserId: string
) {
	async function sendMessage(content: string, imageUrl?: string) {
		if ((!content.trim() && !imageUrl) || !conversationId) return null;

		const messageData = {
			conversation_id: conversationId,
			sender_id: currentUserId,
			receiver_id: currentUserId,
			content: content.trim() || '',
			metadata: { from_simulator: true },
			read_at: null,
			image_url: imageUrl || null
		};

		const { data, error } = await supabase.from('messages').insert(messageData).select().single();

		if (error) {
			console.error('Error sending message:', error);
			return null;
		}

		// Update conversation timestamp
		await supabase
			.from('conversations')
			.update({ updated_at: new Date().toISOString() })
			.eq('id', conversationId);

		return data as Message;
	}

	async function markMessagesAsRead() {
		const { error } = await supabase
			.from('messages')
			.update({ read_at: new Date().toISOString() })
			.eq('conversation_id', conversationId)
			.not('metadata->from_simulator', 'eq', true)
			.is('read_at', null);

		if (error) {
			console.error('Error marking messages as read:', error);
		}
	}

	async function loadMessages(): Promise<Message[]> {
		const { data: messagesData, error } = await supabase
			.from('messages')
			.select('*')
			.eq('conversation_id', conversationId)
			.order('created_at', { ascending: true });

		if (error) {
			console.error('Error loading messages:', error);
			return [];
		}

		return messagesData || [];
	}

	async function uploadImage(file: File): Promise<string | null> {
		try {
			const fileExt = file.name.split('.').pop();
			const fileName = `${Math.random()}.${fileExt}`;
			const filePath = `chat-images/${fileName}`;

			const { error: uploadError } = await supabase.storage
				.from('chat-images')
				.upload(filePath, file);

			if (uploadError) {
				console.error('Error uploading image:', uploadError);
				return null;
			}

			const {
				data: { publicUrl }
			} = supabase.storage.from('chat-images').getPublicUrl(filePath);

			return publicUrl;
		} catch (error) {
			console.error('Error handling image upload:', error);
			return null;
		}
	}

	return {
		sendMessage,
		markMessagesAsRead,
		loadMessages,
		uploadImage
	};
}

/**
 * Gets user profiles from conversation data
 */
export function getUserProfiles(conversation: ConversationWithUsers | null, currentUserId: string) {
	if (!conversation) return { mainUser: null, otherUser: null };

	function getMainUser() {
		if (!conversation) return null;

		if (conversation.user_a === conversation.user_b) {
			return conversation.user_a_profile;
		}

		return conversation.user_a === currentUserId
			? conversation.user_a_profile
			: conversation.user_b_profile;
	}

	function getOtherUser() {
		if (!conversation) return null;

		if (conversation.user_a === conversation.user_b) {
			return {
				id: 'test-user',
				email: 'test@simulator.com',
				profiles: {
					name: 'Test User',
					avatar_url: null
				}
			};
		}

		return conversation.user_a === currentUserId
			? conversation.user_b_profile
			: conversation.user_a_profile;
	}

	return {
		mainUser: getMainUser(),
		otherUser: getOtherUser()
	};
}

export function isFromSimulator(message: Message): boolean {
	const metadata = message.metadata as { from_simulator?: boolean } | null;
	return metadata?.from_simulator === true;
}
