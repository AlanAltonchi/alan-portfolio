<script lang="ts">
	import { supabase } from '$lib/db.svelte';
	import { kanbanStore } from '$lib/stores/kanban.svelte';
	import type { Card, CardUpdateInput } from '$lib/types/kanban';
	import { authStore } from '$lib/stores/auth.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import CardEditor from './CardEditor.svelte';
	import LabelManager from './LabelManager.svelte';
	import MemberSelector from './MemberSelector.svelte';
	import CardChecklists from './CardChecklists.svelte';
	import CardAttachments from './CardAttachments.svelte';
	import CardComments from './CardComments.svelte';
	import { Calendar, X, Paperclip, CheckSquare, Tag, Users, MessageSquare } from 'lucide-svelte';

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
	let activeTab = $state<'details' | 'checklists' | 'attachments' | 'comments'>('details');
	
	async function saveCard() {
		if (!authStore.user) return;
		
		isSaving = true;
		const updates: CardUpdateInput = {
			title,
			description,
			due_date: dueDate || null,
			priority
		};
		
		const success = await kanbanStore.updateCard(card.id, updates);
		if (success) {
			isEditing = false;
		}
		isSaving = false;
	}
	
	async function deleteCard() {
		if (!authStore.user || !confirm('Are you sure you want to delete this card?')) return;
		
		const success = await kanbanStore.deleteCard(card.board_id, card.id);
		if (success) {
			onClose();
		}
	}
	
	// Count items for tabs
	let checklistCount = $derived(card.checklists?.length || 0);
	let attachmentCount = $derived(card.attachments?.length || 0);
	let commentCount = $derived(card.comments?.length || 0);
</script>

<Modal {isOpen} {onClose} size="lg">
	<div class="flex flex-col h-full max-h-[90vh]">
		<!-- Header -->
		<div class="flex items-start justify-between gap-4 p-6 border-b border-gray-200 dark:border-gray-700">
			<div class="flex-1">
				{#if isEditing}
					<Input
						bind:value={title}
						placeholder="Card title"
						class="text-xl font-semibold"
					/>
				{:else}
					<h2 class="text-xl font-semibold text-gray-900 dark:text-white">
						{title}
					</h2>
				{/if}
				
				<div class="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
					<span>in {card.column?.title || 'Unknown Column'}</span>
					{#if dueDate}
						<span class="flex items-center gap-1">
							<Calendar class="w-4 h-4" />
							{new Date(dueDate).toLocaleDateString()}
						</span>
					{/if}
				</div>
			</div>
			
			<button
				onclick={onClose}
				class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
			>
				<X class="w-5 h-5" />
			</button>
		</div>
		
		<!-- Tabs -->
		<div class="flex border-b border-gray-200 dark:border-gray-700">
			<button
				onclick={() => activeTab = 'details'}
				class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {
					activeTab === 'details' 
						? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400' 
						: 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
				}"
			>
				Details
			</button>
			
			<button
				onclick={() => activeTab = 'checklists'}
				class="px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 {
					activeTab === 'checklists' 
						? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400' 
						: 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
				}"
			>
				<CheckSquare class="w-4 h-4" />
				Checklists
				{#if checklistCount > 0}
					<span class="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded-full">
						{checklistCount}
					</span>
				{/if}
			</button>
			
			<button
				onclick={() => activeTab = 'attachments'}
				class="px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 {
					activeTab === 'attachments' 
						? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400' 
						: 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
				}"
			>
				<Paperclip class="w-4 h-4" />
				Attachments
				{#if attachmentCount > 0}
					<span class="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded-full">
						{attachmentCount}
					</span>
				{/if}
			</button>
			
			<button
				onclick={() => activeTab = 'comments'}
				class="px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 {
					activeTab === 'comments' 
						? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400' 
						: 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
				}"
			>
				<MessageSquare class="w-4 h-4" />
				Comments
				{#if commentCount > 0}
					<span class="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded-full">
						{commentCount}
					</span>
				{/if}
			</button>
		</div>
		
		<!-- Content -->
		<div class="flex-1 overflow-y-auto p-6">
			{#if activeTab === 'details'}
				<div class="space-y-6">
					<!-- Labels and Assignees -->
					<div class="grid grid-cols-2 gap-4">
						<div>
							<h3 class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								<Tag class="w-4 h-4" />
								Labels
							</h3>
							<LabelManager cardId={card.id} boardId={card.board_id} />
						</div>
						
						<div>
							<h3 class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								<Users class="w-4 h-4" />
								Assignees
							</h3>
							<MemberSelector cardId={card.id} boardId={card.board_id} />
						</div>
					</div>
					
					<!-- Priority and Due Date -->
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Priority
							</label>
							<select
								bind:value={priority}
								disabled={!isEditing}
								class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
									bg-white dark:bg-gray-800 text-gray-900 dark:text-white
									disabled:opacity-60 disabled:cursor-not-allowed"
							>
								<option value="low">Low</option>
								<option value="medium">Medium</option>
								<option value="high">High</option>
								<option value="urgent">Urgent</option>
							</select>
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Due Date
							</label>
							<input
								type="date"
								bind:value={dueDate}
								disabled={!isEditing}
								class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
									bg-white dark:bg-gray-800 text-gray-900 dark:text-white
									disabled:opacity-60 disabled:cursor-not-allowed"
							/>
						</div>
					</div>
					
					<!-- Description -->
					<div>
						<h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Description
						</h3>
						{#if isEditing}
							<CardEditor bind:content={description} />
						{:else if description}
							<div class="prose dark:prose-invert max-w-none">
								{@html description}
							</div>
						{:else}
							<p class="text-gray-500 dark:text-gray-400 italic">
								No description provided
							</p>
						{/if}
					</div>
				</div>
			{:else if activeTab === 'checklists'}
				<CardChecklists cardId={card.id} />
			{:else if activeTab === 'attachments'}
				<CardAttachments cardId={card.id} boardId={card.board_id} />
			{:else if activeTab === 'comments'}
				<CardComments cardId={card.id} />
			{/if}
		</div>
		
		<!-- Footer -->
		<div class="flex items-center justify-between gap-4 p-6 border-t border-gray-200 dark:border-gray-700">
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
					<Button
						variant="primary"
						size="sm"
						onclick={() => isEditing = true}
					>
						Edit Card
					</Button>
				{/if}
			</div>
		</div>
	</div>
</Modal>