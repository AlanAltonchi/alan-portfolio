import { supabase } from '$lib/db.svelte';
import { getSubscriptionManager } from '$lib/utils/subscription-manager';
import type {
  Board,
  Card,
  CreateBoardInput,
  UpdateBoardInput,
  CreateColumnInput,
  UpdateColumnInput,
  CreateCardInput,
  UpdateCardInput,
  MoveCardInput,
  FilterState,
  ViewMode,
  DragItem,
  KanbanState,
  User
} from '$lib/types/kanban';
import type { RealtimeChannel } from '@supabase/supabase-js';

class KanbanStore {
  private boards = $state<Board[]>([]);
  private currentBoard = $state<Board | null>(null);
  private currentCard = $state<Card | null>(null);
  private loading = $state(false);
  private error = $state<string | null>(null);
  private filters = $state<FilterState>({
    search: '',
    searchQuery: '',
    labels: [],
    assignees: [],
    priority: [],
    priorities: [],
    hasDueDate: null,
    isOverdue: null,
    dueDate: ''
  });
  private viewMode = $state<ViewMode>('board');
  private draggedItem = $state<DragItem | null>(null);
  private activeUsers = $state<Map<string, User>>(new Map());
  private boardChannel: RealtimeChannel | null = null;
  private subscriptionManager = getSubscriptionManager(supabase);

  get state(): KanbanState {
    return {
      boards: this.boards,
      currentBoard: this.currentBoard,
      currentCard: this.currentCard,
      loading: this.loading,
      error: this.error,
      filters: this.filters,
      viewMode: this.viewMode,
      draggedItem: this.draggedItem,
      activeUsers: this.activeUsers
    };
  }

  get filterState() {
    return this.filters;
  }

  // Board operations
  async loadBoards() {
    this.loading = true;
    this.error = null;

    try {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.boards = (data || []) as unknown as Board[];
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load boards';
      console.error('Error loading boards:', err);
    } finally {
      this.loading = false;
    }
  }

  async loadBoard(boardId: string) {
    this.loading = true;
    this.error = null;

    try {
      // Load board
      const { data: board, error: boardError } = await supabase
        .from('boards')
        .select('*')
        .eq('id', boardId)
        .single();

      if (boardError) throw boardError;

      // Load columns separately
      const { data: columns, error: columnsError } = await supabase
        .from('columns')
        .select(`
          *,
          cards(*)
        `)
        .eq('board_id', boardId)
        .order('position');

      if (columnsError) throw columnsError;

      // Create a properly typed board object
      const typedBoard: Board = {
        ...board,
        columns: columns || []
      };

      // Sort columns and cards by position
      if (typedBoard.columns) {
        typedBoard.columns.sort((a: any, b: any) => a.position - b.position);
        typedBoard.columns.forEach((column: any) => {
          if (column.cards) {
            column.cards.sort((a: any, b: any) => a.position - b.position);
          }
        });
      }

      this.currentBoard = typedBoard;
      this.setupRealtimeSubscription(boardId);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load board';
      console.error('Error loading board:', err);
    } finally {
      this.loading = false;
    }
  }

  async createBoard(input: CreateBoardInput) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('boards')
        .insert({
          ...input,
          user_id: user.user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Create default columns
      const defaultColumns = ['To Do', 'In Progress', 'Done'];
      await Promise.all(
        defaultColumns.map((title, index) =>
          this.createColumn({
            board_id: data.id,
            title,
            position: index
          })
        )
      );

      // Track activity
      await this.trackActivity(data.id, 'board_created', {
        board_title: data.title,
        board_description: data.description
      });

      await this.loadBoards();
      return data;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to create board';
      console.error('Error creating board:', err);
      throw err;
    }
  }

  async updateBoard(boardId: string, input: UpdateBoardInput) {
    try {
      const { error } = await supabase
        .from('boards')
        .update(input)
        .eq('id', boardId);

      if (error) throw error;

      if (this.currentBoard?.id === boardId) {
        await this.loadBoard(boardId);
      }
      await this.loadBoards();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to update board';
      console.error('Error updating board:', err);
      throw err;
    }
  }

  async deleteBoard(boardId: string) {
    try {
      const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', boardId);

      if (error) throw error;

      if (this.currentBoard?.id === boardId) {
        this.currentBoard = null;
      }
      await this.loadBoards();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to delete board';
      console.error('Error deleting board:', err);
      throw err;
    }
  }

  // Column operations
  async createColumn(input: CreateColumnInput) {
    try {
      // Ensure position is defined
      let position = input.position;
      if (position === undefined) {
        const { data: columns } = await supabase
          .from('columns')
          .select('position')
          .eq('board_id', input.board_id)
          .order('position', { ascending: false })
          .limit(1);

        position = columns && columns.length > 0 ? columns[0].position + 1 : 0;
      }

      const { data, error } = await supabase
        .from('columns')
        .insert({
          title: input.title,
          board_id: input.board_id,
          position: position
        })
        .select()
        .single();

      if (error) throw error;

      if (this.currentBoard?.id === input.board_id) {
        await this.loadBoard(input.board_id);
      }
      return data;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to create column';
      console.error('Error creating column:', err);
      throw err;
    }
  }

  async updateColumn(columnId: string, input: UpdateColumnInput) {
    try {
      const { error } = await supabase
        .from('columns')
        .update(input)
        .eq('id', columnId);

      if (error) throw error;

      if (this.currentBoard) {
        await this.loadBoard(this.currentBoard.id);
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to update column';
      console.error('Error updating column:', err);
      throw err;
    }
  }

  async deleteColumn(columnId: string) {
    try {
      const { error } = await supabase
        .from('columns')
        .delete()
        .eq('id', columnId);

      if (error) throw error;

      if (this.currentBoard) {
        await this.loadBoard(this.currentBoard.id);
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to delete column';
      console.error('Error deleting column:', err);
      throw err;
    }
  }

  // Card operations
  async createCard(input: CreateCardInput) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Ensure position is defined
      let position = input.position;
      if (position === undefined) {
        const { data: cards } = await supabase
          .from('cards')
          .select('position')
          .eq('column_id', input.column_id)
          .order('position', { ascending: false })
          .limit(1);

        position = cards && cards.length > 0 ? cards[0].position + 1 : 0;
      }

      const { data, error } = await supabase
        .from('cards')
        .insert({
          title: input.title,
          description: input.description || null,
          column_id: input.column_id,
          board_id: input.board_id,
          position: position,
          priority: input.priority || null,
          due_date: input.due_date || null,
          created_by: user.user.id
        })
        .select()
        .single();

      if (error) throw error;

      if (this.currentBoard?.id === input.board_id) {
        await this.loadBoard(input.board_id);
      }
      return data;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to create card';
      console.error('Error creating card:', err);
      throw err;
    }
  }

  async updateCard(cardId: string, input: UpdateCardInput) {
    try {
      const { error } = await supabase
        .from('cards')
        .update(input)
        .eq('id', cardId);

      if (error) throw error;

      if (this.currentBoard) {
        await this.loadBoard(this.currentBoard.id);
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to update card';
      console.error('Error updating card:', err);
      throw err;
    }
  }

  async deleteCard(cardId: string) {
    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;

      if (this.currentBoard) {
        await this.loadBoard(this.currentBoard.id);
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to delete card';
      console.error('Error deleting card:', err);
      throw err;
    }
  }

  async moveCard({ cardId, sourceColumnId, targetColumnId, newPosition }: MoveCardInput) {
    try {
      // If moving within the same column, just update position
      if (sourceColumnId === targetColumnId) {
        await this.updateCard(cardId, { position: newPosition });
        return;
      }

      // Moving to a different column
      await this.updateCard(cardId, {
        column_id: targetColumnId,
        position: newPosition
      });

      // Reorder cards in both columns
      await this.reorderCards(sourceColumnId);
      await this.reorderCards(targetColumnId);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to move card';
      console.error('Error moving card:', err);
      throw err;
    }
  }

  private async reorderCards(columnId: string) {
    try {
      const { data: cards, error } = await supabase
        .from('cards')
        .select('id, position')
        .eq('column_id', columnId)
        .order('position');

      if (error) throw error;

      // Update positions to be sequential
      await Promise.all(
        cards.map((card, index) =>
          supabase
            .from('cards')
            .update({ position: index })
            .eq('id', card.id)
        )
      );
    } catch (err) {
      console.error('Error reordering cards:', err);
    }
  }

  // Drag and drop
  setDraggedItem(item: DragItem | null) {
    this.draggedItem = item;
  }

  // Filters and view
  setFilters(filters: Partial<FilterState>) {
    this.filters = { ...this.filters, ...filters };
  }

  clearFilters() {
    this.filters = {
      search: '',
      searchQuery: '',
      labels: [],
      assignees: [],
      priority: [],
      priorities: [],
      hasDueDate: null,
      isOverdue: null,
      dueDate: ''
    };
  }

  setViewMode(mode: ViewMode) {
    this.viewMode = mode;
  }

  // Activity tracking
  private async trackActivity(boardId: string, action: string, details: any) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      await supabase
        .from('board_activities')
        .insert({
          board_id: boardId,
          user_id: user.user.id,
          action,
          details,
          created_at: new Date().toISOString()
        });
    } catch (err) {
      console.error('Error tracking activity:', err);
    }
  }

  // Real-time subscriptions with granular updates
  private setupRealtimeSubscription(boardId: string) {
    // Clean up existing subscription
    if (this.boardChannel) {
      this.subscriptionManager.removeSubscription(this.boardChannel);
    }

    this.boardChannel = supabase
      .channel(`board:${boardId}`)
      // Listen to board changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'boards',
          filter: `id=eq.${boardId}`
        },
        (payload) => this.handleBoardChange(payload)
      )
      // Listen to column changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'columns',
          filter: `board_id=eq.${boardId}`
        },
        (payload) => this.handleColumnChange(payload)
      )
      // Listen to card changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cards',
          filter: `board_id=eq.${boardId}`
        },
        (payload) => this.handleCardChange(payload)
      )
      // Listen to activity changes
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'board_activities',
          filter: `board_id=eq.${boardId}`
        },
        (payload) => this.handleActivityChange(payload)
      )
      .subscribe();

    this.subscriptionManager.addSubscription(this.boardChannel);
  }

  private handleBoardChange(payload: any) {
    console.log('Board change:', payload);
    if (this.currentBoard?.id === payload.new?.id || this.currentBoard?.id === payload.old?.id) {
      // Reload board data for board changes
      this.loadBoard(this.currentBoard.id);
    }
  }

  private handleColumnChange(payload: any) {
    console.log('Column change:', payload);
    if (this.currentBoard) {
      // Reload board to get updated columns
      this.loadBoard(this.currentBoard.id);
    }
  }

  private handleCardChange(payload: any) {
    console.log('Card change:', payload);
    if (this.currentBoard) {
      // For card changes, we can be more specific
      if (payload.eventType === 'INSERT') {
        // New card added
        this.loadBoard(this.currentBoard.id);
      } else if (payload.eventType === 'UPDATE') {
        // Card updated - reload to get fresh data
        this.loadBoard(this.currentBoard.id);
      } else if (payload.eventType === 'DELETE') {
        // Card deleted
        this.loadBoard(this.currentBoard.id);
      }
    }
  }

  private handleActivityChange(payload: any) {
    console.log('New activity:', payload);
    // Activity changes can trigger UI notifications or activity feed updates
    // This will be handled by the ActivityFeed component
  }

  // Cleanup
  cleanup() {
    if (this.boardChannel) {
      this.subscriptionManager.removeSubscription(this.boardChannel);
      this.boardChannel = null;
    }
    this.reset();
  }

  private reset() {
    this.boards = [];
    this.currentBoard = null;
    this.currentCard = null;
    this.loading = false;
    this.error = null;
    this.filters = {
      search: '',
      searchQuery: '',
      labels: [],
      assignees: [],
      priority: [],
      priorities: [],
      hasDueDate: null,
      isOverdue: null,
      dueDate: ''
    };
    this.viewMode = 'board';
    this.draggedItem = null;
    this.activeUsers.clear();
  }
}

export const kanbanStore = new KanbanStore();