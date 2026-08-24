'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { TripData } from '@/types/trip';
import { MapPin, Calendar, Users, DollarSign, ArrowRight, MoreVertical, Trash2, Share2, RefreshCw } from 'lucide-react';

interface TripCardProps {
  trip: TripData;
  onDelete?: (id: string) => void;
}

export default function TripCard({ trip, onDelete }: TripCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group relative rounded-3xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md hover:shadow-xl transition-all flex flex-col"
    >
      {/* Cover Image Header */}
      <div className="relative h-48 w-full overflow-hidden bg-neutral-200 dark:bg-neutral-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={trip.destinationImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'}
          alt={trip.destination}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md text-[10px] font-bold text-neutral-900 dark:text-white border border-white/20 shadow-sm">
            {trip.durationDays} Days · {trip.budgetTier}
          </span>

          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(!menuOpen);
              }}
              className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors backdrop-blur-md"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl p-1.5 z-20">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuOpen(false);
                    navigator.clipboard.writeText(window.location.origin + `/trips/${trip.id}`);
                    alert('Trip link copied to clipboard!');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share Trip
                </button>
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setMenuOpen(false);
                      onDelete(trip.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Trip
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Destination Title on Image */}
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <div className="flex items-center gap-1 text-cyan-400 text-[10px] font-bold uppercase tracking-wider">
            <MapPin className="w-3 h-3" /> {trip.destination}
          </div>
          <h3 className="text-xl font-extrabold tracking-tight truncate">
            {trip.destination}
          </h3>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600 dark:text-neutral-400 font-medium">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            {trip.travelers} {trip.travelers === 1 ? 'Traveler' : 'Travelers'}
          </span>
          <span className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            {trip.currency} {trip.estimatedBudget?.toLocaleString() || 0}
          </span>
        </div>

        {/* Styles Tags */}
        {trip.travelStyles && trip.travelStyles.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {trip.travelStyles.slice(0, 3).map((st) => (
              <span key={st} className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] font-semibold text-neutral-600 dark:text-neutral-300">
                {st}
              </span>
            ))}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
          <span className="text-[11px] text-neutral-400">
            Created {new Date(trip.createdAt).toLocaleDateString()}
          </span>

          <Link
            href={`/trips/${trip.id}`}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-cyan-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-cyan-500 dark:hover:text-neutral-950 transition-all flex items-center gap-1"
          >
            View Trip <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
