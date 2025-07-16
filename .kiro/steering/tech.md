# Technology Stack

## Frontend Framework
- **React 19** with TypeScript for type safety
- **Vite** as build tool and dev server
- **React Router DOM** for client-side routing
- **React Hook Form** with Yup validation

## Styling & UI
- **Tailwind CSS 4.x** with custom design system
- **Heroicons** for consistent iconography
- **Custom color palette** with primary/emerald/purple themes
- **Responsive design** with mobile-first approach

## Backend & Database
- **Supabase** for backend-as-a-service
- **PostgreSQL** with Row Level Security (RLS)
- **Real-time subscriptions** for live updates
- **Supabase Auth** for authentication

## Key Libraries
- **React DnD** for drag-and-drop functionality
- **Mapbox GL** for mapping and location services
- **PayPal SDK** for payment processing
- **React Hot Toast** for notifications
- **Date-fns** for date manipulation

## Development Tools
- **ESLint** with TypeScript rules
- **PostCSS** with Autoprefixer
- **Node.js 18+** runtime requirement

## Common Commands

### Development
```bash
npm run dev          # Start development server (localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Database
```bash
# Run in Supabase SQL Editor:
# 1. Execute supabase/schema.sql
# 2. Execute supabase/rls-policies.sql
# 3. Optional: setup-demo-data.sql for testing
```

### Deployment
```bash
npm install -g vercel
vercel --prod        # Deploy to Vercel
```

## Environment Configuration
Required environment variables in `.env`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_PAYPAL_CLIENT_ID` - PayPal client ID
- `VITE_MAPBOX_ACCESS_TOKEN` - Mapbox access token
- Business configuration variables for branding