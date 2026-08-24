'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MapPin, Compass, DollarSign, CheckCircle2 } from 'lucide-react';

interface LoaderProps {
  destination: string;
}

const STEPS = [
  { text: 'Finding the best places', icon: MapPin },
  { text: 'Analyzing your preferences', icon: Sparkles },
  { text: 'Optimizing your itinerary', icon: Compass },
  { text: 'Building your route', icon: MapPin },
  { text: 'Finalizing your trip', icon: DollarSign },
];

export default function AIGenerationLoader({ destination }: LoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] p-8 text-center max-w-lg mx-auto">
      {/* Glow pulse container */}
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-violet-500 to-cyan-500 blur-xl opacity-50 animate-pulse" />
        <div className="relative w-24 h-24 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-cyan-400 shadow-2xl">
          <Compass className="w-12 h-12 animate-spin" style={{ animationDuration: '8s' }} />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2 mb-8"
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" /> AI Engine Active
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          Planning your journey to {destination}...
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Generating custom daily schedules, coordinates, and budget optimizations.
        </p>
      </motion.div>

      {/* Steps List */}
      <div className="w-full space-y-3 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 text-left shadow-sm">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;
          const Icon = step.icon;

          return (
            <motion.div
              key={step.text}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                isCurrent
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60'
                  : isDone
                  ? 'bg-neutral-50 dark:bg-neutral-950/40 opacity-75'
                  : 'opacity-40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                    isDone
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-indigo-600 text-white animate-bounce'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <span
                  className={`text-xs font-semibold ${
                    isCurrent
                      ? 'text-indigo-900 dark:text-cyan-300'
                      : isDone
                      ? 'text-neutral-700 dark:text-neutral-300'
                      : 'text-neutral-400'
                  }`}
                >
                  {step.text}
                </span>
              </div>

              {isCurrent && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
