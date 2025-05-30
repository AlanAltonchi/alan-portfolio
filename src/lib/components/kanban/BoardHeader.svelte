<script lang="ts">
	import { kanbanStore } from '$lib/stores/kanban.svelte';
	import UserPresence from './UserPresence.svelte';
	import type { Board } from '$lib/types/kanban';

	interface Props {
		board: Board;
	}

	let { board }: Props = $props();

	let editingTitle = $state(false);
	let titleInput = $state(board.title);
	let showMenu = $state(false);
	let titleInputElement = $state<HTMLInputElement>();

	async function updateTitle() {
		if (titleInput.trim() && titleInput !== board.title) {
			await kanbanStore.updateBoard(board.id, { title: titleInput.trim() });
		}
		editingTitle = false;
	}

	function handleTitleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			updateTitle();
		} else if (e.key === 'Escape') {
			titleInput = board.title;
			editingTitle = false;
		}
	}

	async function deleteBoard() {
		if (
			confirm(`Are you sure you want to delete "${board.title}"? This action cannot be undone.`)
		) {
			await kanbanStore.deleteBoard(board.id);
			window.location.href = '/kanban';
		}
	}

	// Focus the input when editing begins
	$effect(() => {
		if (editingTitle && titleInputElement) {
			titleInputElement.focus();
			titleInputElement.select();
		}
	});
</script>

<div class="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			{#if editingTitle}
				<input
					type="text"
					bind:value={titleInput}
					bind:this={titleInputElement}
					onblur={updateTitle}
					onkeydown={handleTitleKeydown}
					class="rounded border border-gray-300 bg-gray-50 px-2 py-1 text-2xl font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
				/>
			{:else}
				<button
					class="text-left text-2xl font-bold text-gray-900 hover:text-gray-700 dark:text-white dark:hover:text-gray-300"
					onclick={() => {
						editingTitle = true;
						titleInput = board.title;
					}}
					aria-label="Edit board title: {board.title}"
				>
					{board.title}
				</button>
			{/if}

			{#if board.description}
				<p class="text-gray-600 dark:text-gray-400">
					{board.description}
				</p>
			{/if}
		</div>

		<div class="flex items-center gap-4">
			<!-- User Presence -->
			<UserPresence boardId={board.id} />

			<!-- View mode buttons -->
			<div class="flex items-center gap-1 rounded bg-gray-100 p-1 dark:bg-gray-700">
				<button
					onclick={() => kanbanStore.setViewMode('board')}
					class="rounded px-3 py-1 text-sm {kanbanStore.state.viewMode === 'board'
						? 'bg-white shadow dark:bg-gray-600'
						: ''}"
				>
					Board
				</button>
				<button
					onclick={() => kanbanStore.setViewMode('list')}
					class="rounded px-3 py-1 text-sm {kanbanStore.state.viewMode === 'list'
						? 'bg-white shadow dark:bg-gray-600'
						: ''}"
					disabled
				>
					List
				</button>
				<button
					onclick={() => kanbanStore.setViewMode('calendar')}
					class="rounded px-3 py-1 text-sm {kanbanStore.state.viewMode === 'calendar'
						? 'bg-white shadow dark:bg-gray-600'
						: ''}"
					disabled
				>
					Calendar
				</button>
			</div>

			<!-- Menu button -->
			<div class="relative">
				<button
					onclick={() => (showMenu = !showMenu)}
					class="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
					aria-label="Board menu"
					aria-expanded={showMenu}
				>
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
						<path
							d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"
						/>
					</svg>
				</button>

				{#if showMenu}
					<div
						class="absolute right-0 z-10 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
					>
						<button
							onclick={() => {
								showMenu = false;
								alert('Settings coming soon!');
							}}
							class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
						>
							Board Settings
						</button>
						<button
							onclick={() => {
								showMenu = false;
								alert('Members management coming soon!');
							}}
							class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
						>
							Manage Members
						</button>
						<hr class="my-1 border-gray-200 dark:border-gray-700" />
						<button
							onclick={() => {
								showMenu = false;
								deleteBoard();
							}}
							class="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
						>
							Delete Board
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
