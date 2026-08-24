'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DayItinerary, Activity } from '@/types/trip';
import { 
  Clock, MapPin, DollarSign, Star, ChevronDown, ChevronUp, 
  Utensils, Hotel, Compass, Zap, Car, Sparkles, ExternalLink
} from 'lucide-react';

interface DayTimelineProps {
  itinerary: DayItinerary[];
  currency: string;
  selectedActivityId?: string | null;
  onSelectActivity?: (act: Activity) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Hotel: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900',
  Food: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900',
  Sightseeing: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900',
  Activity: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
  Transport: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900',
  Relaxation: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-900',
};

export default function DayTimeline({
  itinerary,
  currency,
  selectedActivityId,
  onSelectActivity
}: DayTimelineProps) {
  // Open all days by default
  const [openDays, setOpenDays] = useState<number[]>(itinerary.map(d => d.day));

  const toggleDay = (dayNum: number) => {
    setOpenDays(prev => 
      prev.includes(dayNum) ? prev.filter(d => d !== dayNum) : [...prev, dayNum]
    );
  };

  return (
    <div className="space-y-6">
      {itinerary.map((dayPlan) => {
        const isOpen = openDays.includes(dayPlan.day);

        return (
          <div
            key={dayPlan.day}
            className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 overflow-hidden shadow-md transition-all"
          >
            {/* Day Header Accordion Toggle */}
            <button
              onClick={() => toggleDay(dayPlan.day)}
              className="w-full px-6 py-5 flex items-center justify-between bg-neutral-50/80 dark:bg-neutral-900/60 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-extrabold text-sm flex flex-col items-center justify-center shadow-md shadow-indigo-500/20">
                  <span className="text-[10px] uppercase tracking-wider opacity-80">DAY</span>
                  <span className="text-lg leading-none">{dayPlan.day < 10 ? `0${dayPlan.day}` : dayPlan.day}</span>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-neutral-900 dark:text-white leading-tight">
                    {dayPlan.title}
                  </h3>
                  {dayPlan.theme && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Theme: {dayPlan.theme}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <span className="text-xs text-neutral-400 font-medium">Est. Day Budget</span>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {currency} {dayPlan.estimatedDayCost?.toLocaleString() || 0}
                  </p>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-neutral-500" /> : <ChevronDown className="w-5 h-5 text-neutral-500" />}
              </div>
            </button>

            {/* Activities List */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-6 py-6 border-t border-neutral-100 dark:border-neutral-800/80 space-y-6"
                >
                  <div className="relative pl-6 border-l-2 border-indigo-200 dark:border-neutral-800 space-y-8">
                    {dayPlan.activities.map((act) => {
                      const isSelected = act.id === selectedActivityId;
                      const badgeStyle = CATEGORY_COLORS[act.category] || CATEGORY_COLORS.Activity;

                      return (
                        <div key={act.id} className="relative group">
                          {/* Timeline Dot Indicator */}
                          <div 
                            className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-neutral-900 transition-all ${
                              isSelected ? 'bg-cyan-400 ring-4 ring-cyan-500/30 scale-125' : 'bg-indigo-600'
                            }`}
                          />

                          <div 
                            onClick={() => onSelectActivity && onSelectActivity(act)}
                            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg'
                                : 'bg-neutral-50/50 dark:bg-neutral-950/40 border-neutral-200/80 dark:border-neutral-800/80 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1 bg-white dark:bg-neutral-800 px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                  {act.time}
                                </span>
                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeStyle}`}>
                                  {act.category}
                                </span>
                              </div>

                              {act.estimatedCost > 0 && (
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900">
                                  {currency} {act.estimatedCost.toLocaleString()}
                                </span>
                              )}
                            </div>

                            <h4 className="text-base font-bold text-neutral-900 dark:text-white mb-1">
                              {act.title}
                            </h4>

                            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">
                              {act.description}
                            </p>

                            <div className="flex flex-wrap items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 pt-2 border-t border-neutral-200/50 dark:border-neutral-800/50 gap-2">
                              <span className="flex items-center gap-1 font-medium text-neutral-700 dark:text-neutral-300">
                                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                                {act.locationName}
                              </span>

                              {act.address && (
                                <span className="text-[11px] text-neutral-400 truncate max-w-[220px]">
                                  {act.address}
                                </span>
                              )}

                              {act.lat && act.lng && (
                                <button className="text-[11px] text-indigo-600 dark:text-cyan-400 font-semibold flex items-center gap-1 hover:underline ml-auto">
                                  View on Map <ExternalLink className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
