# Alan's Portfolio - Full-Stack Developer Showcase

**Live Demo**: [https://alan-portfolio-beta.vercel.app/](https://alan-portfolio-beta.vercel.app/)

A modern, feature-rich portfolio application demonstrating advanced full-stack development skills through real-world implementations. Built with cutting-edge technologies and best practices, this portfolio showcases not just technical proficiency but also understanding of production-grade requirements.

## Key Features

### **Authentication & Security**

- Complete authentication system with secure session management
- **Instant demo access** for recruiters - no registration required
- Advanced Row Level Security (RLS) for multi-tenant data isolation
- OAuth social login integration
- Auto-cleanup system for demo accounts

### **Real-time Chat System**

- Live messaging with WebSocket connections
- Typing indicators and read receipts
- File sharing with secure signed URLs
- Multi-user conversations
- Optimistic UI updates for instant feedback

### **Kanban Task Management**

- Drag-and-drop functionality with smooth animations
- Real-time collaborative features
- Card assignments, labels, and activity tracking
- Comments, checklists, and file attachments
- Board-level permissions and access control

### **Analytics Dashboard**

- Interactive data visualizations
- Multiple chart types: Line, Bar, Donut, HeatMap
- Traffic analysis and device statistics
- Performance metrics and user activity tracking

### **Profile Management**

- User profiles with avatar upload
- Image compression and optimization
- CRUD operations with real-time updates

### **Developer Drawer** (Unique Feature!)

A standout feature that provides live code inspection:

- View the actual source code of any page
- Inspect database schemas and RLS policies
- Syntax highlighting and code formatting
- Download code snippets and documentation
- Perfect for technical recruiters to assess code quality

## Tech Stack

### Frontend

- **[Svelte 5](https://svelte.dev/)** - Latest version with runes syntax
- **[SvelteKit](https://kit.svelte.dev/)** - Full-stack framework with SSR
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[Lucide Icons](https://lucide.dev/)** - Modern icon library

### Backend & Infrastructure

- **[Supabase](https://supabase.com/)** - Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication
  - File storage
  - Edge Functions
- **[Vercel](https://vercel.com/)** - Deployment and hosting

### Development Tools

- **ESLint & Prettier** - Code quality and formatting
- **Vite** - Fast build tooling
- **Zod** - Schema validation

## Security Features

- **Row Level Security (RLS)** - Database-level access control
- **Secure Authentication** - Never uses insecure session storage
- **CSRF Protection** - Built into SvelteKit
- **Input Validation** - Zod schema validation
- **Signed URLs** - Time-limited access to files
- **Environment Variables** - Secure credential management

## Highlights for Recruiters

1. **Production-Ready Code** - Not just demos, but real implementations
2. **Modern Best Practices** - Latest frameworks and patterns
3. **Full-Stack Capabilities** - Frontend, backend, and database design
4. **Real-time Features** - WebSocket and subscription management
5. **Security First** - Proper authentication and data isolation
6. **Code Transparency** - View actual implementation via Developer Drawer
7. **Performance Optimized** - SSR, code splitting, optimistic updates

## Architecture Highlights

### State Management

Uses Svelte 5's new runes pattern:

```typescript
let count = $state(0);
let doubled = $derived(count * 2);
```

### Real-time Subscriptions

Managed subscriptions with automatic cleanup:

```typescript
const subscription = supabase
	.channel('room')
	.on('broadcast', { event: 'message' }, handler)
	.subscribe();
```

### Type Safety

Complete TypeScript coverage with generated database types:

```typescript
type User = Tables<'profiles'>;
```

## Contact

Feel free to reach out if you have any questions or would like to discuss opportunities!

- **Live Demo**: [https://alan-portfolio-beta.vercel.app/](https://alan-portfolio-beta.vercel.app/)
- **GitHub**: [Alan Altonchi](https://github.com/AlanAltonchi)
- **LinkedIn**: [Alan Altonchi](https://linkedin.com/in/alan-altonchi)

---
