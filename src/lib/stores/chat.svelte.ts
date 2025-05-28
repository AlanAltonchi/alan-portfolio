import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { ConversationWithUsers, Message } from '$lib/types';
import { 
	ConversationService, 
	MessageService, 
	TypingService, 
	ImageUploadService 
} from '$lib/services/chat';
import { scrollToBottom, scrollToBottomWithImageLoad } from '$lib/utils/chat';

interface ChatState {
	conversations: ConversationWithUsers[];
	selectedConversation: ConversationWithUsers | null;
	messages: Message[];
	newMessage: string;
	isTyping: boolean;
	otherUserTyping: boolean;
	isWindowFocused: boolean;
	isProgrammaticScroll: boolean;
	showSimulator: boolean;
}

class ChatStore {
	private state = $state<ChatState>({
		conversations: [],
		selectedConversation: null,
		messages: [],
		newMessage: '',
		isTyping: false,
		otherUserTyping: false,
		isWindowFocused: true,
		isProgrammaticScroll: false,
		showSimulator: false
	});

	private supabase: SupabaseClient | null = null;
	private currentUserId: string | null = null;
	private messagesContainer: HTMLElement | null = null;
	private typingTimeout: NodeJS.Timeout | null = null;

	// Realtime channels
	private realtimeChannel: RealtimeChannel | null = null;
	private conversationChannel: RealtimeChannel | null = null;
	private typingChannel: RealtimeChannel | null = null;

	// Services
	private conversationService: ConversationService | null = null;
	private messageService: MessageService | null = null;
	private typingService: TypingService | null = null;
	private imageUploadService: ImageUploadService | null = null;

	// Getters
	get conversations() { return this.state.conversations; }
	get selectedConversation() { return this.state.selectedConversation; }
	get messages() { return this.state.messages; }
	get newMessage() { return this.state.newMessage; }
	get isTyping() { return this.state.isTyping; }
	get otherUserTyping() { return this.state.otherUserTyping; }
	get isWindowFocused() { return this.state.isWindowFocused; }
	get isProgrammaticScroll() { return this.state.isProgrammaticScroll; }
	get showSimulator() { return this.state.showSimulator; }

	// Setters
	setConversations(conversations: ConversationWithUsers[]) {
		this.state.conversations = conversations;
	}

	setNewMessage(message: string) {
		this.state.newMessage = message;
	}

	// Add setter for newMessage to enable two-way binding
	set newMessage(value: string) {
		this.state.newMessage = value;
	}

	// Add setter for showSimulator to enable two-way binding
	set showSimulator(value: boolean) {
		this.state.showSimulator = value;
	}

	setWindowFocused(focused: boolean) {
		this.state.isWindowFocused = focused;
	}

	setShowSimulator(show: boolean) {
		this.state.showSimulator = show;
	}

	setMessagesContainer(container: HTMLElement | null) {
		this.messagesContainer = container;
	}

	// Initialize the store
	initialize(supabase: SupabaseClient, currentUserId: string) {
		this.supabase = supabase;
		this.currentUserId = currentUserId;
		
		// Initialize services
		this.conversationService = new ConversationService(supabase);
		this.messageService = new MessageService(supabase);
		this.typingService = new TypingService(supabase);
		this.imageUploadService = new ImageUploadService(supabase);
	}

	// Conversation management
	async selectConversation(conversation: ConversationWithUsers) {
		this.state.selectedConversation = conversation;
		this.subscribeToMessages(conversation);
		this.subscribeToTyping(conversation);
		await this.loadMessages();
	}

	async createConversation(userId: string): Promise<boolean> {
		if (!this.conversationService || !this.currentUserId) return false;

		const newConversation = await this.conversationService.create(
			this.currentUserId, 
			userId
		);

		if (newConversation) {
			this.state.conversations = [newConversation, ...this.state.conversations];
			await this.selectConversation(newConversation);
			return true;
		}

		return false;
	}

	async createSelfConversation(): Promise<boolean> {
		if (!this.currentUserId) return false;
		return this.createConversation(this.currentUserId);
	}

	async deleteConversation(): Promise<boolean> {
		if (!this.conversationService || !this.state.selectedConversation) return false;

		const success = await this.conversationService.delete(
			this.state.selectedConversation.id
		);

		if (success) {
			const conversationId = this.state.selectedConversation.id;
			this.state.conversations = this.state.conversations.filter(
				c => c.id !== conversationId
			);
			this.state.selectedConversation = null;
			this.state.messages = [];
			this.state.showSimulator = false;
		}

		return success;
	}

	// Message management
	async loadMessages() {
		if (!this.messageService || !this.state.selectedConversation) return;

		const messages = await this.messageService.loadMessages(
			this.state.selectedConversation.id
		);
		
		this.state.messages = messages;
		setTimeout(() => this.scrollToBottom(), 100);
	}

	async sendMessage(imageUrl?: string): Promise<boolean> {
		if (!this.messageService || !this.state.selectedConversation || !this.currentUserId) {
			return false;
		}

		if (!this.state.newMessage.trim() && !imageUrl) return false;

		const otherUserId = this.getOtherUserId();
		if (!otherUserId) return false;

		const success = await this.messageService.send(
			this.state.selectedConversation.id,
			this.currentUserId,
			otherUserId,
			this.state.newMessage,
			imageUrl
		);

		if (success) {
			this.state.newMessage = '';
			this.stopTyping();
			
			// Update conversation timestamp
			if (this.conversationService) {
				await this.conversationService.updateTimestamp(
					this.state.selectedConversation.id
				);
			}
		}

		return success;
	}

	async markMessagesAsRead() {
		if (!this.messageService || !this.state.selectedConversation || 
			!this.state.isWindowFocused || !this.currentUserId) return;

		const isSelfConversation = this.state.selectedConversation.user_a === 
			this.state.selectedConversation.user_b;

		// Check if there are any unread messages first
		let hasUnreadMessages = false;
		if (isSelfConversation) {
			hasUnreadMessages = this.state.messages.some((m) => {
				const metadata = m.metadata as { from_simulator?: boolean } | null;
				return metadata?.from_simulator === true && !m.read_at;
			});
		} else {
			hasUnreadMessages = this.state.messages.some(
				m => m.sender_id !== this.currentUserId && !m.read_at
			);
		}

		if (hasUnreadMessages) {
			await this.messageService.markAsRead(
				this.state.selectedConversation.id,
				this.currentUserId,
				isSelfConversation
			);
		}
	}

	// Image upload
	async uploadImage(file: File): Promise<string | null> {
		if (!this.imageUploadService) return null;
		return this.imageUploadService.upload(file);
	}

	// Typing management
	async startTyping() {
		if (!this.typingService || !this.state.selectedConversation || 
			!this.currentUserId) return;

		if (!this.state.isTyping) {
			this.state.isTyping = true;
			await this.typingService.start(
				this.state.selectedConversation.id,
				this.currentUserId
			);
		}

		// Clear existing timeout
		if (this.typingTimeout) {
			clearTimeout(this.typingTimeout);
		}

		// Set new timeout to stop typing
		this.typingTimeout = setTimeout(() => this.stopTyping(), 3000);
	}

	async stopTyping() {
		if (!this.typingService || !this.state.selectedConversation || 
			!this.currentUserId) return;

		if (this.state.isTyping) {
			this.state.isTyping = false;
			await this.typingService.stop(
				this.state.selectedConversation.id,
				this.currentUserId
			);
		}

		if (this.typingTimeout) {
			clearTimeout(this.typingTimeout);
			this.typingTimeout = null;
		}
	}

	// Scroll utilities
	scrollToBottom() {
		if (this.messagesContainer) {
			this.state.isProgrammaticScroll = true;
			scrollToBottom(this.messagesContainer, () => {
				this.state.isProgrammaticScroll = false;
			});
		}
	}

	scrollToBottomWithImageLoad() {
		if (this.messagesContainer) {
			this.state.isProgrammaticScroll = true;
			scrollToBottomWithImageLoad(this.messagesContainer, () => {
				this.state.isProgrammaticScroll = false;
			});
		}
	}

	// Realtime subscriptions
	private subscribeToMessages(conversation: ConversationWithUsers) {
		if (!this.supabase) return;

		if (this.realtimeChannel) {
			this.supabase.removeChannel(this.realtimeChannel);
		}

		this.realtimeChannel = this.supabase
			.channel(`messages:${conversation.id}`)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'messages',
					filter: `conversation_id=eq.${conversation.id}`
				},
				(payload: any) => {
					this.handleMessageUpdate(payload);
				}
			)
			.subscribe();
	}

	private subscribeToTyping(conversation: ConversationWithUsers) {
		if (!this.supabase) return;

		if (this.typingChannel) {
			this.supabase.removeChannel(this.typingChannel);
		}

		this.typingChannel = this.supabase
			.channel(`typing:${conversation.id}`)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'typing_status',
					filter: `conversation_id=eq.${conversation.id}`
				},
				(payload: any) => {
					this.handleTypingUpdate(payload, conversation);
				}
			)
			.subscribe();
	}

	private handleMessageUpdate(payload: any) {
		if (payload.eventType === 'INSERT') {
			if (!this.state.messages.some((m) => m.id === payload.new.id)) {
				this.state.messages = [...this.state.messages, payload.new as Message];
				
				if (payload.new.image_url) {
					this.scrollToBottomWithImageLoad();
				} else {
					setTimeout(() => this.scrollToBottom(), 50);
				}
			}
		} else if (payload.eventType === 'UPDATE') {
			this.state.messages = this.state.messages.map((m) => 
				m.id === payload.new.id ? payload.new as Message : m
			);
		} else if (payload.eventType === 'DELETE') {
			this.state.messages = this.state.messages.filter(
				(m) => m.id !== payload.old.id
			);
		}
	}

	private handleTypingUpdate(payload: any, conversation: ConversationWithUsers) {
		if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
			const typingData = payload.new;
			const isSelfConversation = conversation.user_a === conversation.user_b;

			if (isSelfConversation) {
				this.state.otherUserTyping = typingData.is_simulator && typingData.is_typing;
			} else {
				this.state.otherUserTyping = typingData.user_id !== this.currentUserId && 
					typingData.is_typing;
			}
		} else if (payload.eventType === 'DELETE') {
			this.state.otherUserTyping = false;
		}
	}

	// Helper methods
	private getOtherUserId(): string | null {
		if (!this.state.selectedConversation || !this.currentUserId) return null;

		// For self-conversations, both sender and receiver are the same user
		if (this.state.selectedConversation.user_a === this.state.selectedConversation.user_b) {
			return this.currentUserId;
		}

		return this.state.selectedConversation.user_a === this.currentUserId
			? this.state.selectedConversation.user_b
			: this.state.selectedConversation.user_a;
	}

	// Cleanup
	destroy() {
		if (this.supabase) {
			if (this.realtimeChannel) {
				this.supabase.removeChannel(this.realtimeChannel);
			}
			if (this.conversationChannel) {
				this.supabase.removeChannel(this.conversationChannel);
			}
			if (this.typingChannel) {
				this.supabase.removeChannel(this.typingChannel);
			}
		}

		if (this.typingTimeout) {
			clearTimeout(this.typingTimeout);
		}
	}
}

export const chatStore = new ChatStore(); 