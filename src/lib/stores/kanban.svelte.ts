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

// Custom deep copy function for board state (only copies essential properties)
function deepCopyBoardState(board: Board): Board {
  return {
    ...board,
    columns: board.columns?.map(column => ({
      ...column,
      cards: column.cards?.map(card => ({
        ...card
      })) || []
    })) || []
  };
}

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
  
  // Optimistic updates management
  private optimisticUpdates = $state<Map<string, any>>(new Map());
  private rollbackQueue = $state<Array<() => void>>([]);

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
          cards(
            *,
            card_label_assignments(
              *,
              card_labels(*)
            )
          )
        `)
        .eq('board_id', boardId)
        .order('position');

      if (columnsError) throw columnsError;

      // Create a properly typed board object
      const typedBoard: Board = {
        ...board,
        columns: columns || []
      };

      // Sort columns and cards by position, and add column info to each card
      if (typedBoard.columns) {
        typedBoard.columns.sort((a: any, b: any) => a.position - b.position);
        typedBoard.columns.forEach((column: any) => {
          if (column.cards) {
            column.cards.sort((a: any, b: any) => a.position - b.position);
            // Add column information to each card
            column.cards.forEach((card: any) => {
              card.column = {
                id: column.id,
                title: column.title
              };
            });
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

      // Track activity
      await this.trackActivity(boardId, 'board_updated', {
        changes: input
      });

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
    if (!this.currentBoard) return;
    
    const originalBoard = deepCopyBoardState(this.currentBoard);
    const tempId = `temp-col-${Date.now()}`;
    
    return this.withOptimisticUpdate(
      // Optimistic update - add column immediately
      () => {
        if (!this.currentBoard) return;
        
        const position = input.position ?? (this.currentBoard.columns?.length || 0);
        
        const tempColumn: any = {
          id: tempId,
          title: input.title,
          board_id: input.board_id,
          position,
          cards: [],
          created_at: new Date().toISOString()
        };
        
        if (!this.currentBoard.columns) this.currentBoard.columns = [];
        this.currentBoard.columns.push(tempColumn);
        this.currentBoard.columns.sort((a, b) => a.position - b.position);
      },
      
      // Rollback function
      () => {
        this.currentBoard = originalBoard;
      },
      
      // Actual database operation
      async () => {
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

        // Replace temp column with real column
        if (this.currentBoard?.columns) {
          const tempIndex = this.currentBoard.columns.findIndex(c => c.id === tempId);
          if (tempIndex !== -1) {
            this.currentBoard.columns[tempIndex] = {
              ...data,
              cards: []
            };
          }
        }
        
        return data;
      }
    );
  }

  async updateColumn(columnId: string, input: UpdateColumnInput) {
    if (!this.currentBoard) return;
    
    const originalBoard = deepCopyBoardState(this.currentBoard);
    
    return this.withOptimisticUpdate(
      // Optimistic update - update column immediately
      () => {
        if (!this.currentBoard?.columns) return;
        
        const columnIndex = this.currentBoard.columns.findIndex(c => c.id === columnId);
        if (columnIndex !== -1) {
          this.currentBoard.columns[columnIndex] = {
            ...this.currentBoard.columns[columnIndex],
            ...input
          };
        }
      },
      
      // Rollback function
      () => {
        this.currentBoard = originalBoard;
      },
      
      // Actual database operation
      async () => {
        const { error } = await supabase
          .from('columns')
          .update(input)
          .eq('id', columnId);

        if (error) throw error;
        return true;
      }
    );
  }

  async deleteColumn(columnId: string) {
    if (!this.currentBoard) return;
    
    const originalBoard = deepCopyBoardState(this.currentBoard);
    
    return this.withOptimisticUpdate(
      // Optimistic update - remove column immediately
      () => {
        if (!this.currentBoard?.columns) return;
        
        this.currentBoard.columns = this.currentBoard.columns.filter(c => c.id !== columnId);
      },
      
      // Rollback function
      () => {
        this.currentBoard = originalBoard;
      },
      
      // Actual database operation
      async () => {
        const { error } = await supabase
          .from('columns')
          .delete()
          .eq('id', columnId);

        if (error) throw error;
        return true;
      }
    );
  }

  // Card operations
  async createCard(input: CreateCardInput) {
    if (!this.currentBoard) return;
    
    const originalBoard = deepCopyBoardState(this.currentBoard);
    const tempId = `temp-${Date.now()}`;
    
    return this.withOptimisticUpdate(
      // Optimistic update - add card immediately
      () => {
        if (!this.currentBoard?.columns) return;
        
        const column = this.currentBoard.columns.find(c => c.id === input.column_id);
        if (!column) return;
        
        // Calculate position
        const position = input.position ?? (column.cards?.length || 0);
        
        // Create temporary card
        const tempCard: any = {
          id: tempId,
          title: input.title,
          description: input.description || null,
          column_id: input.column_id,
          board_id: input.board_id,
          position,
          priority: input.priority || null,
          due_date: input.due_date || null,
          created_at: new Date().toISOString(),
          card_label_assignments: [],
          assignees: [],
          comments: [],
          attachments: [],
          checklists: [],
          column: {
            id: column.id,
            title: column.title
          }
        };
        
        if (!column.cards) column.cards = [];
        column.cards.push(tempCard);
      },
      
      // Rollback function
      () => {
        this.currentBoard = originalBoard;
      },
      
      // Actual database operation
      async () => {
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

        // Track activity
        await this.trackActivity(input.board_id, 'card_created', {
          card_title: data.title,
          column_id: input.column_id
        });

        // Replace temp card with real card
        if (this.currentBoard?.columns) {
          const column = this.currentBoard.columns.find(c => c.id === input.column_id);
          if (column?.cards) {
            const tempIndex = column.cards.findIndex(c => c.id === tempId);
            if (tempIndex !== -1) {
              column.cards[tempIndex] = {
                ...data,
                column: {
                  id: column.id,
                  title: column.title
                },
                card_label_assignments: [],
                assignees: [],
                comments: [],
                attachments: [],
                checklists: []
              };
            }
          }
        }
        
        return data;
      }
    );
  }

  async updateCard(cardId: string, input: UpdateCardInput) {
    if (!this.currentBoard) return;
    
    const originalBoard = deepCopyBoardState(this.currentBoard);
    
    return this.withOptimisticUpdate(
      // Optimistic update - update card immediately
      () => {
        if (!this.currentBoard?.columns) return;
        
        for (const column of this.currentBoard.columns) {
          if (column.cards) {
            const cardIndex = column.cards.findIndex(c => c.id === cardId);
            if (cardIndex !== -1) {
              column.cards[cardIndex] = {
                ...column.cards[cardIndex],
                ...input
              };
              break;
            }
          }
        }
      },
      
      // Rollback function
      () => {
        this.currentBoard = originalBoard;
      },
      
      // Actual database operation
      async () => {
        const { error } = await supabase
          .from('cards')
          .update(input)
          .eq('id', cardId);

        if (error) throw error;
        return true;
      }
    );
  }

  async deleteCard(cardId: string) {
    if (!this.currentBoard) return;
    
    const originalBoard = deepCopyBoardState(this.currentBoard);
    let deletedCard: any = null;
    let sourceColumn: any = null;
    
    return this.withOptimisticUpdate(
      // Optimistic update - remove card immediately
      () => {
        if (!this.currentBoard?.columns) return;
        
        for (const column of this.currentBoard.columns) {
          if (column.cards) {
            const cardIndex = column.cards.findIndex(c => c.id === cardId);
            if (cardIndex !== -1) {
              deletedCard = column.cards[cardIndex];
              sourceColumn = column;
              column.cards.splice(cardIndex, 1);
              break;
            }
          }
        }
      },
      
      // Rollback function
      () => {
        this.currentBoard = originalBoard;
      },
      
      // Actual database operation
      async () => {
        const { error } = await supabase
          .from('cards')
          .delete()
          .eq('id', cardId);

        if (error) throw error;
        return true;
      }
    );
  }

  async moveCard({ cardId, sourceColumnId, targetColumnId, newPosition }: MoveCardInput) {
    if (!this.currentBoard) return;
    
    const originalBoard = deepCopyBoardState(this.currentBoard);
    
    return this.withOptimisticUpdate(
      // Optimistic update - move card immediately in UI
      () => {
        if (!this.currentBoard?.columns) return;
        
        // Find source and target columns
        const sourceColumn = this.currentBoard.columns.find(c => c.id === sourceColumnId);
        const targetColumn = this.currentBoard.columns.find(c => c.id === targetColumnId);
        
        if (!sourceColumn || !targetColumn) return;
        
        // Find and remove card from source column
        const cardIndex = sourceColumn.cards?.findIndex(c => c.id === cardId) ?? -1;
        if (cardIndex === -1) return;
        
        const [movedCard] = sourceColumn.cards!.splice(cardIndex, 1);
        
        // Update card's column_id if moving to different column
        if (sourceColumnId !== targetColumnId) {
          movedCard.column_id = targetColumnId;
        }
        
        // Insert card at new position in target column
        if (!targetColumn.cards) targetColumn.cards = [];
        targetColumn.cards.splice(newPosition, 0, movedCard);
        
        // Update positions
        sourceColumn.cards?.forEach((card, index) => {
          card.position = index;
        });
        targetColumn.cards?.forEach((card, index) => {
          card.position = index;
        });
      },
      
      // Rollback function
      () => {
        this.currentBoard = originalBoard;
      },
      
      // Actual database operation
      async () => {
        // Get card details and column names for activity tracking
        const { data: card } = await supabase
          .from('cards')
          .select('title, board_id')
          .eq('id', cardId)
          .single();

        const { data: sourceColumn } = await supabase
          .from('columns')
          .select('title')
          .eq('id', sourceColumnId)
          .single();

        const { data: targetColumn } = await supabase
          .from('columns')
          .select('title')
          .eq('id', targetColumnId)
          .single();

        // If moving within the same column, just update position
        if (sourceColumnId === targetColumnId) {
          await this.updateCard(cardId, { position: newPosition });
        } else {
          // Moving to a different column
          await this.updateCard(cardId, {
            column_id: targetColumnId,
            position: newPosition
          });
        }

        // Track activity with column names
        if (card) {
          await this.trackActivity(card.board_id, 'card_moved', {
            card_title: card.title,
            source_column_id: sourceColumnId,
            target_column_id: targetColumnId,
            source_column_name: sourceColumn?.title || 'Unknown Column',
            target_column_name: targetColumn?.title || 'Unknown Column'
          });
        }

        // Reorder cards in both columns
        await this.reorderCards(sourceColumnId);
        await this.reorderCards(targetColumnId);
      }
    );
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

  // Optimistic updates
  private async withOptimisticUpdate<T>(
    optimisticUpdate: () => void,
    rollback: () => void,
    operation: () => Promise<T>
  ): Promise<T> {
    const updateId = Math.random().toString(36);
    
    try {
      // Apply optimistic update immediately
      optimisticUpdate();
      this.optimisticUpdates.set(updateId, { rollback });
      
      // Perform actual operation
      const result = await operation();
      
      // Success - remove from optimistic updates
      this.optimisticUpdates.delete(updateId);
      return result;
    } catch (error) {
      // Failure - rollback the optimistic update
      rollback();
      this.optimisticUpdates.delete(updateId);
      throw error;
    }
  }
  
  private rollbackAllOptimisticUpdates() {
    for (const [id, { rollback }] of this.optimisticUpdates) {
      rollback();
    }
    this.optimisticUpdates.clear();
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
          entity_type: 'board',
          metadata: details,
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
      // Listen to card label assignment changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'card_label_assignments'
        },
        (payload) => this.handleCardLabelAssignmentChange(payload)
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
      // Update board properties optimistically if it's just a title/description change
      if (payload.eventType === 'UPDATE' && payload.new && this.currentBoard) {
        this.currentBoard.title = payload.new.title;
        this.currentBoard.description = payload.new.description;
      }
    }
  }

  private handleColumnChange(payload: any) {
    console.log('Column change:', payload);
    if (this.currentBoard?.columns) {
      if (payload.eventType === 'UPDATE' && payload.new) {
        // Update column properties optimistically
        const columnIndex = this.currentBoard.columns.findIndex(c => c.id === payload.new.id);
        if (columnIndex !== -1) {
          this.currentBoard.columns[columnIndex] = {
            ...this.currentBoard.columns[columnIndex],
            ...payload.new
          };
        }
      } else if (payload.eventType === 'INSERT' && payload.new) {
        // Add new column if not already present (from optimistic update)
        const exists = this.currentBoard.columns.find(c => c.id === payload.new.id);
        if (!exists) {
          this.currentBoard.columns.push({
            ...payload.new,
            cards: []
          });
          this.currentBoard.columns.sort((a, b) => a.position - b.position);
        }
      } else if (payload.eventType === 'DELETE' && payload.old) {
        // Remove deleted column
        this.currentBoard.columns = this.currentBoard.columns.filter(c => c.id !== payload.old.id);
      }
    }
  }

  private handleCardChange(payload: any) {
    console.log('Card change:', payload);
    if (this.currentBoard?.columns) {
      if (payload.eventType === 'UPDATE' && payload.new) {
        // Update card properties optimistically
        for (const column of this.currentBoard.columns) {
          if (column.cards) {
            const cardIndex = column.cards.findIndex(c => c.id === payload.new.id);
            if (cardIndex !== -1) {
              column.cards[cardIndex] = {
                ...column.cards[cardIndex],
                ...payload.new
              };
              break;
            }
          }
        }
      } else if (payload.eventType === 'INSERT' && payload.new) {
        // Add new card if not already present (from optimistic update)
        const targetColumn = this.currentBoard.columns.find(c => c.id === payload.new.column_id);
        if (targetColumn?.cards) {
          const exists = targetColumn.cards.find(c => c.id === payload.new.id);
          if (!exists) {
            targetColumn.cards.push({
              ...payload.new,
              column: {
                id: targetColumn.id,
                title: targetColumn.title
              }
            });
            targetColumn.cards.sort((a, b) => a.position - b.position);
          }
        }
      } else if (payload.eventType === 'DELETE' && payload.old) {
        // Remove deleted card
        for (const column of this.currentBoard.columns) {
          if (column.cards) {
            column.cards = column.cards.filter(c => c.id !== payload.old.id);
          }
        }
      }
    }
  }

  private handleCardLabelAssignmentChange(payload: any) {
    console.log('Card label assignment change:', payload);
    if (this.currentBoard?.columns) {
      if (payload.eventType === 'INSERT' && payload.new) {
        // Add new label assignment
        for (const column of this.currentBoard.columns) {
          if (column.cards) {
            const card = column.cards.find(c => c.id === payload.new.card_id);
            if (card) {
              if (!card.card_label_assignments) card.card_label_assignments = [];
              
              // Check if assignment already exists (from optimistic update)
              const existingAssignment = card.card_label_assignments.find(
                a => a.label_id === payload.new.label_id
              );
              
              if (!existingAssignment) {
                // Try to find label details from existing cards first
                let label = this.currentBoard.columns?.flatMap(c => 
                  c.cards?.flatMap(card => 
                    card.card_label_assignments?.map(a => a.card_labels)
                  ) || []
                ).find(l => l?.id === payload.new.label_id);
                
                // If not found, we'll fetch it asynchronously
                if (!label) {
                  this.fetchLabelDetails(payload.new.label_id).then(labelData => {
                    if (labelData && card.card_label_assignments) {
                      const assignment = card.card_label_assignments.find(
                        a => a.label_id === payload.new.label_id
                      );
                      if (assignment) {
                        assignment.card_labels = labelData;
                      }
                    }
                  });
                }
                
                card.card_label_assignments.push({
                  id: payload.new.id,
                  card_id: payload.new.card_id,
                  label_id: payload.new.label_id,
                  card_labels: label || null
                });
              } else {
                // Update existing assignment with real ID
                existingAssignment.id = payload.new.id;
              }
              break;
            }
          }
        }
      } else if (payload.eventType === 'DELETE' && payload.old) {
        // Remove deleted label assignment
        for (const column of this.currentBoard.columns) {
          if (column.cards) {
            const card = column.cards.find(c => c.id === payload.old.card_id);
            if (card && card.card_label_assignments) {
              card.card_label_assignments = card.card_label_assignments.filter(
                a => a.label_id !== payload.old.label_id
              );
            }
          }
        }
      }
    }
  }

  private async fetchLabelDetails(labelId: string) {
    try {
      const { data, error } = await supabase
        .from('card_labels')
        .select('*')
        .eq('id', labelId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching label details:', error);
      return null;
    }
  }

  private handleActivityChange(payload: any) {
    console.log('New activity:', payload);
    // Activity changes can trigger UI notifications or activity feed updates
    // This will be handled by the ActivityFeed component
  }

  // Label management for cards
  async updateCardLabels(cardId: string, labelId: string, isAssigning: boolean) {
    if (!this.currentBoard) return;
    
    const originalBoard = deepCopyBoardState(this.currentBoard);
    
    return this.withOptimisticUpdate(
      // Optimistic update - update card labels immediately
      async () => {
        if (!this.currentBoard?.columns) return;
        
        for (const column of this.currentBoard.columns) {
          if (column.cards) {
            const card = column.cards.find(c => c.id === cardId);
            if (card) {
              if (!card.card_label_assignments) card.card_label_assignments = [];
              
              if (isAssigning) {
                // Add label assignment
                const existingAssignment = card.card_label_assignments.find(
                  a => a.label_id === labelId
                );
                if (!existingAssignment) {
                  // Try to find label details from existing cards first
                  let label = this.currentBoard.columns?.flatMap(c => 
                    c.cards?.flatMap(card => 
                      card.card_label_assignments?.map(a => a.card_labels)
                    ) || []
                  ).find(l => l?.id === labelId);
                  
                  // If not found, fetch from database
                  if (!label) {
                    const { data: labelData } = await supabase
                      .from('card_labels')
                      .select('*')
                      .eq('id', labelId)
                      .single();
                    label = labelData;
                  }
                  
                  card.card_label_assignments.push({
                    id: `temp-${Date.now()}`,
                    card_id: cardId,
                    label_id: labelId,
                    card_labels: label || null
                  });
                }
              } else {
                // Remove label assignment
                card.card_label_assignments = card.card_label_assignments.filter(
                  a => a.label_id !== labelId
                );
              }
              break;
            }
          }
        }
      },
      
      // Rollback function
      () => {
        this.currentBoard = originalBoard;
      },
      
      // Actual database operation
      async () => {
        if (isAssigning) {
          const { error } = await supabase
            .from('card_label_assignments')
            .insert({
              card_id: cardId,
              label_id: labelId
            });
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('card_label_assignments')
            .delete()
            .eq('card_id', cardId)
            .eq('label_id', labelId);
          if (error) throw error;
        }
        
        return true;
      }
    );
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