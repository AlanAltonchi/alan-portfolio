<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { kanbanStore } from '$lib/stores/kanban.svelte';
	import type { Card, UpdateCardInput } from '$lib/types/kanban';
	import {
		Activity,
		Calendar,
		CheckSquare,
		MessageSquare,
		Paperclip,
		Tag,
		Users,
		X
	} from 'lucide-svelte';
	import { renderMarkdown } from '$lib/utils/chat';
	import ActivityFeed from './ActivityFeed.svelte';
	import CardAttachments from './CardAttachments.svelte';
	import CardChecklists from './CardChecklists.svelte';
	import CardComments from './CardComments.svelte';
	import CardEditor from './CardEditor.svelte';
	import LabelManager from './LabelManager.svelte';
	import MemberSelector from './MemberSelector.svelte';
	import ConfirmationModal from '../ui/ConfirmationModal.svelte';

	interface Props {
		card: Card;
		isOpen: boolean;
		onClose: () => void;
	}

	let { card, isOpen, onClose }: Props = $props();

	let title = $state(card.title);
	let description = $state(card.description || '');
	let dueDate = $state(card.due_date || '');
	let priority = $state(card.priority || 'medium');
	let isEditing = $state(false);
	let isSaving = $state(false);
	let deleteModalOpen = $state(false);

	// Tab state
	let activeTab = $state<'details' | 'checklists' | 'attachments' | 'comments' | 'activity'>(
		'details'
	);

	async function saveCard() {
		if (!authStore.user) return;

		isSaving = true;
		const updates: UpdateCardInput = {
			title,
			description,
			due_date: dueDate || undefined,
			priority: priority as 'low' | 'medium' | 'high' | 'urgent'
		};

		const success = await kanbanStore.updateCard(card.id, updates);
		if (success) {
			isEditing = false;
		}
		isSaving = false;
	}

	async function deleteCard() {
		const success = await kanbanStore.deleteCard(card.id);
		if (success) {
			deleteModalOpen = false;
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	// Count items for tabs
	let checklistCount = $derived(card.checklists?.length || 0);
	let attachmentCount = $derived(card.attachments?.length || 0);
	let commentCount = $derived(card.comments?.length || 0);
</script>

<!-- Custom Modal -->
{#if isOpen}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<!-- Modal Content -->
		<div
			class="relative flex h-[90dvh] w-full max-w-4xl flex-col rounded-2xl bg-gradient-to-br from-gray-50/95 to-white/95 shadow-2xl backdrop-blur-xl dark:from-gray-900/95 dark:to-gray-800/95"
			onclick={(e) => e.stopPropagation()}
			onkeydown={handleKeydown}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<!-- Close Button -->
			<button
				onclick={onClose}
				class="absolute top-4 right-4 z-10 cursor-pointer rounded-full bg-white/80 p-2 text-gray-500 transition-all hover:bg-white hover:text-gray-700 dark:bg-gray-800/80 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
				aria-label="Close modal"
			>
				<X class="h-5 w-5" />
			</button>

			<!-- Header -->
			<div
				class="relative overflow-hidden border-b border-gray-200/20 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 px-8 pt-8 pb-6 backdrop-blur-sm dark:border-gray-700/20 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10"
			>
				<div
					class="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-3xl"
				></div>
				<div
					class="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-3xl"
				></div>

				<div class="relative flex-1 pr-12">
					{#if isEditing}
						<Input
							bind:value={title}
							placeholder="Card title"
							class="!border-gray-200/50 !bg-white/50 text-2xl font-bold !backdrop-blur-sm dark:!border-gray-700/50 dark:!bg-gray-800/50"
						/>
					{:else}
						<h2
							class="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-2xl font-bold text-transparent dark:from-white dark:to-gray-300"
						>
							{title}
						</h2>
					{/if}

					<div class="mt-3 flex items-center gap-4">
						<span
							class="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-3 py-1 text-sm font-medium text-gray-700 backdrop-blur-sm dark:from-blue-500/20 dark:to-purple-500/20 dark:text-gray-300"
						>
							<div class="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
							{card.column?.title || 'Unknown Column'}
						</span>
						{#if dueDate}
							<span
								class="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 px-3 py-1 text-sm font-medium text-gray-700 backdrop-blur-sm dark:from-orange-500/20 dark:to-red-500/20 dark:text-gray-300"
							>
								<Calendar class="h-3.5 w-3.5" />
								{new Date(dueDate).toLocaleDateString()}
							</span>
						{/if}
					</div>
				</div>
			</div>

			<!-- Tabs -->
			<div
				class="flex gap-1 border-b border-gray-200/20 bg-gray-50/50 px-8 backdrop-blur-sm dark:border-gray-700/20 dark:bg-gray-800/50"
			>
				<button
					onclick={() => (activeTab = 'details')}
					class="group relative rounded-t-xl px-4 py-3 text-sm font-medium transition-all duration-200 {activeTab ===
					'details'
						? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
						: 'text-gray-600 hover:bg-gray-100/50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-200'}"
				>
					<span class="relative z-10">Details</span>
					{#if activeTab === 'details'}
						<div
							class="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-white to-transparent"
						></div>
					{/if}
				</button>

				<button
					onclick={() => (activeTab = 'checklists')}
					class="group relative flex items-center gap-2 rounded-t-xl px-4 py-3 text-sm font-medium transition-all duration-200 {activeTab ===
					'checklists'
						? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
						: 'text-gray-600 hover:bg-gray-100/50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-200'}"
				>
					<CheckSquare class="h-4 w-4" />
					<span class="relative z-10">Checklists</span>
					{#if checklistCount > 0}
						<span
							class="rounded-full {activeTab === 'checklists'
								? 'bg-white/20 text-white'
								: 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-gray-700 dark:text-gray-300'} px-2 py-0.5 text-xs font-semibold"
						>
							{checklistCount}
						</span>
					{/if}
					{#if activeTab === 'checklists'}
						<div
							class="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-white to-transparent"
						></div>
					{/if}
				</button>

				<button
					onclick={() => (activeTab = 'attachments')}
					class="group relative flex items-center gap-2 rounded-t-xl px-4 py-3 text-sm font-medium transition-all duration-200 {activeTab ===
					'attachments'
						? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
						: 'text-gray-600 hover:bg-gray-100/50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-200'}"
				>
					<Paperclip class="h-4 w-4" />
					<span class="relative z-10">Attachments</span>
					{#if attachmentCount > 0}
						<span
							class="rounded-full {activeTab === 'attachments'
								? 'bg-white/20 text-white'
								: 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-gray-700 dark:text-gray-300'} px-2 py-0.5 text-xs font-semibold"
						>
							{attachmentCount}
						</span>
					{/if}
					{#if activeTab === 'attachments'}
						<div
							class="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-white to-transparent"
						></div>
					{/if}
				</button>

				<button
					onclick={() => (activeTab = 'comments')}
					class="group relative flex items-center gap-2 rounded-t-xl px-4 py-3 text-sm font-medium transition-all duration-200 {activeTab ===
					'comments'
						? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
						: 'text-gray-600 hover:bg-gray-100/50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-200'}"
				>
					<MessageSquare class="h-4 w-4" />
					<span class="relative z-10">Comments</span>
					{#if commentCount > 0}
						<span
							class="rounded-full {activeTab === 'comments'
								? 'bg-white/20 text-white'
								: 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-gray-700 dark:text-gray-300'} px-2 py-0.5 text-xs font-semibold"
						>
							{commentCount}
						</span>
					{/if}
					{#if activeTab === 'comments'}
						<div
							class="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-white to-transparent"
						></div>
					{/if}
				</button>

				<button
					onclick={() => (activeTab = 'activity')}
					class="group relative flex items-center gap-2 rounded-t-xl px-4 py-3 text-sm font-medium transition-all duration-200 {activeTab ===
					'activity'
						? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
						: 'text-gray-600 hover:bg-gray-100/50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-200'}"
				>
					<Activity class="h-4 w-4" />
					<span class="relative z-10">Activity</span>
					{#if activeTab === 'activity'}
						<div
							class="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-white to-transparent"
						></div>
					{/if}
				</button>
			</div>

			<!-- Content - No overflow here to allow popovers to escape -->
			<div class="min-h-0 flex-1 p-8">
				{#if activeTab === 'details'}
					<div class="h-full space-y-6">
						<!-- Labels and Assignees -->
						<div class="grid grid-cols-2 gap-4">
							<div
								class="rounded-xl bg-gradient-to-br from-gray-50/50 to-gray-100/50 p-4 backdrop-blur-sm dark:from-gray-800/50 dark:to-gray-900/50"
							>
								<h3
									class="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
								>
									<Tag class="h-4 w-4 text-blue-500" />
									Labels
								</h3>
								<LabelManager cardId={card.id} boardId={card.board_id} />
							</div>

							<div
								class="rounded-xl bg-gradient-to-br from-gray-50/50 to-gray-100/50 p-4 backdrop-blur-sm dark:from-gray-800/50 dark:to-gray-900/50"
							>
								<h3
									class="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
								>
									<Users class="h-4 w-4 text-purple-500" />
									Assignees
								</h3>
								<MemberSelector cardId={card.id} boardId={card.board_id} />
							</div>
						</div>

						<!-- Priority and Due Date -->
						<div class="grid grid-cols-2 gap-4">
							<div
								class="rounded-xl bg-gradient-to-br from-gray-50/50 to-gray-100/50 p-4 backdrop-blur-sm dark:from-gray-800/50 dark:to-gray-900/50"
							>
								<span class="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
									Priority
								</span>
								<select
									bind:value={priority}
									disabled={!isEditing}
									class="w-full rounded-lg border border-gray-200/50 bg-white/70 px-3 py-2
										text-gray-900 backdrop-blur-sm transition-all duration-200 hover:bg-white/80 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700/50
										dark:bg-gray-800/70 dark:text-white dark:hover:bg-gray-800/80"
								>
									<option value="low">🟢 Low</option>
									<option value="medium">🟡 Medium</option>
									<option value="high">🟠 High</option>
									<option value="urgent">🔴 Urgent</option>
								</select>
							</div>

							<div
								class="rounded-xl bg-gradient-to-br from-gray-50/50 to-gray-100/50 p-4 backdrop-blur-sm dark:from-gray-800/50 dark:to-gray-900/50"
							>
								<span class="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
									Due Date
								</span>
								<input
									type="date"
									bind:value={dueDate}
									disabled={!isEditing}
									class="w-full rounded-lg border border-gray-200/50 bg-white/70 px-3 py-2
										text-gray-900 backdrop-blur-sm transition-all duration-200 hover:bg-white/80 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700/50
										dark:bg-gray-800/70 dark:text-white dark:hover:bg-gray-800/80"
								/>
							</div>
						</div>

						<!-- Description -->
						<div
							class="rounded-xl bg-gradient-to-br from-gray-50/50 to-gray-100/50 p-4 backdrop-blur-sm dark:from-gray-800/50 dark:to-gray-900/50"
						>
							<h3 class="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
								Description
							</h3>
							{#if isEditing}
								<CardEditor bind:content={description} />
							{:else if description}
								<div
									class="prose dark:prose-invert max-w-none rounded-lg bg-white/50 p-4 backdrop-blur-sm dark:bg-gray-800/50"
								>
									{@html renderMarkdown(description)}
								</div>
							{:else}
								<p
									class="rounded-lg bg-white/50 p-4 text-gray-500 italic backdrop-blur-sm dark:bg-gray-800/50 dark:text-gray-400"
								>
									No description provided
								</p>
							{/if}
						</div>
					</div>
				{:else if activeTab === 'checklists'}
					<div class="h-full overflow-y-auto">
						<CardChecklists cardId={card.id} />
					</div>
				{:else if activeTab === 'attachments'}
					<div class="h-full overflow-y-auto">
						<CardAttachments cardId={card.id} boardId={card.board_id} />
					</div>
				{:else if activeTab === 'comments'}
					<div class="h-full overflow-y-auto">
						<CardComments cardId={card.id} />
					</div>
				{:else if activeTab === 'activity'}
					<div class="h-full overflow-y-auto">
						<ActivityFeed boardId={card.board_id} cardId={card.id} maxItems={20} />
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div
				class="flex items-center justify-between gap-4 border-t border-gray-200/20 bg-gradient-to-r from-gray-50/50 to-white/50 p-6 backdrop-blur-sm dark:border-gray-700/20 dark:from-gray-800/50 dark:to-gray-900/50"
			>
				<Button
					variant="ghost"
					size="sm"
					onclick={() => (deleteModalOpen = true)}
					class="!bg-gradient-to-r !from-red-500/10 !to-red-600/10 !text-red-600 hover:!from-red-500/20 hover:!to-red-600/20 hover:!text-red-700 dark:!text-red-400 dark:hover:!text-red-300"
				>
					Delete Card
				</Button>

				<div class="flex items-center gap-3">
					{#if isEditing}
						<Button
							variant="ghost"
							size="sm"
							onclick={() => {
								title = card.title;
								description = card.description || '';
								dueDate = card.due_date || '';
								priority = card.priority || 'medium';
								isEditing = false;
							}}
							class="!bg-gray-100/50 hover:!bg-gray-200/50 dark:!bg-gray-700/50 dark:hover:!bg-gray-600/50"
						>
							Cancel
						</Button>
						<Button
							variant="primary"
							size="sm"
							onclick={saveCard}
							disabled={isSaving || !title.trim()}
							class="!bg-gradient-to-r !from-blue-500 !to-purple-600 !shadow-lg !shadow-blue-500/25 hover:!from-blue-600 hover:!to-purple-700 disabled:!opacity-50 disabled:!shadow-none"
						>
							{isSaving ? 'Saving...' : 'Save Changes'}
						</Button>
					{:else}
						<Button
							variant="primary"
							size="sm"
							onclick={() => (isEditing = true)}
							class="!bg-gradient-to-r !from-blue-500 !to-purple-600 !shadow-lg !shadow-blue-500/25 hover:!from-blue-600 hover:!to-purple-700"
						>
							Edit Card
						</Button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

{#if deleteModalOpen}
	<ConfirmationModal
		title="Delete Card"
		message="Are you sure you want to delete this card?"
		onConfirm={deleteCard}
		isOpen={deleteModalOpen}
		onCancel={() => (deleteModalOpen = false)}
	/>
{/if}
