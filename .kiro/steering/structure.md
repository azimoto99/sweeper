# Project Structure

## Root Level Organization
```
sweeper/
├── src/                    # Main application source code
├── supabase/              # Database schema and policies
├── public/                # Static assets
├── .kiro/                 # Kiro configuration and specs
└── plans/                 # Project planning documents
```

## Source Code Structure (`src/`)

### Core Application
- `App.tsx` - Main application with routing and providers
- `main.tsx` - Application entry point
- `index.css` - Global styles and Tailwind imports

### Component Organization
```
src/components/
├── admin/          # Admin dashboard and dispatch center
├── auth/           # Authentication forms and guards
├── booking/        # Service booking flow
├── customer/       # Customer-specific features
├── worker/         # Worker mobile interface
├── dashboard/      # Role-based dashboards
├── layout/         # Shared layout components
├── ui/             # Reusable UI components
├── forms/          # Form components and validation
├── payment/        # PayPal integration
├── map/            # Mapbox integration
├── notifications/  # Toast and real-time notifications
├── products/       # E-commerce catalog
├── reviews/        # Rating and review system
└── subscriptions/  # Membership plans
```

### Supporting Directories
- `contexts/` - React contexts (Auth, Loading)
- `hooks/` - Custom React hooks
- `lib/` - Third-party service integrations (Supabase, PayPal, Mapbox)
- `types/` - TypeScript type definitions
- `utils/` - Utility functions and helpers
- `pages/` - Full page components (auth, legal)
- `styles/` - Additional CSS files

## Database Structure (`supabase/`)
- `schema.sql` - Complete database schema
- `rls-policies.sql` - Row Level Security policies
- `notifications.sql` - Real-time notification setup
- `setup-demo-data.sql` - Demo data for testing

## Key Architectural Patterns

### Role-Based Access Control
- **AuthGuard** - Base authentication requirement
- **AdminGuard** - Admin-only routes
- **WorkerGuard** - Worker-only routes  
- **CustomerGuard** - Customer-only routes

### Real-time Features
- Supabase real-time subscriptions for live updates
- Context providers for state management
- Custom hooks for data fetching and subscriptions

### Component Naming Conventions
- **Pages**: `BookingPage`, `ProfilePage` (full page components)
- **Components**: `BookingForm`, `WorkerCard` (reusable components)
- **Contexts**: `AuthContext`, `LoadingContext`
- **Hooks**: `useAuth`, `useBookingNotifications`
- **Guards**: `AuthGuard`, `AdminGuard`

### File Organization Rules
- Group by feature/domain rather than file type
- Keep related components in same directory
- Separate business logic into custom hooks
- Centralize API calls in `lib/` directory