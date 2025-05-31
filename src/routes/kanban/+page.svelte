<script lang="ts">
	import { onMount } from 'svelte';
	import { kanbanStore } from '$lib/stores/kanban.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const kanbanState = $derived(kanbanStore.state);
	const user = $derived(authStore.user);

	let newBoardTitle = $state('');
	let newBoardDescription = $state('');
	let creating = $state(false);

	onMount(() => {
		// Use currentUserId from server data to ensure we have the user ID
		if (data.currentUserId) {
			kanbanStore.loadBoards();
		}
	});

	async function createBoard() {
		if (!newBoardTitle.trim()) return;

		creating = true;
		try {
			const board = await kanbanStore.createBoard({
				title: newBoardTitle.trim(),
				description: newBoardDescription.trim() || undefined
			});

			// Navigate to the new board
			goto(`/kanban/${board.id}`);
		} catch (err) {
			console.error('Error creating board:', err);
		} finally {
			creating = false;
			newBoardTitle = '';
			newBoardDescription = '';
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mb-12">
		<h1 class="mb-6 text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Kanban Boards</h1>
		<p class="text-lg text-gray-600 dark:text-gray-400">Organize your work with beautiful visual task boards</p>
	</div>

	{#if !user}
		<Card>
			<div class="py-8 text-center">
				<p class="mb-4 text-gray-600 dark:text-gray-400">
					Please sign in to create and manage kanban boards
				</p>
				<a href="/auth/login">
					<Button>Sign In</Button>
				</a>
			</div>
		</Card>
	{:else if kanbanState.loading}
		<div class="flex justify-center py-12">
			<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
		</div>
	{:else if kanbanState.error}
		<Card>
			<div class="py-8 text-center">
				<p class="text-red-600 dark:text-red-400">{kanbanState.error}</p>
			</div>
		</Card>
	{:else}
		<!-- Create new board form -->
		<div class="mb-12 rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 p-8 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl">
			<h2 class="mb-6 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Create New Board</h2>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					createBoard();
				}}
			>
				<div class="space-y-4">
					<div>
						<label for="board-title" class="mb-2 block text-sm font-medium"> Board Title </label>
						<input
							id="board-title"
							type="text"
							bind:value={newBoardTitle}
							placeholder="e.g., Project Tasks, Personal Goals"
							class="w-full rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm px-4 py-3 text-gray-900 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white"
							required
						/>
					</div>
					<div>
						<label for="board-description" class="mb-2 block text-sm font-medium">
							Description (optional)
						</label>
						<textarea
							id="board-description"
							bind:value={newBoardDescription}
							placeholder="What is this board for?"
							rows="2"
							class="w-full rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm px-4 py-3 text-gray-900 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-white"
						></textarea>
					</div>
					<Button type="submit" disabled={creating || !newBoardTitle.trim()}>
						{creating ? 'Creating...' : 'Create Board'}
					</Button>
				</div>
			</form>
		</div>

		<!-- Boards list -->
		{#if kanbanState.boards.length === 0}
			<Card>
				<div class="py-8 text-center">
					<p class="text-gray-600 dark:text-gray-400">
						No boards yet. Create your first board above!
					</p>
				</div>
			</Card>
		{:else}
			<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
				{#each kanbanState.boards as board, index (board.id)}
					<a 
						href="/kanban/{board.id}" 
						class="group relative block transform transition-all duration-300 hover:-translate-y-2 hover:scale-105"
						style="animation: slideInUp 0.5s ease-out {index * 0.1}s both"
					>
						<div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 blur-xl"></div>
						<div class="relative rounded-2xl border border-gray-200/50 bg-white/80 backdrop-blur-sm p-6 shadow-lg transition-all duration-300 group-hover:border-transparent group-hover:shadow-2xl dark:border-gray-700/50 dark:bg-gray-800/80">
							<div class="mb-4 flex items-start justify-between">
								<div class="flex-1">
									<h3 class="mb-2 text-xl font-bold text-gray-900 transition-colors duration-300 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent dark:text-white">{board.title}</h3>
									{#if board.description}
										<p class="text-sm text-gray-600 line-clamp-2 dark:text-gray-400">
											{board.description}
										</p>
									{/if}
								</div>
								<div class="ml-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-3 opacity-60 transition-opacity duration-300 group-hover:opacity-100">
									<svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
									</svg>
								</div>
							</div>
							<div class="mt-6 flex items-center justify-between">
								<span class="text-xs font-medium text-gray-500 dark:text-gray-400">
									Created {new Date(board.created_at).toLocaleDateString()}
								</span>
								<div class="flex items-center gap-2">
									<div class="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
									<span class="text-xs font-medium text-green-600 dark:text-green-400">Active</span>
								</div>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	{/if}
</div>
