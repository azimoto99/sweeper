# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sweeper is a full-stack web application for Margarita's Cleaning Services, a professional cleaning business in Laredo, TX. The app provides real-time dispatch management, worker tracking, customer booking, and payment processing.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 with custom Vector UI Design System
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Maps**: Mapbox GL JS for real-time dispatch and location tracking
- **Payments**: PayPal Server SDK for checkout and subscriptions
- **Drag & Drop**: react-dnd for dispatch interface
- **Forms**: react-hook-form with yup validation

### Core Business Logic

**Role-Based Access Control**: Three user roles with distinct interfaces:
- `customer`: Book services, track workers, manage subscriptions
- `worker`: Accept jobs, update location, manage schedule
- `admin`: Dispatch center, assign workers, manage operations

**Real-Time Dispatch System**: The core feature is the admin dispatch center (`src/components/admin/DispatchCenter.tsx`) which provides:
- Live map showing all workers and bookings
- Drag-and-drop assignment of bookings to workers
- Real-time location tracking via Supabase subscriptions
- Worker status monitoring and route optimization

**Location-Centric Architecture**: Everything revolves around geospatial data:
- Service area validation (25-mile radius from Laredo, TX)
- Real-time worker GPS tracking
- Route optimization for multiple bookings
- Distance calculations for pricing and dispatch

### Database Design

**Supabase Schema** (`supabase/schema.sql`):
- Uses PostGIS extension for geospatial queries
- Row Level Security (RLS) policies for all tables
- Real-time subscriptions for live updates
- Custom PostgreSQL types for enums (user_role, worker_status, etc.)

**Key Tables**:
- `profiles`: Extends auth.users with business data
- `workers`: Location tracking and status management
- `bookings`: Service requests with geocoded addresses
- `worker_locations`: Real-time GPS tracking history
- `assignments`: Worker-to-booking relationships

**RLS Security Model** (`supabase/rls-policies.sql`):
- Workers can only see their own assignments and customer info
- Customers can only track their assigned worker's location during active jobs
- Admins have full access for dispatch operations
- Location data is strictly controlled based on work hours and assignments

### Key Architectural Patterns

**Authentication Flow** (`src/hooks/useAuth.ts`, `src/contexts/AuthContext.tsx`):
- Supabase Auth with automatic profile creation trigger
- Magic link and OAuth (Google) support
- Role-based route protection via AuthGuard components

**Real-Time Data Management**:
- Supabase Realtime channels for live worker locations
- Real-time booking status updates
- Live dispatch center updates without page refresh

**Mapbox Integration** (`src/lib/mapbox.ts`):
- Custom business styling and markers
- Geocoding for address validation
- Route optimization for multiple stops
- Service area boundary enforcement

**Type Safety** (`src/types/index.ts`):
- Comprehensive TypeScript interfaces matching database schema
- Strict typing for all business entities and API responses

## Environment Setup

Copy `.env.example` to `.env` and configure:

**Required APIs**:
- Supabase project URL and anon key
- Mapbox access token for mapping features
- PayPal client credentials for payments

**Business Configuration**:
- Service area center: Laredo, TX (27.5306, -99.4803)
- Service radius: 25 miles
- Business contact information

## Database Setup

1. Run `supabase/schema.sql` to create tables and extensions
2. Run `supabase/rls-policies.sql` to set up security policies
3. Configure Supabase Auth settings for magic links and OAuth

## Vector UI Design System

**Unified Styling Architecture**: The app now uses a cohesive Vector UI design system (`src/styles/design-system.css`) that provides:
- **Design Tokens**: Comprehensive color palette, typography scale, spacing system, and animation presets
- **Component Classes**: Unified button system (`.btn`, `.btn-primary`, etc.), card variants (`.card`, `.card-elevated`), and input styling
- **Vector Icons**: Consistent icon sizing system (`.icon-xs` through `.icon-2xl`) with interactive effects
- **Animation System**: Custom animations including `.animate-glow`, `.animate-float`, and smooth transitions
- **Accessibility**: Built-in focus management, reduced motion support, and proper contrast ratios

**Component Updates**: All UI components have been updated to use the new design system:
- **Button Component**: Enhanced with vector-optimized styling and interaction patterns
- **Layout Components**: Glass morphism effects and consistent spacing
- **Form Elements**: Unified input styling with proper focus states
- **Cards**: Elevation system with hover effects and border styling

## Key Development Notes

**Drag-and-Drop Dispatch**: The dispatch center uses react-dnd with a custom drop zone on the Mapbox map. Bookings are dragged from the sidebar onto worker markers to create assignments.

**Real-Time Location Updates**: Worker locations update every 30 seconds when on duty. The admin can see all workers in real-time, but customers only see their assigned worker during active jobs.

**Service Area Validation**: All addresses are geocoded and validated against the 25-mile service radius before booking confirmation.

**Authentication State**: The app uses Supabase Auth with custom profile management. User roles determine which components and routes are accessible.

**Map State Management**: The dispatch center maintains complex state for selected workers/bookings, map center/zoom, and various overlay toggles (traffic, routes).

**Error Handling**: All Supabase operations include proper error handling with user-friendly messages. Network failures gracefully degrade functionality.

**Vector UI Consistency**: All components follow the Vector UI design system for consistent look and feel across the application.

## Known Limitations

- App.tsx still contains default Vite template (needs router setup)
- No test framework configured yet
- PayPal integration implemented but not fully wired
- Worker mobile interface and customer booking system in progress