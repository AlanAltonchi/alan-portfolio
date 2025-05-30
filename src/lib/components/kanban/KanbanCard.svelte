<script lang="ts">
	import { kanbanStore } from '$lib/stores/kanban.svelte';
	import CardModal from './CardModal.svelte';
	import type { Card, DragItem } from '$lib/types/kanban';

	interface Props {
		card: Card;
		columnId: string;
		boardId: string;
		index: number;
	}

	interface CardLabelAssignment {
		card_id: string;
		label_id: string;
		assigned_at: string;
		card_labels?: {
			id: string;
			name: string;
			color: string;
			board_id: string;
			created_at: string;
		};
	}

	let { card, columnId, boardId, index }: Props = $props();

	let dragging = $state(false);
	let showModal = $state(false);

	function handleDragStart(e: DragEvent) {
		dragging = true;

		const dragItem: DragItem = {
			type: 'card',
			cardId: card.id,
			columnId,
			boardId,
			index
		};

		e.dataTransfer!.effectAllowed = 'move';
		e.dataTransfer!.setData('application/json', JSON.stringify(dragItem));

		kanbanStore.setDraggedItem(dragItem);
	}

	function handleDragEnd() {
		dragging = false;
		kanbanStore.setDraggedItem(null);
	}

	function getPriorityColor(priority?: string | null) {
		switch (priority) {
			case 'urgent':
				return 'border-red-500 bg-red-50 dark:bg-red-900/10';
			case 'high':
				return 'border-orange-500 bg-orange-50 dark:bg-orange-900/10';
			case 'medium':
				return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
			case 'low':
				return 'border-green-500 bg-green-50 dark:bg-green-900/10';
			default:
				return 'border-gray-200 dark:border-gray-600';
		}
	}

	function formatDueDate(date?: string | null) {
		if (!date) return null;
		const due = new Date(date);
		const now = new Date();
		const isOverdue = due < now;
		const isToday = due.toDateString() === now.toDateString();

		return {
			text: due.toLocaleDateString(),
			isOverdue,
			isToday
		};
	}

	const dueDate = $derived(formatDueDate(card.due_date));
	const assigneeCount = $derived(card.assignees?.length || 0);
	const labelAssignments = $derived((card.card_label_assignments as CardLabelAssignment[]) || []);
	const hasAttachments = $derived((card.attachments?.length || 0) > 0);
	const hasComments = $derived((card.comments?.length || 0) > 0);
	const checklistProgress = $derived(() => {
		if (!card.checklists?.length) return null;
		const total = card.checklists.reduce((sum, cl) => sum + (cl.items?.length || 0), 0);
		const completed = card.checklists.reduce(
			(sum, cl) => sum + (cl.items?.filter((item) => item.is_completed).length || 0),
			0
		);
		return { total, completed };
	});

	function handleCardClick(e: MouseEvent) {
		// Prevent opening modal when dragging
		if (
			(!dragging && e.target === e.currentTarget) ||
			(e.target as HTMLElement).closest('.card-content')
		) {
			showModal = true;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			showModal = true;
		}
	}
</script>

<div
	draggable="true"
	ondragstart={handleDragStart}
	ondragend={handleDragEnd}
	onclick={handleCardClick}
	onkeydown={handleKeydown}
	data-card-id={card.id}
	class="group cursor-move rounded-xl border-l-4 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:bg-gray-700 {getPriorityColor(
		card.priority
	)}"
	class:opacity-50={dragging}
	class:shadow-xl={dragging}
	class:scale-105={dragging}
	role="button"
	tabindex="0"
>
	<div class="card-content">
		<!-- Card title -->
		<h4
			class="mb-3 leading-tight font-semibold text-gray-900 transition-colors group-hover:text-gray-700 dark:text-white dark:group-hover:text-gray-100"
		>
			{card.title}
		</h4>

		<!-- Card metadata -->
		<div class="mb-3 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
			<!-- Due date -->
			{#if dueDate}
				<span
					class="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium"
					class:text-red-600={dueDate.isOverdue}
					class:bg-red-100={dueDate.isOverdue}
					class:dark:bg-red-900={dueDate.isOverdue}
					class:text-orange-600={dueDate.isToday}
					class:bg-orange-100={dueDate.isToday}
					class:dark:bg-orange-900={dueDate.isToday}
					class:text-gray-600={!dueDate.isOverdue && !dueDate.isToday}
					class:bg-gray-100={!dueDate.isOverdue && !dueDate.isToday}
					class:dark:bg-gray-700={!dueDate.isOverdue && !dueDate.isToday}
				>
					<svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 8h12v8H4V8z"
							clip-rule="evenodd"
						/>
					</svg>
					{dueDate.text}
				</span>
			{/if}

			<!-- Assignees -->
			{#if assigneeCount > 0}
				<span
					class="flex items-center gap-1.5 rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-600 dark:bg-blue-900 dark:text-blue-400"
				>
					<svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
							clip-rule="evenodd"
						/>
					</svg>
					{assigneeCount}
				</span>
			{/if}

			<!-- Comments -->
			{#if hasComments}
				<span
					class="flex items-center gap-1.5 rounded-md bg-purple-100 px-2 py-1 text-xs font-medium text-purple-600 dark:bg-purple-900 dark:text-purple-400"
				>
					<svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
							clip-rule="evenodd"
						/>
					</svg>
					{card.comments?.length || 0}
				</span>
			{/if}

			<!-- Attachments -->
			{#if hasAttachments}
				<span
					class="flex items-center gap-1.5 rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-600 dark:bg-green-900 dark:text-green-400"
				>
					<svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
							clip-rule="evenodd"
						/>
					</svg>
					{card.attachments?.length || 0}
				</span>
			{/if}

			<!-- Checklist progress -->
			{#if checklistProgress()}
				{@const progress = checklistProgress()}
				<span
					class="flex items-center gap-1.5 rounded-md bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400"
				>
					<svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z"
							clip-rule="evenodd"
						/>
					</svg>
					{progress?.completed}/{progress?.total}
				</span>
			{/if}
		</div>

		<!-- Labels -->
		{#if labelAssignments.length > 0}
			<div class="flex flex-wrap gap-1.5">
				{#each labelAssignments as assignment (assignment.label_id)}
					{#if assignment.card_labels}
						<span
							class="rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-sm"
							style="background-color: {assignment.card_labels.color}"
						>
							{assignment.card_labels.name}
						</span>
					{/if}
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Card Modal -->
<CardModal {card} isOpen={showModal} onClose={() => (showModal = false)} />
