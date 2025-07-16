import { vi } from 'vitest'
import { createMockSupabaseClient } from '../utils'

// Mock the Supabase client
export const supabase = createMockSupabaseClient()

// Mock the supabase module
vi.mock('../../lib/supabase', () => ({
  supabase: createMockSupabaseClient(),
}))

// Mock Supabase auth helpers
vi.mock('@supabase/auth-helpers-react', () => ({
  useSupabaseClient: () => createMockSupabaseClient(),
  useSession: () => null,
  useUser: () => null,
  SessionContextProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock Supabase auth UI
vi.mock('@supabase/auth-ui-react', () => ({
  Auth: ({ children }: { children?: any }) => children || null,
}))

vi.mock('@supabase/auth-ui-shared', () => ({
  ThemeSupa: {},
}))