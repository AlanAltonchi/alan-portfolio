import type { SupabaseClient } from '@supabase/supabase-js';
import type { ConversationWithUsers, Message } from '$lib/types';

export class ConversationService {
	constructor(private supabase: SupabaseClient) {}

	async create(userA: string, userB: string): Promise<ConversationWithUsers | null> {
		const conversationData = {
			user_a: userA,
			user_b: userB
		};

		const { data, error } = await this.supabase
			.from('conversations')
			.insert(conversationData)
			.select(
				`
				id,
				user_a,
				user_b,
				created_at,
				updated_at,
				user_a_profile:users!conversations_user_a_fkey(id, email, profiles(name, avatar_url)),
				user_b_profile:users!conversations_user_b_fkey(id, email, profiles(name, avatar_url))
			`
			)
			.single();

		if (error) {
			console.error('Error creating conversation:', error);
			return null;
		}

		return data as unknown as ConversationWithUsers;
	}

	async delete(conversationId: string): Promise<boolean> {
		// First, get all messages with images to clean up storage
		const { data: messagesWithImages } = await this.supabase
			.from('messages')
			.select('image_url')
			.eq('conversation_id', conversationId)
			.not('image_url', 'is', null);

		// Delete images from storage
		if (messagesWithImages && messagesWithImages.length > 0) {
			await this.cleanupImages(messagesWithImages);
		}

		// Delete the conversation
		const { error } = await this.supabase.from('conversations').delete().eq('id', conversationId);

		if (error) {
			console.error('Error deleting conversation:', error);
			return false;
		}

		return true;
	}

	async updateTimestamp(conversationId: string): Promise<void> {
		await this.supabase
			.from('conversations')
			.update({ updated_at: new Date().toISOString() })
			.eq('id', conversationId);
	}

	private async cleanupImages(messagesWithImages: Array<{ image_url: string | null }>): Promise<void> {
		const imagePaths = messagesWithImages
			.map((msg: { image_url: string | null }) => msg.image_url)
			.filter((url: string | null): url is string => url !== null && url.includes('chat-images/'))
			.map((url: string) => {
				if (url.includes('chat-images/')) {
					const parts = url.split('chat-images/');
					const filename = parts[parts.length - 1];
					return `chat-images/${filename}`;
				}
				return null;
			})
			.filter((path: string | null): path is string => path !== null);

		if (imagePaths.length > 0) {
			const { error } = await this.supabase.storage.from('chat-images').remove(imagePaths);

			if (error) {
				console.error('Error deleting images:', error);
			}
		}
	}
}

export class MessageService {
	constructor(private supabase: SupabaseClient) {}

	async loadMessages(conversationId: string): Promise<Message[]> {
		const { data, error } = await this.supabase
			.from('messages')
			.select('*')
			.eq('conversation_id', conversationId)
			.order('created_at', { ascending: true });

		if (error) {
			console.error('Error loading messages:', error);
			return [];
		}

		return data || [];
	}

	async send(
		conversationId: string,
		senderId: string,
		receiverId: string,
		content: string,
		imageUrl?: string
	): Promise<Message | null> {
		const messageData = {
			conversation_id: conversationId,
			sender_id: senderId,
			receiver_id: receiverId,
			content: content.trim() || '',
			metadata: { from_simulator: false },
			read_at: null,
			image_url: imageUrl || null
		};

		const { data, error } = await this.supabase
			.from('messages')
			.insert(messageData)
			.select()
			.single();

		if (error) {
			console.error('Error sending message:', error);
			return null;
		}

		return data as Message;
	}

	async markAsRead(
		conversationId: string,
		currentUserId: string,
		isSelfConversation: boolean
	): Promise<void> {
		if (isSelfConversation) {
			// In self-conversation, only mark simulator messages as read
			const { error } = await this.supabase
				.from('messages')
				.update({ read_at: new Date().toISOString() })
				.eq('conversation_id', conversationId)
				.eq('metadata->from_simulator', true)
				.is('read_at', null);

			if (error) {
				console.error('Error marking simulator messages as read:', error);
			}
		} else {
			// In regular conversation, mark messages from other users as read
			const { error } = await this.supabase
				.from('messages')
				.update({ read_at: new Date().toISOString() })
				.eq('conversation_id', conversationId)
				.neq('sender_id', currentUserId)
				.is('read_at', null);

			if (error) {
				console.error('Error marking messages as read:', error);
			}
		}
	}
}

export class TypingService {
	constructor(private supabase: SupabaseClient) {}

	async start(conversationId: string, userId: string, isSimulator: boolean = false): Promise<void> {
		await this.supabase.from('typing_status').upsert(
			{
				conversation_id: conversationId,
				user_id: userId,
				is_typing: true,
				is_simulator: isSimulator,
				updated_at: new Date().toISOString()
			},
			{
				onConflict: 'conversation_id,user_id,is_simulator'
			}
		);
	}

	async stop(conversationId: string, userId: string, isSimulator: boolean = false): Promise<void> {
		await this.supabase
			.from('typing_status')
			.delete()
			.eq('conversation_id', conversationId)
			.eq('user_id', userId)
			.eq('is_simulator', isSimulator);
	}
}

export class ImageUploadService {
	constructor(private supabase: SupabaseClient) {}

	async upload(file: File): Promise<string | null> {
		try {
			const fileExt = file.name.split('.').pop();
			const fileName = `${Math.random()}.${fileExt}`;
			const filePath = `chat-images/${fileName}`;

			const { error: uploadError } = await this.supabase.storage
				.from('chat-images')
				.upload(filePath, file);

			if (uploadError) {
				console.error('Error uploading image:', uploadError);
				return null;
			}

			const {
				data: { publicUrl }
			} = this.supabase.storage.from('chat-images').getPublicUrl(filePath);

			return publicUrl;
		} catch (error) {
			console.error('Error handling image upload:', error);
			return null;
		}
	}
}
