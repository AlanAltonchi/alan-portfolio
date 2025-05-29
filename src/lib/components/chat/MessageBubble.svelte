<script lang="ts">
	import { Avatar } from '$lib/components';
	import { formatTime, renderMarkdown } from '$lib/utils/chat';
	import type { Message, ConversationWithUsers } from '$lib/types';

	let { message, conversation, currentUserId, onImageLoad } = $props<{
		message: Message;
		conversation: ConversationWithUsers;
		currentUserId: string;
		onImageLoad?: () => void;
	}>();

	const metadata = $derived(message.metadata as { from_simulator?: boolean } | null);
	const isFromSimulator = $derived(metadata?.from_simulator === true);
	const isFromCurrentUser = $derived(message.sender_id === currentUserId && !isFromSimulator);

	const otherUser = $derived(
		isFromCurrentUser || isFromSimulator
			? null
			: conversation.user_a === currentUserId
				? conversation.user_b_profile
				: conversation.user_a_profile
	);

	const currentUserProfile = $derived(
		conversation.user_a === currentUserId
			? conversation.user_a_profile
			: conversation.user_b_profile
	);

	async function getRenderedContent() {
		if (!message.content) return '';
		return await renderMarkdown(message.content);
	}
</script>

<div class="flex {isFromCurrentUser ? 'justify-end' : 'justify-start'} gap-2">
	{#if !isFromCurrentUser}
		<div class="flex-shrink-0">
			<Avatar
				src={isFromSimulator ? null : otherUser?.profiles?.avatar_url}
				name={isFromSimulator ? 'Test User' : otherUser?.profiles?.name || undefined}
				email={isFromSimulator ? 'simulator@test.com' : otherUser?.email}
				size="sm"
				isSimulator={isFromSimulator}
			/>
		</div>
	{/if}

	<div class="max-w-xs lg:max-w-md">
		<div
			class="rounded-lg {message.image_url && !message.content
				? ''
				: 'px-3 py-2'} {isFromCurrentUser
				? message.image_url && !message.content
					? ''
					: 'bg-blue-500 text-white'
				: isFromSimulator
					? message.image_url && !message.content
						? ''
						: 'bg-green-500 text-white'
					: message.image_url && !message.content
						? ''
						: 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'}"
		>
			{#if message.content}
				{#await getRenderedContent()}
					<div class="text-sm opacity-75">Loading...</div>
				{:then renderedContent}
					<div
						class="prose prose-sm max-w-none text-sm {isFromCurrentUser || isFromSimulator
							? 'prose-invert'
							: 'dark:prose-invert'}"
					>
						{@html renderedContent}
					</div>
				{:catch error}
					<div class="text-sm text-red-400">Error rendering content</div>
				{/await}
			{/if}

			{#if message.image_url}
				<div class="{message.content ? 'mt-2' : ''}">
					<img
						src={message.image_url}
						alt="Shared img"
						class="max-h-64 max-w-xs rounded object-contain"
						onload={onImageLoad}
					/>
				</div>
			{/if}
		</div>

		<div
			class="mt-1 text-xs text-gray-500 dark:text-gray-400 {isFromCurrentUser
				? 'text-right'
				: 'text-left'}"
		>
			{formatTime(message.created_at)}
			{#if isFromSimulator}
				<span class="ml-1 text-green-600 dark:text-green-400">(Test User)</span>
			{:else if isFromCurrentUser}
				<span class="ml-1">(You)</span>
				<!-- Display read receipt only for messages sent by the current user -->
				<span
					title={message.read_at ? 'Read' : 'Sent'}
					class="ml-1 select-none {message.read_at ? 'text-green-500' : 'text-gray-400'}"
				>
					{message.read_at ? '✓✓' : '✓'}
				</span>
			{/if}
		</div>
	</div>

	{#if isFromCurrentUser}
		<div class="flex-shrink-0">
			<Avatar
				src={currentUserProfile?.profiles?.avatar_url}
				name={currentUserProfile?.profiles?.name || undefined}
				email={currentUserProfile?.email}
				size="sm"
			/>
		</div>
	{/if}
</div>
