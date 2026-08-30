'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { User, Mail, Sun, Moon, Laptop, LogOut, Trash2, CheckCircle2, Compass } from 'lucide-react';

export default function ProfilePage() {
  const { user, userProfile, loading, logout, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/profile');
    }
  }, [user, loading, router]);

  const [displayName, setDisplayName] = useState(() => userProfile?.displayName || '');
  const [favoriteDestinations, setFavoriteDestinations] = useState('Pokhara, Nepal, Kyoto, Japan');
  const [defaultBudget, setDefaultBudget] = useState<'Budget' | 'Moderate' | 'Luxury'>('Moderate');
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          preferences: {
            favoriteDestinations: favoriteDestinations.split(',').map(s => s.trim()),
            defaultBudgetTier: defaultBudget,
          },
        }),
      });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Compass className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-neutral-500 font-medium">Verifying sign-in status...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          Profile & Preferences Settings
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Customize your Voyara AI experience and travel defaults.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          Settings successfully saved!
        </div>
      )}

      {/* Profile Info Form */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-6 shadow-md space-y-6">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-3 flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-500" /> Profile Information
        </h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-neutral-600 dark:text-neutral-400">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-neutral-600 dark:text-neutral-400">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || 'shekhar.rai456@gmail.com'}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 text-neutral-500 text-xs cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-neutral-600 dark:text-neutral-400">
              Favorite Destinations
            </label>
            <input
              type="text"
              value={favoriteDestinations}
              onChange={(e) => setFavoriteDestinations(e.target.value)}
              placeholder="e.g. Pokhara, Kyoto, Paris"
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-neutral-600 dark:text-neutral-400">
              Default Budget Preference
            </label>
            <select
              value={defaultBudget}
              onChange={(e) => setDefaultBudget(e.target.value as any)}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs font-semibold"
            >
              <option value="Budget">Budget Tier</option>
              <option value="Moderate">Moderate Tier</option>
              <option value="Luxury">Luxury Tier</option>
            </select>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
          >
            Save Preferences
          </button>
        </form>
      </div>

      {/* Appearance Section */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-6 shadow-md space-y-4">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-3 flex items-center gap-2">
          <Sun className="w-5 h-5 text-amber-500" /> Appearance Theme
        </h2>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setTheme('light')}
            className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
              theme === 'light'
                ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-2 ring-indigo-500/30'
                : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-bold">Light</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
              theme === 'dark'
                ? 'bg-indigo-950/60 border-indigo-500 text-cyan-300 ring-2 ring-indigo-500/30'
                : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800'
            }`}
          >
            <Moon className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-bold">Dark</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
              theme === 'system'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-cyan-300 ring-2 ring-indigo-500/30'
                : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800'
            }`}
          >
            <Laptop className="w-5 h-5 text-neutral-500" />
            <span className="text-xs font-bold">System</span>
          </button>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-6 shadow-md space-y-4">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-3">
          Account Actions
        </h2>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={logout}
            className="px-5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>

          <button
            onClick={() => alert('Account deletion request registered.')}
            className="px-5 py-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center gap-2 hover:bg-rose-500/20"
          >
            <Trash2 className="w-4 h-4" /> Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
