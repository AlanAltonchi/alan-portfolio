# Database Types

This directory contains TypeScript type definitions that reflect the Supabase database schema.

## Structure

- **`database.ts`** - Auto-generated types from Supabase (DO NOT EDIT MANUALLY)
- **`entities.ts`** - Convenient type aliases and extended types
- **`index.ts`** - Main export file for easy imports

## Usage

### Basic Entity Types

```typescript
import type { User, Task, Message } from '$lib/types';

const user: User = {
  id: '123',
  email: 'user@example.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: null
};

```

### Extended Types with Relationships

```typescript
import type { MessageWithSender, UserWithProfile } from '$lib/types';

// For joined data
const messageWithSender: MessageWithSender = {
  id: '456',
  content: 'Hello!',
  sender_id: '123',
  receiver_id: '789',
  // ... other message fields
  sender: {
    id: '123',
    email: 'sender@example.com',
    // ... other user fields
  },
  receiver: {
    id: '789',
    email: 'receiver@example.com',
    // ... other user fields
  }
};
```

### API Response Types

```typescript
import type { ApiResponse, PaginatedResponse } from '$lib/types';

// For single item responses
const userResponse: ApiResponse<User> = {
  data: user,
  error: null,
  success: true
};

// For paginated responses
const tasksResponse: PaginatedResponse<Task> = {
  data: [task1, task2, task3],
  error: null,
  success: true,
  pagination: {
    page: 1,
    limit: 10,
    total: 25,
    hasMore: true
  }
};
```

## Regenerating Types

When your database schema changes, regenerate the types:

```bash
npm run generate-types
```

Or manually using Supabase CLI:

```bash
supabase gen types typescript --project-id yyotaxglerwhtejhwguq > src/lib/types/database.ts
```

## Best Practices

1. **Always use the appropriate type variant:**
   - `User` for reading data
   - `UserInsert` for creating records
   - `UserUpdate` for updating records

2. **Import from the main index:**
   ```typescript
   import type { User, Task, Message } from '$lib/types';
   ```

3. **Create extended types for complex queries:**
   ```typescript
   export type TaskWithUser = Task & {
     user: UserWithProfile;
   };
   ```

4. **Use utility types for common patterns:**
   ```typescript
   import type { ID, Timestamp, ApiResponse } from '$lib/types';
   ```

## Type Safety Benefits

- **Compile-time validation** - Catch schema mismatches early
- **IDE autocomplete** - Better developer experience
- **Refactoring safety** - Changes propagate through codebase
- **Documentation** - Types serve as living documentation
- **API consistency** - Ensures frontend/backend alignment 