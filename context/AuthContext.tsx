'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '@/types/trip';

export interface AppUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: AppUser | null;
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
  const [user, setUser] = useState<AppUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setUser({ id: data.user.uid, email: data.user.email });
        setUserProfile({
          uid: data.user.uid,
          email: data.user.email,
          displayName: data.user.displayName,
          photoURL: data.user.photoURL,
          createdAt: data.user.createdAt,
          preferences: data.user.preferences,
        });
      } else {
        setUser(null);
        setUserProfile(null);
      }
    } catch (err) {
      console.error('Failed to fetch session:', err);
      setUser(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!ignore) {
          if (data.user) {
            setUser({ id: data.user.uid, email: data.user.email });
            setUserProfile({
              uid: data.user.uid,
              email: data.user.email,
              displayName: data.user.displayName,
              photoURL: data.user.photoURL,
              createdAt: data.user.createdAt,
              preferences: data.user.preferences,
            });
          } else {
            setUser(null);
            setUserProfile(null);
          }
        }
      } catch (err) {
        console.error('Failed to fetch session:', err);
        if (!ignore) {
          setUser(null);
          setUserProfile(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    loadSession();
    return () => {
      ignore = true;
    };
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to sign in');
    }

    setUser({ id: data.user.uid, email: data.user.email });
    setUserProfile({
      uid: data.user.uid,
      email: data.user.email,
      displayName: data.user.displayName,
      photoURL: data.user.photoURL,
      createdAt: data.user.createdAt,
      preferences: data.user.preferences,
    });
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass, name }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to register');
    }

    // Clear session so user logs in on Sign In page
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setUserProfile(null);
  };

  const signInWithGoogle = async () => {
    throw new Error('Google OAuth is disabled. Please sign in with email & password.');
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setUserProfile(null);
  };

  const resetPassword = async (email: string) => {
    throw new Error('Password reset is not enabled for local JWT authentication.');
  };

  const refreshProfile = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signInWithGoogle,
        loginWithEmail,
        signUpWithEmail,
        logout,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
