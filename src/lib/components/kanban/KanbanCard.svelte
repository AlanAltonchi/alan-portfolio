<script lang="ts">
	import { kanbanStore } from '$lib/stores/kanban.svelte';
	import type { Card, DragItem } from '$lib/types/kanban';

	interface Props {
		card: Card;
		columnId: string;
		boardId: string;
		index: number;
		onCardClick?: (card: Card) => void;
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

	let { card, columnId, boardId, index, onCardClick }: Props = $props();

	let dragging = $state(false);

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

	function getPriorityStyles(priority?: string | null) {
		switch (priority) {
			case 'urgent':
				return {
					border: 'border-l-4 border-l-red-500',
					bg: 'bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20',
					glow: 'group-hover:shadow-red-200 dark:group-hover:shadow-red-900/50'
				};
			case 'high':
				return {
					border: 'border-l-4 border-l-orange-500',
					bg: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
					glow: 'group-hover:shadow-orange-200 dark:group-hover:shadow-orange-900/50'
				};
			case 'medium':
				return {
					border: 'border-l-4 border-l-yellow-500',
					bg: 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
					glow: 'group-hover:shadow-yellow-200 dark:group-hover:shadow-yellow-900/50'
				};
			case 'low':
				return {
					border: 'border-l-4 border-l-green-500',
					bg: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
					glow: 'group-hover:shadow-green-200 dark:group-hover:shadow-green-900/50'
				};
			default:
				return {
					border: 'border-l-4 border-l-gray-300 dark:border-l-gray-600',
					bg: 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900',
					glow: 'group-hover:shadow-gray-200 dark:group-hover:shadow-gray-700'
				};
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
		if (!dragging) {
			e.preventDefault();
			e.stopPropagation();
			onCardClick?.(card);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onCardClick?.(card);
		}
	}

	// Get priority styles
	const priorityStyles = $derived(getPriorityStyles(card.priority));
</script>

<div
	draggable="true"
	ondragstart={handleDragStart}
	ondragend={handleDragEnd}
	onclick={handleCardClick}
	onkeydown={handleKeydown}
	data-card-id={card.id}
	class="group relative cursor-pointer overflow-hidden rounded-xl {priorityStyles.border} {priorityStyles.bg} p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-2xl {priorityStyles.glow} backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20"
	class:opacity-50={dragging}
	class:shadow-2xl={dragging}
	class:scale-110={dragging}
	class:rotate-3={dragging}
	role="button"
	tabindex="0"
>
	<div class="card-content">
		<!-- Card title -->
		<h4
			class="mb-3 text-lg leading-tight font-bold text-gray-900 transition-colors duration-200 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text dark:text-white"
		>
			{card.title}
		</h4>

		<!-- Card metadata -->
		<div class="mb-3 flex flex-wrap items-center gap-2">
			<!-- Due date -->
			{#if dueDate}
				<span
					class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-sm transition-all duration-200 hover:scale-105 {dueDate.isOverdue ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg' : dueDate.isToday ? 'bg-gradient-to-r from-orange-400 to-amber-400 text-orange-700 dark:text-orange-300' : 'bg-gray-200/80 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300'}"
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
					class="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:shadow-lg"
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
					class="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:shadow-lg"
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
					class="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:shadow-lg"
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
					class="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:shadow-lg"
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
							class="rounded-full px-3 py-1 text-xs font-bold text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg"
							style="background: linear-gradient(135deg, {assignment.card_labels.color}, {assignment.card_labels.color}dd)"
						>
							{assignment.card_labels.name}
						</span>
					{/if}
				{/each}
			</div>
		{/if}
	</div>

	<!-- Hover gradient overlay -->
	<div class="absolute inset-0 -z-10 bg-gradient-to-t from-transparent via-transparent to-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
</div>