import type { ConversationWithUsers } from '$lib/types';

export interface ReadReceiptHandlers {
	markMessagesAsRead: () => Promise<void>;
}

export function createWindowFocusHandlers(
	handlers: ReadReceiptHandlers,
	getSelectedConversation: () => ConversationWithUsers | null,
	setWindowFocused: (focused: boolean) => void
) {
	const handleFocus = () => {
		setWindowFocused(true);
		const conversation = getSelectedConversation();
		if (conversation) {
			handlers.markMessagesAsRead();
		}
	};

	const handleBlur = () => {
		setWindowFocused(false);
	};

	return { handleFocus, handleBlur };
}

export function createInteractionHandlers(
	handlers: ReadReceiptHandlers,
	getSelectedConversation: () => ConversationWithUsers | null,
	isWindowFocused: () => boolean
) {
	const shouldMarkAsRead = (target: EventTarget | null): boolean => {
		if (!target || !(target instanceof Element)) return false;

		// Don't mark as read if interaction is within the simulator
		if (target.closest('[data-simulator="true"]')) return false;

		// Only mark as read if interaction is within the main chat area
		const chatPanel = target.closest('.chat-panel');
		const conversation = getSelectedConversation();

		return !!(conversation && isWindowFocused() && chatPanel);
	};

	const handleClick = (event: Event) => {
		if (shouldMarkAsRead(event.target)) {
			handlers.markMessagesAsRead();
		}
	};

	const handleScroll = (event: Event) => {
		if (shouldMarkAsRead(event.target)) {
			handlers.markMessagesAsRead();
		}
	};

	const handleKeydown = (event: Event) => {
		if (shouldMarkAsRead(event.target)) {
			handlers.markMessagesAsRead();
		}
	};

	return { handleClick, handleScroll, handleKeydown };
}

export function setupEventListeners(
	windowHandlers: ReturnType<typeof createWindowFocusHandlers>,
	interactionHandlers: ReturnType<typeof createInteractionHandlers>
) {
	window.addEventListener('focus', windowHandlers.handleFocus);
	window.addEventListener('blur', windowHandlers.handleBlur);
	document.addEventListener('click', interactionHandlers.handleClick);
	document.addEventListener('scroll', interactionHandlers.handleScroll, true);
	document.addEventListener('keydown', interactionHandlers.handleKeydown);

	return () => {
		window.removeEventListener('focus', windowHandlers.handleFocus);
		window.removeEventListener('blur', windowHandlers.handleBlur);
		document.removeEventListener('click', interactionHandlers.handleClick);
		document.removeEventListener('scroll', interactionHandlers.handleScroll, true);
		document.removeEventListener('keydown', interactionHandlers.handleKeydown);
	};
}

export interface TypingHandlers {
	startTyping: () => void;
	stopTyping: () => void;
	sendMessage: () => void;
}

export function createMessageInputHandlers(handlers: TypingHandlers) {
	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handlers.sendMessage();
		} else if (event.key === 'Enter' && event.shiftKey) {
			// Allow default behavior for new line
			handlers.startTyping();
		} else {
			handlers.startTyping();
		}
	};

	const handleInput = (event: Event) => {
		handlers.startTyping();

		// Auto-resize textarea
		const target = event.target as HTMLTextAreaElement;
		if (target) {
			target.style.height = 'auto';
			target.style.height = Math.min(target.scrollHeight, 120) + 'px';
		}
	};

	return { handleKeydown, handleInput };
}
