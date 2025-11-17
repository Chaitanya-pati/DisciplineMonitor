# FitFlow - Fitness & Productivity Tracker PWA

## Overview

FitFlow is a Progressive Web Application (PWA) designed to help users track fitness goals, manage tasks, and boost productivity through customizable habit tracking and anti-procrastination features. The application is mobile-first with a clean, data-dense interface inspired by modern productivity tools like Notion, Linear, and Streaks.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript for type safety
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- Progressive Web App capabilities with service worker for offline support

**State Management:**
- TanStack Query (React Query) for server state and caching
- Dexie.js (IndexedDB wrapper) for client-side local database
- React hooks for component-level state

**UI Component System:**
- shadcn/ui components built on Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- "New York" style variant from shadcn/ui
- Inter font family (Google Fonts) for optimal readability
- Custom color system supporting light/dark themes

**Key Design Patterns:**
- Mobile-first responsive design with fixed bottom navigation
- Compound component patterns for UI flexibility
- Form handling with react-hook-form and Zod validation
- Drag-and-drop functionality using @dnd-kit for checklist reordering

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- HTTP-only architecture (no WebSocket requirements currently)
- RESTful API design pattern with `/api` prefix convention

**Development Setup:**
- Hot module replacement (HMR) in development via Vite middleware
- Custom logging middleware for API request tracking
- Development-only Replit plugins (cartographer, dev-banner, runtime-error-modal)

**Data Persistence Strategy:**
- Client-side: Dexie.js (IndexedDB) for offline-first data storage
- Server-side: In-memory storage implementation currently active
- Database-ready: Drizzle ORM configured for PostgreSQL migration path

### Data Storage Solutions

**Current Implementation:**
- **Local Storage**: Dexie.js manages all application data client-side
- **IndexedDB Tables**:
  - `checklistItems`: User-defined fitness/habit tracking items
  - `dailyChecklistLogs`: Daily completion records
  - `dailySummaries`: Aggregated daily fitness scores
  - `tasks`: Productivity task management
  - `procrastinationDelays`: Anti-procrastination tracking
  - `pomodoroSessions`: Focus timer session history
  - `streaks`: Fitness and productivity streak tracking
  - `motivationQuotes`: Inspirational content library

**Future Migration Path:**
- Drizzle ORM configured with PostgreSQL dialect
- Schema defined in `shared/schema.ts` with Zod validation
- Ready for Neon serverless PostgreSQL integration
- Migration files output to `./migrations` directory

### Data Schema Design

**Core Entities:**
- **ChecklistItem**: Flexible input types (yes/no, number, slider, dropdown, timer) with customizable targets, units, and reminders
- **Task**: Priority-based task management with status tracking, deadlines, subtasks, and time estimation
- **Streak**: Separate tracking for fitness and productivity with cheat day support
- **DailySummary**: Aggregated metrics including completion percentage and fitness score calculation

**Validation Strategy:**
- Zod schemas define both runtime validation and TypeScript types
- Shared schema definitions between client and server prevent drift
- Insert schemas derived from main schemas (omitting auto-generated fields)

### Authentication & Authorization

**Current State:**
- No authentication system implemented
- Single-user local application model
- User schema exists in storage interface but unused

**Planned Architecture:**
- Session-based authentication prepared (connect-pg-simple for session storage)
- User management interface defined in storage layer
- Ready for multi-user deployment when backend is activated

### PWA Features

**Offline Capabilities:**
- Service worker (`sw.js`) provides basic offline support
- Cache-first strategy for static assets
- Manifest file configured for installability
- Viewport meta tags optimized for mobile devices

**Mobile Optimization:**
- Safe area padding for notched devices
- Touch-friendly interaction targets
- Bottom navigation respects iOS safe areas
- Standalone display mode for app-like experience

## External Dependencies

### Third-Party UI Libraries
- **Radix UI**: Unstyled, accessible component primitives (dialogs, dropdowns, popovers, etc.)
- **shadcn/ui**: Pre-styled component collection built on Radix UI
- **Lucide React**: Icon library for consistent iconography
- **@dnd-kit**: Drag-and-drop toolkit for sortable lists
- **Recharts**: Charting library for data visualization in reports

### Data & Form Management
- **TanStack Query**: Server state synchronization and caching
- **React Hook Form**: Performant form state management
- **Zod**: Schema validation and TypeScript type inference
- **Dexie.js**: Promise-based IndexedDB wrapper with React hooks
- **date-fns**: Lightweight date manipulation and formatting

### Database (Configured, Not Active)
- **@neondatabase/serverless**: Serverless PostgreSQL driver
- **Drizzle ORM**: TypeScript ORM with automatic migration generation
- **drizzle-kit**: CLI tools for schema migrations

### Development Tools
- **Vite**: Fast build tool with HMR
- **TypeScript**: Type safety across the stack
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS & Autoprefixer**: CSS processing

### Replit Integration
- **@replit/vite-plugin-cartographer**: Development navigation
- **@replit/vite-plugin-dev-banner**: Development environment indicators
- **@replit/vite-plugin-runtime-error-modal**: Enhanced error reporting

### Build & Deployment
- **esbuild**: Server-side bundling for production
- **tsx**: TypeScript execution for development server
- Environment-based configuration (NODE_ENV)