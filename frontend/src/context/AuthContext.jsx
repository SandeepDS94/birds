import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, fullName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      let friendlyMessage = err.message || 'Registration failed.';
      if (friendlyMessage.includes('already registered')) {
        friendlyMessage = 'An account with this email already exists. Please log in.';
      } else if (friendlyMessage.includes('Password should be')) {
        friendlyMessage = 'Password must be at least 6 characters long.';
      }
      return { data: null, error: friendlyMessage };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      let friendlyMessage = err.message || 'Sign in failed.';
      if (friendlyMessage.includes('Invalid login credentials')) {
        friendlyMessage = 'Invalid email or password. Please verify your details.';
      } else if (friendlyMessage.includes('Email not confirmed')) {
        friendlyMessage = 'Your email is not confirmed. Please check your inbox or disable email confirmation in Supabase Auth settings.';
      }
      return { data: null, error: friendlyMessage };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
