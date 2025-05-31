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
	<div class="mb-8">
		<h1 class="mb-4 text-3xl font-bold text-gray-900 dark:text-white">Kanban Boards</h1>
		<p class="text-gray-600 dark:text-gray-400">Organize your work with visual task boards</p>
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
		<Card class="mb-8">
			<h2 class="mb-4 text-lg font-semibold">Create New Board</h2>
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
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
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
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
						></textarea>
					</div>
					<Button type="submit" disabled={creating || !newBoardTitle.trim()}>
						{creating ? 'Creating...' : 'Create Board'}
					</Button>
				</div>
			</form>
		</Card>

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
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each kanbanState.boards as board (board.id)}
					<a href="/kanban/{board.id}" class="block transition-shadow hover:shadow-lg">
						<Card>
							<h3 class="mb-2 text-lg font-semibold">{board.title}</h3>
							{#if board.description}
								<p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
									{board.description}
								</p>
							{/if}
							<div
								class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
							>
								<span>
									{new Date(board.created_at).toLocaleDateString()}
								</span>
							</div>
						</Card>
					</a>
				{/each}
			</div>
		{/if}
	{/if}
</div>
