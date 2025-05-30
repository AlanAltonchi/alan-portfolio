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
    if (confirm(`Are you sure you want to delete "${board.title}"? This action cannot be undone.`)) {
      await kanbanStore.deleteBoard(board.id);
      window.location.href = '/kanban';
    }
  }
</script>

<div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      {#if editingTitle}
        <input
          type="text"
          bind:value={titleInput}
          onblur={updateTitle}
          onkeydown={handleTitleKeydown}
          class="text-2xl font-bold px-2 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          autofocus
        />
      {:else}
        <h1
          class="text-2xl font-bold text-gray-900 dark:text-white cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
          onclick={() => {
            editingTitle = true;
            titleInput = board.title;
          }}
        >
          {board.title}
        </h1>
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
      <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded p-1">
        <button
          onclick={() => kanbanStore.setViewMode('board')}
          class="px-3 py-1 text-sm rounded {kanbanStore.state.viewMode === 'board' ? 'bg-white dark:bg-gray-600 shadow' : ''}"
        >
          Board
        </button>
        <button
          onclick={() => kanbanStore.setViewMode('list')}
          class="px-3 py-1 text-sm rounded {kanbanStore.state.viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow' : ''}"
          disabled
        >
          List
        </button>
        <button
          onclick={() => kanbanStore.setViewMode('calendar')}
          class="px-3 py-1 text-sm rounded {kanbanStore.state.viewMode === 'calendar' ? 'bg-white dark:bg-gray-600 shadow' : ''}"
          disabled
        >
          Calendar
        </button>
      </div>
      
      <!-- Menu button -->
      <div class="relative">
        <button
          onclick={() => showMenu = !showMenu}
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        </button>
        
        {#if showMenu}
          <div class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
            <button
              onclick={() => {
                showMenu = false;
                alert('Settings coming soon!');
              }}
              class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Board Settings
            </button>
            <button
              onclick={() => {
                showMenu = false;
                alert('Members management coming soon!');
              }}
              class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Manage Members
            </button>
            <hr class="my-1 border-gray-200 dark:border-gray-700" />
            <button
              onclick={() => {
                showMenu = false;
                deleteBoard();
              }}
              class="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Delete Board
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>