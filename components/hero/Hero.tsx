'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Sparkles, MapPin, ArrowRight, Compass, ShieldCheck, Sun, Users, DollarSign } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Hero() {
  const { user } = useAuth();
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 bg-[#FDFCFB] dark:bg-[#0B0A0F] transition-colors duration-300">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-500/15 via-violet-500/10 to-cyan-500/15 blur-3xl rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Text Column */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-cyan-300 text-xs font-bold uppercase tracking-widest shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400" />
              <span>PLAN LESS. TRAVEL MORE.</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-[1.1]"
            >
              Plan your next journey with <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent">AI.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-300 max-w-2xl font-normal leading-relaxed"
            >
              Tell us where you want to go, what you love, and how much you want to spend. We&apos;ll create the perfect trip for you in seconds.
            </motion.p>

            {/* CTAs & Quick Feature Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="pt-2 flex flex-wrap items-center gap-4"
            >
              <Link
                href={user ? "/create-trip" : "/login?redirect=/create-trip&reason=plan"}
                className="px-7 py-3.5 rounded-2xl text-base font-semibold bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Plan My Trip
              </Link>
              <Link
                href="#explore"
                className="px-6 py-3.5 rounded-2xl text-base font-semibold border border-neutral-300 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 text-neutral-800 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all flex items-center gap-2 shadow-sm"
              >
                Explore Destinations
                <ArrowRight className="w-4 h-4 text-neutral-500" />
              </Link>
            </motion.div>

            {/* Micro Specs */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="pt-6 flex items-center gap-6 text-xs text-neutral-500 dark:text-neutral-400 font-medium"
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Real Google Places
              </span>
              <span className="flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-indigo-500" /> Interactive Mapbox
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-500" /> Gemini 2.5 Flash
              </span>
            </motion.div>
          </div>

          {/* Right Hero Visual Column with Floating Cards */}
          <div className="lg:col-span-5 relative flex justify-center items-center mt-6 lg:mt-0">
            {/* Main Destination Hero Image Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              className="relative w-full max-w-md h-[420px] rounded-3xl overflow-hidden shadow-2xl border border-neutral-200/80 dark:border-neutral-800/80 group"
            >
              {/* Cover Photo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1000&q=80"
                alt="Pokhara Nepal Phewa Lake"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/20 to-transparent" />

              {/* Bottom Image Overlay text */}
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5" /> Featured Destination
                </div>
                <h3 className="text-2xl font-bold tracking-tight">Pokhara, Nepal</h3>
                <p className="text-xs text-neutral-300 font-normal">
                  Serene lakes, Annapurna mountain views & lakeside cafes
                </p>
              </div>
            </motion.div>

            {/* Floating Card 1: ✈️ 7 Days in Nepal */}
            <motion.div
              initial={{ opacity: 0, x: -30, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="absolute -bottom-6 -left-4 sm:-left-8 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xl max-w-[210px] space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1">
                  ✈️ 7 Days in Nepal
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                  AI Optimized
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-indigo-500" /> NPR 45,000
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-cyan-500" /> 2 Travelers
                </span>
              </div>
            </motion.div>

            {/* Floating Card 2: ✨ AI Recommendation */}
            <motion.div
              initial={{ opacity: 0, x: 30, y: -20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="absolute -top-6 -right-2 sm:-right-6 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xl max-w-[200px] space-y-1"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-cyan-400">
                <Sparkles className="w-3.5 h-3.5" /> AI Recommendation
              </div>
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-amber-500" /> Best sunrise:
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium pl-4">
                Sarangkot View Point
              </p>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}
