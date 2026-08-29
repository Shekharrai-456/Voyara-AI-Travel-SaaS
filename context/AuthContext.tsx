'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types/trip';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signInWithGoogle: async () => {},
  loginWithEmail: async () => {},
  signUpWithEmail: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUserProfile = async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (data && !error) {
        setUserProfile({
          uid: data.id,
          email: data.email || currentUser.email || '',
          displayName: data.display_name || currentUser.user_metadata?.full_name || 'Traveler',
          photoURL: data.photo_url || currentUser.user_metadata?.avatar_url || '',
          createdAt: data.created_at || new Date().toISOString(),
        });
      } else {
        // Fallback / Initial Profile creation
        const newProfile: UserProfile = {
          uid: currentUser.id,
          email: currentUser.email || '',
          displayName: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Traveler',
          photoURL: currentUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.email || 'traveler')}`,
          createdAt: new Date().toISOString(),
        };

        // Attempt upsert to Supabase
        try {
          await supabase.from('profiles').upsert({
            id: currentUser.id,
            email: newProfile.email,
            display_name: newProfile.displayName,
            photo_url: newProfile.photoURL,
            created_at: newProfile.createdAt,
          });
        } catch (e) {}

        setUserProfile(newProfile);
      }
    } catch (err) {
      console.error('Error fetching Supabase user profile:', err);
      // Fallback local profile
      setUserProfile({
        uid: currentUser.id,
        email: currentUser.email || '',
        displayName: currentUser.user_metadata?.full_name || 'Traveler',
        photoURL: currentUser.user_metadata?.avatar_url || '',
        createdAt: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchUserProfile(currentUser);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchUserProfile(currentUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Error signing in with Google via Supabase:', error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) {
        if (error.message?.toLowerCase().includes('email not confirmed')) {
          throw new Error("Email not confirmed. Please check your inbox for the verification link, or turn off 'Confirm email' in your Supabase Dashboard -> Auth -> Providers -> Email settings for instant testing.");
        }
        throw error;
      }
      if (data.user) {
        await fetchUserProfile(data.user);
      }
    } catch (error: any) {
      console.error('Supabase Login failed:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: { full_name: name },
        },
      });
      if (error) throw error;
      if (data.user) {
        const newProfile: UserProfile = {
          uid: data.user.id,
          email,
          displayName: name,
          photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
          createdAt: new Date().toISOString(),
        };

        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email,
            display_name: name,
            photo_url: newProfile.photoURL,
          });
        } catch (e) {}

        // Ensure user is signed out after registration so they are directed to Sign In page
        await supabase.auth.signOut();
        setUser(null);
        setUserProfile(null);

        // If email confirmation is required by Supabase project settings
        if (!data.session) {
          throw new Error("Account created! Please check your email inbox to confirm your account before logging in.");
        }
      }
    } catch (error: any) {
      console.error('Supabase Signup failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      signInWithGoogle,
      loginWithEmail,
      signUpWithEmail,
      logout,
      resetPassword,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
