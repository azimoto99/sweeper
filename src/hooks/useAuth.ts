import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User as AppUser } from '../types';
import { useLoading } from './useLoading';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const { showLoading, hideLoading } = useLoading();
  const navigate = useNavigate();

  useEffect(() => {
    showLoading();
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsVerified(!!session?.user?.email_confirmed_at);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        hideLoading();
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      showLoading();
      setSession(session);
      setUser(session?.user ?? null);
      setIsVerified(!!session?.user?.email_confirmed_at);

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        hideLoading();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      hideLoading();
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'customer' | 'worker' = 'customer') => {
    showLoading();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });
    hideLoading();
    return { data, error };
  };

  const signIn = async (email: string, password: string, rememberMe?: boolean) => {
    showLoading();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (data.session && rememberMe) {
      // Session is automatically handled by Supabase
      console.log('Remember me enabled for session')
    }

    hideLoading();
    return { data, error };
  };

  const signInWithMagicLink = async (email: string) => {
    showLoading();
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    hideLoading();
    return { data, error };
  };

  const signInWithGoogle = async () => {
    showLoading();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    hideLoading();
    return { data, error };
  };

  const signOut = async () => {
    showLoading();
    const { error } = await supabase.auth.signOut();
    if (!error) {
      navigate('/auth/login');
    }
    hideLoading();
    return { error };
  };

  const updateProfile = async (updates: Partial<AppUser>) => {
    showLoading();
    if (!user) {
      hideLoading();
      return { error: new Error('No user logged in') };
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
    }

    hideLoading();
    return { data, error };
  };

  const resetPassword = async (email: string) => {
    showLoading();
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    hideLoading();
    return { data, error };
  };

  const updatePassword = async (password: string) => {
    showLoading();
    const { data, error } = await supabase.auth.updateUser({ password });
    hideLoading();
    return { data, error };
  };

  const resendVerificationEmail = async () => {
    showLoading();
    if (!user) {
      hideLoading();
      return { error: new Error('No user logged in') };
    }

    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email || '',
    });

    hideLoading();
    return { data, error };
  };

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
    resendVerificationEmail,
  };
}
