<script lang="ts">
	import { supabase } from '$lib/db.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import Button from '$lib/components/Button.svelte';
	import { Send, Edit2, Trash2 } from 'lucide-svelte';

	interface Comment {
		id: string;
		card_id: string;
		user_id: string;
		content: string;
		created_at: string;
		updated_at: string;
		author?: {
			email: string;
			full_name: string | null;
			avatar_url: string | null;
		} | null;
	}

	interface Props {
		cardId: string;
	}

	let { cardId }: Props = $props();

	let comments = $state<Comment[]>([]);
	let isLoading = $state(true);
	let newComment = $state('');
	let isSubmitting = $state(false);
	let editingCommentId = $state<string | null>(null);
	let editingContent = $state('');
	let showMentions = $state(false);
	let mentionQuery = $state('');
	let boardMembers = $state<Array<{ user_id: string; email: string; full_name: string | null }>>(
		[]
	);
	let textareaRef = $state<HTMLTextAreaElement>();

	async function loadComments() {
		if (!authStore.user) return;

		isLoading = true;

		// First get the comments
		const { data: commentsData, error } = await supabase
			.from('card_comments')
			.select('*')
			.eq('card_id', cardId)
			.order('created_at', { ascending: false });

		if (!error && commentsData) {
			// Get unique user IDs from comments (filter out nulls)
			const userIds = [
				...new Set(commentsData.map((c) => c.user_id).filter((id): id is string => id !== null))
			];

			// Get user details
			const { data: usersData } = await supabase
				.from('users')
				.select('id, email')
				.in('id', userIds);

			// Map comments with user data
			comments = commentsData.map((comment) => ({
				...comment,
				user_id: comment.user_id || '', // Ensure user_id is never null
				author: usersData?.find((u) => u.id === comment.user_id)
					? {
							email: usersData.find((u) => u.id === comment.user_id)?.email || '',
							full_name: null,
							avatar_url: null
						}
					: null
			}));
		}

		isLoading = false;
	}

	async function loadBoardMembers() {
		if (!authStore.user) return;

		// Get card details to find board ID
		const { data: cardData } = await supabase
			.from('cards')
			.select('board_id')
			.eq('id', cardId)
			.single();

		if (!cardData) return;

		// Load board members
		const { data: memberData } = await supabase
			.from('board_members')
			.select('user_id')
			.eq('board_id', cardData.board_id);

		if (memberData) {
			const userIds = memberData.map((m) => m.user_id);
			const { data: userData } = await supabase.from('users').select('id, email').in('id', userIds);

			if (userData) {
				boardMembers = userData.map((u) => ({
					user_id: u.id,
					email: u.email,
					full_name: null
				}));
			}
		}
	}

	async function submitComment() {
		if (!authStore.user || !newComment.trim()) return;

		isSubmitting = true;

		const { data, error } = await supabase
			.from('card_comments')
			.insert({
				card_id: cardId,
				user_id: authStore.user.id,
				content: newComment.trim()
			})
			.select('*')
			.single();

		if (!error && data) {
			// Add the new comment with author info
			const newCommentWithAuthor = {
				...data,
				user_id: data.user_id || '', // Ensure user_id is never null
				author: {
					email: authStore.user.email || '',
					full_name: null,
					avatar_url: null
				}
			};
			comments = [newCommentWithAuthor, ...comments];
			newComment = '';
		}

		isSubmitting = false;
	}

	async function updateComment(commentId: string) {
		if (!authStore.user || !editingContent.trim()) return;

		const { error } = await supabase
			.from('card_comments')
			.update({
				content: editingContent.trim(),
				updated_at: new Date().toISOString()
			})
			.eq('id', commentId);

		if (!error) {
			comments = comments.map((c) =>
				c.id === commentId
					? { ...c, content: editingContent.trim(), updated_at: new Date().toISOString() }
					: c
			);
			editingCommentId = null;
			editingContent = '';
		}
	}

	async function deleteComment(commentId: string) {
		if (!authStore.user || !confirm('Delete this comment?')) return;

		const { error } = await supabase.from('card_comments').delete().eq('id', commentId);

		if (!error) {
			comments = comments.filter((c) => c.id !== commentId);
		}
	}

	function startEditing(comment: Comment) {
		editingCommentId = comment.id;
		editingContent = comment.content;
	}

	function cancelEditing() {
		editingCommentId = null;
		editingContent = '';
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);

		if (diffMins < 1) return 'just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
		if (diffMins < 10080) return `${Math.floor(diffMins / 1440)}d ago`;

		return date.toLocaleDateString();
	}

	function handleTextareaInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		const text = target.value;
		const cursorPosition = target.selectionStart;

		// Check for @ mentions
		const textBeforeCursor = text.substring(0, cursorPosition);
		const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

		if (mentionMatch) {
			mentionQuery = mentionMatch[1];
			showMentions = true;
		} else {
			showMentions = false;
			mentionQuery = '';
		}
	}

	function insertMention(member: { user_id: string; email: string; full_name: string | null }) {
		if (!textareaRef) return;

		const text = newComment;
		const cursorPosition = textareaRef.selectionStart;
		const textBeforeCursor = text.substring(0, cursorPosition);
		const textAfterCursor = text.substring(cursorPosition);

		// Find the @ symbol position
		const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
		if (!mentionMatch) return;

		const mentionStart = textBeforeCursor.lastIndexOf('@');
		const displayName = member.full_name || member.email.split('@')[0];

		// Replace the partial mention with the complete mention
		newComment = text.substring(0, mentionStart) + `@${displayName} ` + textAfterCursor;

		showMentions = false;
		mentionQuery = '';

		// Focus back to textarea
		setTimeout(() => {
			if (textareaRef) {
				textareaRef.focus();
				const newPosition = mentionStart + displayName.length + 2;
				textareaRef.setSelectionRange(newPosition, newPosition);
			}
		}, 0);
	}

	function renderCommentWithMentions(content: string): string {
		// Simple mention detection and highlighting
		return content.replace(
			/@(\w+)/g,
			'<span class="text-blue-600 dark:text-blue-400 font-medium">@$1</span>'
		);
	}

	let filteredMembers = $derived(
		boardMembers
			.filter((member) => {
				if (!mentionQuery) return true;
				const displayName = member.full_name || member.email.split('@')[0];
				return displayName.toLowerCase().includes(mentionQuery.toLowerCase());
			})
			.slice(0, 5)
	);

	$effect(() => {
		loadComments();
		loadBoardMembers();
	});
</script>

<div class="space-y-4">
	{#if isLoading}
		<div class="py-8 text-center text-gray-500 dark:text-gray-400">Loading comments...</div>
	{:else}
		<!-- Comment Form -->
		<div class="flex gap-3">
			{#if authStore.user}
				<Avatar src={null} name="" email={authStore.user.email || ''} size="sm" />
			{/if}

			<div class="relative flex-1">
				<textarea
					bind:this={textareaRef}
					bind:value={newComment}
					placeholder="Write a comment... Use @ to mention someone"
					rows="3"
					class="w-full resize-none rounded-md border border-gray-300 bg-white px-3
						py-2 text-gray-900 placeholder-gray-400 focus:ring-2
						focus:ring-blue-500 focus:outline-none dark:border-gray-600
						dark:bg-gray-900 dark:text-white dark:placeholder-gray-500 dark:focus:ring-blue-400"
					oninput={handleTextareaInput}
					onkeydown={(e) => {
						if (e.key === 'Enter' && e.ctrlKey) {
							submitComment();
						} else if (e.key === 'Escape') {
							showMentions = false;
						}
					}}
				></textarea>

				<!-- Mentions Dropdown -->
				{#if showMentions && filteredMembers.length > 0}
					<div
						class="absolute bottom-full left-0 z-50 mb-1 max-h-40
						w-max overflow-x-hidden overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
					>
						{#each filteredMembers as member (member.user_id)}
							<button
								onclick={() => insertMention(member)}
								class="flex w-full items-center gap-2 px-3 py-2 text-left first:rounded-t-md
									last:rounded-b-md hover:bg-gray-100 dark:hover:bg-gray-700"
							>
								<Avatar src={null} name={member.full_name || ''} email={member.email} size="sm" />
								<div>
									<div class="text-sm font-medium text-gray-900 dark:text-white">
										{member.full_name || member.email.split('@')[0]}
									</div>
									<div class="text-xs text-gray-500 dark:text-gray-400">
										{member.email}
									</div>
								</div>
							</button>
						{/each}
					</div>
				{/if}

				<div class="mt-2 flex items-center justify-between">
					<p class="text-xs text-gray-500 dark:text-gray-400">
						Tip: Use Ctrl+Enter to send quickly
					</p>
					<Button
						variant="primary"
						size="sm"
						onclick={submitComment}
						disabled={!newComment.trim() || isSubmitting}
					>
						<Send class="mr-1 h-4 w-4" />
						{isSubmitting ? 'Sending...' : 'Send'}
					</Button>
				</div>
			</div>
		</div>

		<!-- Comments List -->
		{#if comments.length > 0}
			<div class="mt-6 max-h-[400px] space-y-4 overflow-y-auto">
				{#each comments as comment (comment.id)}
					<div class="flex gap-3">
						<Avatar
							src={comment.author?.avatar_url}
							name={comment.author?.full_name || ''}
							email={comment.author?.email || ''}
							size="sm"
						/>

						<div class="flex-1">
							<div class="flex items-start justify-between">
								<div>
									<span class="text-sm font-medium text-gray-900 dark:text-white">
										{comment.author?.full_name || comment.author?.email || 'Unknown User'}
									</span>
									<span class="ml-2 text-xs text-gray-500 dark:text-gray-400">
										{formatDate(comment.created_at)}
										{#if comment.updated_at !== comment.created_at}
											<span class="italic">(edited)</span>
										{/if}
									</span>
								</div>

								{#if authStore.user?.id === comment.user_id}
									<div class="flex items-center gap-1">
										<button
											onclick={() => startEditing(comment)}
											class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
											title="Edit"
										>
											<Edit2 class="h-3 w-3" />
										</button>
										<button
											onclick={() => deleteComment(comment.id)}
											class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
											title="Delete"
										>
											<Trash2 class="h-3 w-3" />
										</button>
									</div>
								{/if}
							</div>

							{#if editingCommentId === comment.id}
								<div class="mt-2">
									<textarea
										bind:value={editingContent}
										rows="3"
										class="w-full resize-none rounded-md border border-gray-300 bg-white px-3
											py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500
											focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white
											dark:focus:ring-blue-400"
									></textarea>
									<div class="mt-2 flex gap-2">
										<button
											onclick={() => updateComment(comment.id)}
											class="rounded bg-blue-600 px-3 py-1 text-sm font-medium
												text-white hover:bg-blue-700"
										>
											Save
										</button>
										<button
											onclick={cancelEditing}
											class="px-3 py-1 text-sm font-medium text-gray-600
												hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
										>
											Cancel
										</button>
									</div>
								</div>
							{:else}
								<div class="mt-1 text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
									{@html renderCommentWithMentions(comment.content)}
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{:else if !isLoading}
			<div class="py-8 text-center text-gray-500 dark:text-gray-400">
				No comments yet. Be the first to comment!
			</div>
		{/if}
	{/if}
</div>
