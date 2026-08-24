'use client';

import React, { useState } from 'react';
import { TripData } from '@/types/trip';
import TripCard from './TripCard';
import { Search, Filter, Compass, Plus } from 'lucide-react';
import Link from 'next/link';

interface TripsGridProps {
  trips: TripData[];
  onDeleteTrip?: (id: string) => void;
}

export default function TripsGrid({ trips, onDeleteTrip }: TripsGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Upcoming' | 'Completed' | 'Draft'>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'duration' | 'budget'>('newest');

  const filteredTrips = trips.filter((t) => {
    const matchesSearch = t.destination.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'All' || t.status === activeTab;
    return matchesSearch && matchesTab;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === 'duration') return b.durationDays - a.durationDays;
    if (sortBy === 'budget') return b.estimatedBudget - a.estimatedBudget;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-4 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {(['All', 'Upcoming', 'Completed', 'Draft'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search destination..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-white text-xs font-semibold"
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="duration">Sort: Duration</option>
            <option value="budget">Sort: Budget</option>
          </select>
        </div>
      </div>

      {/* Grid or Empty State */}
      {filteredTrips.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onDelete={onDeleteTrip} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-white dark:bg-neutral-900/50 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-8 space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-cyan-400 flex items-center justify-center mx-auto">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
            No trips found
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {searchQuery ? `No itineraries match "${searchQuery}"` : 'You haven\'t created any AI travel itineraries yet.'}
          </p>
          <Link
            href="/create-trip"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all"
          >
            <Plus className="w-4 h-4" /> Create New Trip
          </Link>
        </div>
      )}
    </div>
  );
}
