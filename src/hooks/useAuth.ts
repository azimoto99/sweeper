import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { User as AppUser } from '../types'
import { handleError } from '../utils/errorHandler'
import { getAuthCallbackUrl } from '../lib/config'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AppUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsVerified(session?.user?.email_confirmed_at != null)
      
      if (session?.user) {
        fetchProfile(session.user.id)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id)
      setSession(session)
      setUser(session?.user ?? null)
      setIsVerified(session?.user?.email_confirmed_at != null)
      
      if (session?.user) {
        // For new signups, we need to ensure profile creation
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await fetchProfile(session.user.id)
        }
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Set up real-time profile updates
  useEffect(() => {
    if (!user?.id) return

    const subscription = supabase
      .channel('profile-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${user.id}`
      }, (payload) => {
        setProfile(payload.new as AppUser)
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user?.id])

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.log('Profile fetch error:', error)
        handleError(error, { action: 'fetch_profile', userId })
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating new profile...')
          await createProfile(userId)
        }
      } else {
        console.log('Profile found:', data)
        setProfile(data)
      }
    } catch (error) {
      console.error('Profile fetch catch error:', error)
      handleError(error, { action: 'fetch_profile_catch', userId })
    }
  }

  const createProfile = async (userId: string) => {
    try {
      console.log('Creating profile for user:', userId)
      const { data: authUser } = await supabase.auth.getUser()
      if (!authUser.user) {
        console.error('No auth user found')
        return
      }

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (existingProfile) {
        console.log('Profile already exists:', existingProfile)
        setProfile(existingProfile)
        return
      }

      // Create new profile with proper data
      const profileData = {
        id: userId,
        email: authUser.user.email!,
        full_name: authUser.user.user_metadata?.full_name || authUser.user.email?.split('@')[0] || 'User',
        role: authUser.user.user_metadata?.role || 'customer'
      }
      
      console.log('Creating profile with data:', profileData)
      
      const { data, error } = await supabase
        .from('users')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        console.error('Error creating user profile:', error)
        throw error
      }
      
      console.log('Profile created successfully:', data)
      setProfile(data)

      // If user is a worker, create worker profile
      if (data.role === 'worker') {
        console.log('Creating worker profile...')
        const { error: workerError } = await supabase
          .from('workers')
          .insert({
            profile_id: data.id,
            status: 'offline',
            assigned_bookings_count: 0
          })
        
        if (workerError) {
          console.error('Error creating worker profile:', workerError)
          // Don't throw error, just log it - user profile is still created
        } else {
          console.log('Worker profile created successfully')
        }
      }
    } catch (error) {
      console.error('Create profile error:', error)
      handleError(error, { action: 'create_profile', userId })
    }
  }

  const signUp = async (email: string, password: string, fullName: string, role: 'customer' | 'worker' = 'customer') => {
    try {
      console.log('Starting signup process...', { email, fullName, role })
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
          data: {
            full_name: fullName,
            role: role
          }
        }
      })

      if (error) {
        console.error('Supabase signup error:', error)
        return { error }
      }

      console.log('Signup successful:', data)

      // For confirmed users (immediate signup without email verification),
      // create profile immediately
      if (data.user && data.session) {
        console.log('User confirmed immediately, creating profile...')
        await createProfile(data.user.id)
      }

      return { data, error: null }
    } catch (error) {
      console.error('Signup catch error:', error)
      return { error }
    }
  }

  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      return { data, error }
    } catch (error) {
      return { error }
    }
  }

  const signInWithMagicLink = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: getAuthCallbackUrl()
        }
      })

      return { data, error }
    } catch (error) {
      return { error }
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getAuthCallbackUrl()
        }
      })

      return { data, error }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const updateProfile = async (updates: Partial<AppUser>) => {
    if (!user) return { error: new Error('No user logged in') }

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) return { error }

      setProfile(data)
      return { data, error: null }
    } catch (error) {
      return { error }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/handle-reset-password`
      })

      return { data, error }
    } catch (error) {
      return { error }
    }
  }

  const updatePassword = async (password: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password
      })

      return { data, error }
    } catch (error) {
      return { error }
    }
  }

  const resendVerificationEmail = async () => {
    if (!user?.email) return { error: new Error('No email found') }

    try {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
      })

      return { data, error }
    } catch (error) {
      return { error }
    }
  }

  return {
    user,
    profile,
    session,
    signUp,
    signIn,
    signInWithMagicLink,
    signInWithGoogle,
    signOut,
    updateProfile,
    resetPassword,
    updatePassword,
    isVerified,
    resendVerificationEmail
  }
}
