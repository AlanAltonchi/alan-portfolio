<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Modal from '$lib/components/Modal.svelte';
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
		Users
	} from 'lucide-svelte';
	import { renderMarkdown } from '$lib/utils/chat';
	import ActivityFeed from './ActivityFeed.svelte';
	import CardAttachments from './CardAttachments.svelte';
	import CardChecklists from './CardChecklists.svelte';
	import CardComments from './CardComments.svelte';
	import CardEditor from './CardEditor.svelte';
	import LabelManager from './LabelManager.svelte';
	import MemberSelector from './MemberSelector.svelte';

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
		if (!authStore.user || !confirm('Are you sure you want to delete this card?')) return;

		const success = await kanbanStore.deleteCard(card.id);
		if (success) {
			onClose();
		}
	}

	// Count items for tabs
	let checklistCount = $derived(card.checklists?.length || 0);
	let attachmentCount = $derived(card.attachments?.length || 0);
	let commentCount = $derived(card.comments?.length || 0);
</script>

<Modal {isOpen} {onClose} size="lg" title="Card Details">
	<div class="flex h-full max-h-[90vh] flex-col">
		<!-- Header -->
		<div
			class="flex items-start justify-between gap-4 border-b border-gray-200 px-6 pb-6 dark:border-gray-700"
		>
			<div class="flex-1">
				{#if isEditing}
					<Input bind:value={title} placeholder="Card title" class="text-xl font-semibold" />
				{:else}
					<h2 class="text-xl font-semibold text-gray-900 dark:text-white">
						{title}
					</h2>
				{/if}

				<div class="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
					<span>in {card.column?.title || 'Unknown Column'}</span>
					{#if dueDate}
						<span class="flex items-center gap-1">
							<Calendar class="h-4 w-4" />
							{new Date(dueDate).toLocaleDateString()}
						</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- Tabs -->
		<div class="flex border-b border-gray-200 dark:border-gray-700">
			<button
				onclick={() => (activeTab = 'details')}
				class="border-b-2 px-4 py-2 text-sm font-medium transition-colors {activeTab === 'details'
					? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
					: 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
			>
				Details
			</button>

			<button
				onclick={() => (activeTab = 'checklists')}
				class="flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors {activeTab ===
				'checklists'
					? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
					: 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
			>
				<CheckSquare class="h-4 w-4" />
				Checklists
				{#if checklistCount > 0}
					<span class="rounded-full bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-700">
						{checklistCount}
					</span>
				{/if}
			</button>

			<button
				onclick={() => (activeTab = 'attachments')}
				class="flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors {activeTab ===
				'attachments'
					? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
					: 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
			>
				<Paperclip class="h-4 w-4" />
				Attachments
				{#if attachmentCount > 0}
					<span class="rounded-full bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-700">
						{attachmentCount}
					</span>
				{/if}
			</button>

			<button
				onclick={() => (activeTab = 'comments')}
				class="flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors {activeTab ===
				'comments'
					? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
					: 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
			>
				<MessageSquare class="h-4 w-4" />
				Comments
				{#if commentCount > 0}
					<span class="rounded-full bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-700">
						{commentCount}
					</span>
				{/if}
			</button>

			<button
				onclick={() => (activeTab = 'activity')}
				class="flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors {activeTab ===
				'activity'
					? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
					: 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
			>
				<Activity class="h-4 w-4" />
				Activity
			</button>
		</div>

		<!-- Content -->
		<div class="flex-1 p-6">
			{#if activeTab === 'details'}
				<div class="space-y-6">
					<!-- Labels and Assignees -->
					<div class="grid grid-cols-2 gap-4">
						<div>
							<h3
								class="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								<Tag class="h-4 w-4" />
								Labels
							</h3>
							<LabelManager cardId={card.id} boardId={card.board_id} />
						</div>

						<div>
							<h3
								class="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								<Users class="h-4 w-4" />
								Assignees
							</h3>
							<MemberSelector cardId={card.id} boardId={card.board_id} />
						</div>
					</div>

					<!-- Priority and Due Date -->
					<div class="grid grid-cols-2 gap-4">
						<div>
							<span class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
								Priority
							</span>
							<select
								bind:value={priority}
								disabled={!isEditing}
								class="w-full rounded-md border border-gray-300 bg-white px-3 py-2
									text-gray-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600
									dark:bg-gray-800 dark:text-white"
							>
								<option value="low">Low</option>
								<option value="medium">Medium</option>
								<option value="high">High</option>
								<option value="urgent">Urgent</option>
							</select>
						</div>

						<div>
							<span class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
								Due Date
							</span>
							<input
								type="date"
								bind:value={dueDate}
								disabled={!isEditing}
								class="w-full rounded-md border border-gray-300 bg-white px-3 py-2
									text-gray-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600
									dark:bg-gray-800 dark:text-white"
							/>
						</div>
					</div>

					<!-- Description -->
					<div>
						<h3 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Description</h3>
						{#if isEditing}
							<CardEditor bind:content={description} />
						{:else if description}
							<div class="prose dark:prose-invert max-w-none">
								{@html renderMarkdown(description)}
							</div>
						{:else}
							<p class="text-gray-500 italic dark:text-gray-400">No description provided</p>
						{/if}
					</div>
				</div>
			{:else if activeTab === 'checklists'}
				<CardChecklists cardId={card.id} />
			{:else if activeTab === 'attachments'}
				<CardAttachments cardId={card.id} boardId={card.board_id} />
			{:else if activeTab === 'comments'}
				<CardComments cardId={card.id} />
			{:else if activeTab === 'activity'}
				<ActivityFeed boardId={card.board_id} cardId={card.id} maxItems={20} />
			{/if}
		</div>

		<!-- Footer -->
		<div
			class="flex items-center justify-between gap-4 border-t border-gray-200 p-6 dark:border-gray-700"
		>
			<Button
				variant="ghost"
				size="sm"
				onclick={deleteCard}
				class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
			>
				Delete Card
			</Button>

			<div class="flex items-center gap-2">
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
					>
						Cancel
					</Button>
					<Button
						variant="primary"
						size="sm"
						onclick={saveCard}
						disabled={isSaving || !title.trim()}
					>
						{isSaving ? 'Saving...' : 'Save Changes'}
					</Button>
				{:else}
					<Button variant="primary" size="sm" onclick={() => (isEditing = true)}>Edit Card</Button>
				{/if}
			</div>
		</div>
	</div>
</Modal>
