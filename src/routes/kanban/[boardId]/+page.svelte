<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { kanbanStore } from '$lib/stores/kanban.svelte';
  import { authStore } from '$lib/stores/auth.svelte';
  import KanbanBoard from '$lib/components/kanban/KanbanBoard.svelte';

  const boardId = $derived($page.params.boardId);
  const state = $derived(kanbanStore.state);
  const user = $derived(authStore.user);
  
  onMount(() => {
    if (user && boardId) {
      kanbanStore.loadBoard(boardId);
    }
  });
  
  onDestroy(() => {
    kanbanStore.cleanup();
  });
</script>

<div class="h-screen flex flex-col">
  {#if !user}
    <div class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Please sign in to view this board
        </p>
        <a href="/auth/login" class="text-blue-600 hover:underline">
          Sign In
        </a>
      </div>
    </div>
  {:else if state.loading}
    <div class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  {:else if state.error}
    <div class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <p class="text-red-600 dark:text-red-400 mb-4">{state.error}</p>
        <a href="/kanban" class="text-blue-600 hover:underline">
          Back to Boards
        </a>
      </div>
    </div>
  {:else if state.currentBoard}
    <KanbanBoard board={state.currentBoard} />
  {:else}
    <div class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Board not found
        </p>
        <a href="/kanban" class="text-blue-600 hover:underline">
          Back to Boards
        </a>
      </div>
    </div>
  {/if}
</div>