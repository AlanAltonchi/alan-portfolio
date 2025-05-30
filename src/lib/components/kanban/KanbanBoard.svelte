<script lang="ts">
  import { kanbanStore } from '$lib/stores/kanban.svelte';
  import BoardColumn from './BoardColumn.svelte';
  import BoardHeader from './BoardHeader.svelte';
  import SearchFilter from './SearchFilter.svelte';
  import type { Board } from '$lib/types/kanban';

  interface Props {
    board: Board;
  }

  let { board }: Props = $props();
  
  const state = $derived(kanbanStore.state);
  const columns = $derived(board.columns || []);
</script>

<div class="flex flex-col h-full">
  <BoardHeader {board} />
  
  <!-- Search and Filter Bar -->
  <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
    <SearchFilter boardId={board.id} />
  </div>
  
  <div class="flex-1 overflow-x-auto">
    <div class="flex gap-4 p-4 min-h-full">
      {#each columns as column (column.id)}
        <BoardColumn {column} boardId={board.id} />
      {/each}
      
      <!-- Add column button -->
      <div class="w-80 flex-shrink-0">
        <button
          onclick={() => kanbanStore.createColumn({
            board_id: board.id,
            title: 'New Column'
          })}
          class="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
        >
          <span class="text-gray-500 dark:text-gray-400">+ Add Column</span>
        </button>
      </div>
    </div>
  </div>
</div>