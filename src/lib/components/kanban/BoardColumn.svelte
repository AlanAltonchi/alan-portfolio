<script lang="ts">
  import { kanbanStore } from '$lib/stores/kanban.svelte';
  import KanbanCard from './KanbanCard.svelte';
  import type { Column, DragItem } from '$lib/types/kanban';
  
  interface Props {
    column: Column;
    boardId: string;
  }

  let { column, boardId }: Props = $props();
  
  const cards = $derived(column.cards || []);
  let dragOver = $state(false);
  let editingTitle = $state(false);
  let titleInput = $state(column.title);
  
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    dragOver = true;
  }
  
  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
  }
  
  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    
    const data = e.dataTransfer?.getData('application/json');
    if (!data) return;
    
    try {
      const dragItem: DragItem = JSON.parse(data);
      if (dragItem.type !== 'card') return;
      
      // Calculate drop position
      const dropY = e.clientY;
      const target = e.currentTarget as HTMLElement;
      const cardElements = Array.from(target.querySelectorAll('[data-card-id]'));
      let targetIndex = cards.length;
      
      for (let i = 0; i < cardElements.length; i++) {
        const rect = cardElements[i].getBoundingClientRect();
        if (dropY < rect.top + rect.height / 2) {
          targetIndex = i;
          break;
        }
      }
      
      kanbanStore.moveCard({
        cardId: dragItem.cardId,
        sourceColumnId: dragItem.columnId,
        targetColumnId: column.id,
        newPosition: targetIndex
      });
    } catch (err) {
      console.error('Error handling drop:', err);
    }
  }
  
  async function updateTitle() {
    if (titleInput.trim() && titleInput !== column.title) {
      await kanbanStore.updateColumn(column.id, { title: titleInput.trim() });
    }
    editingTitle = false;
  }
  
  function handleTitleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      updateTitle();
    } else if (e.key === 'Escape') {
      titleInput = column.title;
      editingTitle = false;
    }
  }
</script>

<div
  class="w-80 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex flex-col max-h-full"
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  class:ring-2={dragOver}
  class:ring-blue-500={dragOver}
>
  <!-- Column header -->
  <div class="flex items-center justify-between mb-4">
    {#if editingTitle}
      <input
        type="text"
        bind:value={titleInput}
        onblur={updateTitle}
        onkeydown={handleTitleKeydown}
        class="flex-1 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        autofocus
      />
    {:else}
      <h3
        class="font-semibold text-gray-900 dark:text-white cursor-pointer"
        onclick={() => {
          editingTitle = true;
          titleInput = column.title;
        }}
      >
        {column.title}
      </h3>
    {/if}
    
    <span class="text-sm text-gray-500 dark:text-gray-400 ml-2">
      {cards.length}
    </span>
  </div>
  
  <!-- Cards container -->
  <div class="flex-1 overflow-y-auto space-y-2">
    {#each cards as card, index (card.id)}
      <KanbanCard {card} columnId={column.id} {boardId} {index} />
    {/each}
  </div>
  
  <!-- Add card button -->
  <button
    onclick={() => {
      const title = prompt('Card title:');
      if (title?.trim()) {
        kanbanStore.createCard({
          title: title.trim(),
          column_id: column.id,
          board_id: boardId
        });
      }
    }}
    class="mt-4 w-full p-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
  >
    + Add Card
  </button>
</div>