<script lang="ts">
  import { onMount } from 'svelte';
  import { kanbanStore } from '$lib/stores/kanban.svelte';
  import { authStore } from '$lib/stores/auth.svelte';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/Button.svelte';
  import Card from '$lib/components/Card.svelte';

  const state = $derived(kanbanStore.state);
  const user = $derived(authStore.user);
  
  let newBoardTitle = $state('');
  let newBoardDescription = $state('');
  let creating = $state(false);
  
  onMount(() => {
    if (user) {
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
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Kanban Boards</h1>
    <p class="text-gray-600 dark:text-gray-400">
      Organize your work with visual task boards
    </p>
  </div>
  
  {#if !user}
    <Card>
      <div class="text-center py-8">
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Please sign in to create and manage kanban boards
        </p>
        <a href="/auth/login">
          <Button>Sign In</Button>
        </a>
      </div>
    </Card>
  {:else if state.loading}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  {:else if state.error}
    <Card>
      <div class="text-center py-8">
        <p class="text-red-600 dark:text-red-400">{state.error}</p>
      </div>
    </Card>
  {:else}
    <!-- Create new board form -->
    <Card class="mb-8">
      <h2 class="text-lg font-semibold mb-4">Create New Board</h2>
      <form onsubmit={(e) => {e.preventDefault(); createBoard();}}>
        <div class="space-y-4">
          <div>
            <label for="board-title" class="block text-sm font-medium mb-2">
              Board Title
            </label>
            <input
              id="board-title"
              type="text"
              bind:value={newBoardTitle}
              placeholder="e.g., Project Tasks, Personal Goals"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              required
            />
          </div>
          <div>
            <label for="board-description" class="block text-sm font-medium mb-2">
              Description (optional)
            </label>
            <textarea
              id="board-description"
              bind:value={newBoardDescription}
              placeholder="What is this board for?"
              rows="2"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
            />
          </div>
          <Button type="submit" disabled={creating || !newBoardTitle.trim()}>
            {creating ? 'Creating...' : 'Create Board'}
          </Button>
        </div>
      </form>
    </Card>
    
    <!-- Boards list -->
    {#if state.boards.length === 0}
      <Card>
        <div class="text-center py-8">
          <p class="text-gray-600 dark:text-gray-400">
            No boards yet. Create your first board above!
          </p>
        </div>
      </Card>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each state.boards as board}
          <a
            href="/kanban/{board.id}"
            class="block hover:shadow-lg transition-shadow"
          >
            <Card>
              <h3 class="text-lg font-semibold mb-2">{board.title}</h3>
              {#if board.description}
                <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {board.description}
                </p>
              {/if}
              <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
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