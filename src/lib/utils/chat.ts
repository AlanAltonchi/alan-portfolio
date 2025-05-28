import { marked } from 'marked';
import type { ConversationWithUsers } from '$lib/types';
import { profileStore } from '$lib/stores/profile.svelte.js';

/**
 * Formats a timestamp to a readable time string
 */
export function formatTime(timestamp: string | null): string {
	if (!timestamp) return '';
	return new Date(timestamp).toLocaleTimeString([], { 
		hour: '2-digit', 
		minute: '2-digit' 
	});
}

/**
 * Renders markdown content to HTML
 */
export function renderMarkdown(content: string): string {
	try {
		const result = marked.parse(content, { breaks: true });
		return typeof result === 'string' ? result : String(result);
	} catch (error) {
		console.error('Error rendering markdown:', error);
		return content; // Fallback to original content
	}
}

/**
 * Gets the other user in a conversation relative to the current user
 */
export function getOtherUser(
	conversation: ConversationWithUsers, 
	currentUserId: string
) {
	// For self-conversations, return the same user profile
	if (conversation.user_a === conversation.user_b) {
		return {
			id: currentUserId,
			email: 'Self Chat',
			profiles: { 
				name: 'You', 
				avatar_url: profileStore.currentProfile?.avatar_url 
			}
		};
	}

	return conversation.user_a === currentUserId
		? conversation.user_b_profile
		: conversation.user_a_profile;
}

/**
 * Scrolls a container to the bottom
 */
export function scrollToBottom(
	container: HTMLElement | null,
	onComplete?: () => void
): void {
	if (!container) return;
	
	container.scrollTop = container.scrollHeight;
	
	if (onComplete) {
		setTimeout(onComplete, 100);
	}
}

/**
 * Scrolls to bottom with multiple attempts for image loading
 */
export function scrollToBottomWithImageLoad(
	container: HTMLElement | null,
	onComplete?: () => void
): void {
	if (!container) return;

	// First attempt immediate scroll
	scrollToBottom(container);

	// Wait for potential images to load and scroll again
	setTimeout(() => {
		scrollToBottom(container);
	}, 200);

	// Final attempt after a longer delay
	setTimeout(() => {
		scrollToBottom(container, onComplete);
	}, 500);
} 