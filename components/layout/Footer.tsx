import React from 'react';
import Link from 'next/link';
import { Compass, Sparkles, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50 dark:bg-neutral-950/80 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Compass className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-neutral-900 to-indigo-600 dark:from-white dark:to-cyan-400 bg-clip-text text-transparent">
                Voyara<span className="text-indigo-600 dark:text-cyan-400">.ai</span>
              </span>
            </Link>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Plan less. Travel more. Voyara AI creates personalized travel itineraries powered by cutting-edge Gemini AI, Google Places, and interactive maps.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white mb-3">
              Explore
            </h3>
            <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
              <li><Link href="/create-trip" className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors">AI Trip Planner</Link></li>
              <li><Link href="/dashboard" className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors">Saved Destinations</Link></li>
              <li><Link href="/#popular" className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors">Featured Routes</Link></li>
              <li><Link href="/profile" className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors">Travel Styles</Link></li>
            </ul>
          </div>

          {/* Product Features */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white mb-3">
              Capabilities
            </h3>
            <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
              <li className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-indigo-500" /> Gemini 2.5 Flash Engine</li>
              <li>Mapbox & Google Places</li>
              <li>Dynamic Budget Health</li>
              <li>AI Travel Concierge Chat</li>
            </ul>
          </div>

          {/* SaaS Commitment */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white mb-3">
              Voyara SaaS
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Designed for modern travelers, digital nomads, and explorers seeking seamless personalized adventures worldwide.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-neutral-200/60 dark:border-neutral-900 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 dark:text-neutral-500 gap-4">
          <p>© {new Date().getFullYear()} Voyara AI. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> using Next.js & Google Gemini
          </p>
        </div>
      </div>
    </footer>
  );
}
