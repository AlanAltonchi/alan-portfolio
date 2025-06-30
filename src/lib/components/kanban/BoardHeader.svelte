<script lang="ts">
	import { kanbanStore } from '$lib/stores/kanban.svelte';
	import type { Board } from '$lib/types/kanban';
	import UserPresence from './UserPresence.svelte';

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

	// Handle click outside to close menu
	$effect(() => {
		if (showMenu) {
			const handleClickOutside = (e: MouseEvent) => {
				const target = e.target as HTMLElement;
				if (!target.closest('.menu-container')) {
					showMenu = false;
				}
			};
			
			document.addEventListener('click', handleClickOutside);
			
			return () => {
				document.removeEventListener('click', handleClickOutside);
			};
		}
	});
</script>

<div
	class="border-b border-gray-200/50 bg-gradient-to-r from-white/95 via-gray-50/95 to-white/95 px-8 py-6 shadow-lg dark:border-gray-700/50 dark:from-gray-900/95 dark:via-gray-800/95 dark:to-gray-900/95"
>
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-6">
			{#if editingTitle}
				<input
					type="text"
					bind:value={titleInput}
					bind:this={titleInputElement}
					onblur={updateTitle}
					onkeydown={handleTitleKeydown}
					class="rounded-xl border border-gray-300 bg-white/80 px-4 py-2 text-3xl font-black backdrop-blur-sm focus:ring-4 focus:ring-blue-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800/80 dark:text-white"
				/>
			{:else}
				<button
					class="group relative text-left text-3xl font-black text-gray-900 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:bg-clip-text hover:text-transparent dark:text-white"
					onclick={() => {
						editingTitle = true;
						titleInput = board.title;
					}}
					aria-label="Edit board title: {board.title}"
				>
					{board.title}
					<div
						class="absolute -bottom-1 left-0 h-1 w-0 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full"
					></div>
				</button>
			{/if}

			{#if board.description}
				<p class="max-w-md text-lg text-gray-600 dark:text-gray-400">
					{board.description}
				</p>
			{/if}
		</div>

		<div class="flex items-center gap-6">
			<!-- User Presence -->
			<UserPresence boardId={board.id} />

			<!-- View mode buttons -->
			<div
				class="flex items-center gap-1 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 p-1.5 shadow-inner dark:from-gray-700 dark:to-gray-800"
			>
				<button
					onclick={() => kanbanStore.setViewMode('board')}
					class="relative rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 {kanbanStore
						.state.viewMode === 'board'
						? 'bg-gradient-to-br from-white to-gray-50 text-blue-600 shadow-lg dark:from-gray-600 dark:to-gray-700 dark:text-blue-400'
						: 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'}"
				>
					<svg
						class="mr-2 inline-block h-4 w-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
						/>
					</svg>
					Board
				</button>
				<button
					onclick={() => kanbanStore.setViewMode('list')}
					class="relative rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 {kanbanStore
						.state.viewMode === 'list'
						? 'bg-gradient-to-br from-white to-gray-50 text-blue-600 shadow-lg dark:from-gray-600 dark:to-gray-700 dark:text-blue-400'
						: 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'} cursor-not-allowed opacity-50"
					disabled
				>
					<svg
						class="mr-2 inline-block h-4 w-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 10h16M4 14h16M4 18h16"
						/>
					</svg>
					List
				</button>
				<button
					onclick={() => kanbanStore.setViewMode('calendar')}
					class="relative rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 {kanbanStore
						.state.viewMode === 'calendar'
						? 'bg-gradient-to-br from-white to-gray-50 text-blue-600 shadow-lg dark:from-gray-600 dark:to-gray-700 dark:text-blue-400'
						: 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'} cursor-not-allowed opacity-50"
					disabled
				>
					<svg
						class="mr-2 inline-block h-4 w-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
					Calendar
				</button>
			</div>

			<!-- Menu button -->
			<div class="relative menu-container">
				<button
					onclick={() => (showMenu = !showMenu)}
					class="group rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 p-3 transition-all duration-200 hover:from-gray-200 hover:to-gray-300 hover:shadow-lg dark:from-gray-700 dark:to-gray-800 dark:hover:from-gray-600 dark:hover:to-gray-700"
					aria-label="Board menu"
					aria-expanded={showMenu}
				>
					<svg
						class="h-5 w-5 text-gray-600 transition-transform duration-200 group-hover:rotate-90 dark:text-gray-300"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"
						/>
					</svg>
				</button>

				{#if showMenu}
					<div
						class="absolute top-12 w-56 overflow-hidden rounded-xl border border-gray-200/50 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/95"
						style="z-index: 9999; animation: slideInUp 0.2s ease-out"
					>
						<button
							onclick={() => {
								showMenu = false;
								alert('Settings coming soon!');
							}}
							class="group flex w-full items-center gap-3 px-5 py-3 text-left text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 dark:text-gray-300 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 dark:hover:text-blue-400"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
							Board Settings
						</button>
						<button
							onclick={() => {
								showMenu = false;
								alert('Members management coming soon!');
							}}
							class="group flex w-full items-center gap-3 px-5 py-3 text-left text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 dark:text-gray-300 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 dark:hover:text-blue-400"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
								/>
							</svg>
							Manage Members
						</button>
						<hr class="my-2 border-gray-200/50 dark:border-gray-700/50" />
						<button
							onclick={() => {
								showMenu = false;
								deleteBoard();
							}}
							class="group flex w-full items-center gap-3 px-5 py-3 text-left text-sm font-medium text-red-600 transition-all duration-200 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-700 dark:text-red-400 dark:hover:from-red-900/20 dark:hover:to-pink-900/20 dark:hover:text-red-300"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
							Delete Board
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
