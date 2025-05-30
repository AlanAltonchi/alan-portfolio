import type { Database } from './database';

// Extract base types from database
type DbBoard = Database['public']['Tables']['boards']['Row'];
type DbColumn = Database['public']['Tables']['columns']['Row'];
type DbCard = Database['public']['Tables']['cards']['Row'];
type DbBoardMember = Database['public']['Tables']['board_members']['Row'];
type DbCardAttachment = Database['public']['Tables']['card_attachments']['Row'];
type DbCardComment = Database['public']['Tables']['card_comments']['Row'];
type DbCardChecklist = Database['public']['Tables']['card_checklists']['Row'];
type DbChecklistItem = Database['public']['Tables']['checklist_items']['Row'];
type DbBoardActivity = Database['public']['Tables']['board_activities']['Row'];
type DbCardLabel = Database['public']['Tables']['card_labels']['Row'];

// Extended interfaces with additional properties
export interface Board extends DbBoard {
  columns?: Column[];
  members?: BoardMember[];
  labels?: CardLabel[];
}

export interface Column extends DbColumn {
  cards?: Card[];
}

export interface Card extends DbCard {
  attachments?: CardAttachment[];
  comments?: CardComment[];
  checklists?: CardChecklist[];
  labels?: CardLabel[];
  assignees?: User[];
  card_label_assignments?: any[];
  column?: {
    id: string;
    title: string;
  };
}

export interface BoardMember extends DbBoardMember {
  user?: User;
}

export interface CardAttachment extends DbCardAttachment {
  signedUrl?: string;
}

export interface CardComment extends DbCardComment {
  user?: User;
}

export interface CardChecklist extends DbCardChecklist {
  items?: ChecklistItem[];
  completedCount?: number;
  totalCount?: number;
}

export interface ChecklistItem extends DbChecklistItem {}

export interface BoardActivity extends DbBoardActivity {
  user?: User;
}

export interface CardLabel extends DbCardLabel {}

// User type from profiles
export interface User {
  id: string;
  email?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
}

// Form types for creating/updating entities
export interface CreateBoardInput {
  title: string;
  description?: string;
}

export interface UpdateBoardInput {
  title?: string;
  description?: string;
}

export interface CreateColumnInput {
  title: string;
  board_id: string;
  position?: number;
}

export interface UpdateColumnInput {
  title?: string;
  position?: number;
}

export interface CreateCardInput {
  title: string;
  description?: string;
  column_id: string;
  board_id: string;
  position?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
}

export interface UpdateCardInput {
  title?: string;
  description?: string;
  column_id?: string;
  position?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
}

export interface MoveCardInput {
  cardId: string;
  sourceColumnId: string;
  targetColumnId: string;
  newPosition: number;
}

// Filter and view types
export interface FilterState {
  search: string;
  searchQuery?: string;
  labels: string[];
  assignees: string[];
  priority: ('low' | 'medium' | 'high' | 'urgent')[];
  priorities?: string[];
  hasDueDate: boolean | null;
  isOverdue: boolean | null;
  dueDate?: string;
}

export type ViewMode = 'board' | 'list' | 'calendar' | 'timeline';

// Drag and drop types
export interface DragItem {
  type: 'card';
  cardId: string;
  columnId: string;
  boardId: string;
  index: number;
}

export interface DropResult {
  targetColumnId: string;
  targetIndex: number;
}

// Real-time event types
export type KanbanEventType = 
  | 'board.created'
  | 'board.updated'
  | 'board.deleted'
  | 'column.created'
  | 'column.updated'
  | 'column.deleted'
  | 'column.moved'
  | 'card.created'
  | 'card.updated'
  | 'card.deleted'
  | 'card.moved'
  | 'member.added'
  | 'member.removed'
  | 'member.updated';

export interface KanbanEvent {
  type: KanbanEventType;
  boardId: string;
  userId: string;
  data: any;
  timestamp: string;
}

// Store state types
export interface KanbanState {
  boards: Board[];
  currentBoard: Board | null;
  currentCard: Card | null;
  loading: boolean;
  error: string | null;
  filters: FilterState;
  viewMode: ViewMode;
  draggedItem: DragItem | null;
  activeUsers: Map<string, User>;
}