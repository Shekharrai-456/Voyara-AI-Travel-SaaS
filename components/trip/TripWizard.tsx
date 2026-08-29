'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, Calendar, Users, DollarSign, Sparkles, Compass, 
  ArrowRight, ArrowLeft, Check, Utensils, Hotel, Car, Zap, 
  Search, Info
} from 'lucide-react';
import { TripPreferences, BudgetTier, TravelStyle, TripData } from '@/types/trip';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import AIGenerationLoader from './AIGenerationLoader';

const POPULAR_DESTINATIONS = [
  { name: 'Pokhara, Nepal', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=400&q=80', country: 'Nepal' },
  { name: 'Tokyo, Japan', image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=80', country: 'Japan' },
  { name: 'Kyoto, Japan', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=400&q=80', country: 'Japan' },
  { name: 'Paris, France', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&q=80', country: 'France' },
  { name: 'Bali, Indonesia', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=400&q=80', country: 'Indonesia' },
  { name: 'Kathmandu, Nepal', image: 'https://images.unsplash.com/photo-1518002171953-a0847b3df59f?auto=format&fit=crop&w=400&q=80', country: 'Nepal' },
  { name: 'New York, USA', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=400&q=80', country: 'USA' },
  { name: 'Rome, Italy', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=400&q=80', country: 'Italy' },
];

const TRAVEL_STYLES: { name: TravelStyle; icon: string; desc: string }[] = [
  { name: 'Adventure', icon: '🏔️', desc: 'Hiking, outdoor sports & thrill-seeking' },
  { name: 'Relaxation', icon: '🧘', desc: 'Spas, quiet beaches & peaceful vibes' },
  { name: 'Culture', icon: '🏛️', desc: 'Museums, monuments & local heritage' },
  { name: 'Food', icon: '🍜', desc: 'Street food, fine dining & local tasting' },
  { name: 'Nature', icon: '🌿', desc: 'National parks, lakes & flora' },
  { name: 'Photography', icon: '📸', desc: 'Iconic viewpoints & aesthetic spots' },
  { name: 'Shopping', icon: '🛍️', desc: 'Markets, boutiques & souvenirs' },
  { name: 'Nightlife', icon: '🍸', desc: 'Bars, music venues & late night' },
  { name: 'History', icon: '📜', desc: 'Ancient ruins & historical walks' },
  { name: 'Family', icon: '👨‍👩‍👧', desc: 'Kid-friendly, safe & easy pacing' },
];

export default function TripWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [destination, setDestination] = useState<string>('Pokhara, Nepal');
  const [startDate, setStartDate] = useState<string>('2026-09-01');
  const [endDate, setEndDate] = useState<string>('2026-09-05');
  const [travelers, setTravelers] = useState<number>(2);
  const [budgetTier, setBudgetTier] = useState<BudgetTier>('Moderate');
  const [currency, setCurrency] = useState<string>('NPR');
  const [selectedStyles, setSelectedStyles] = useState<TravelStyle[]>(['Adventure', 'Culture', 'Food']);
  
  // Preferences State
  const [foodPreferences, setFoodPreferences] = useState<string>('Local specialties, Vegetarian friendly');
  const [accommodationType, setAccommodationType] = useState<string>('Boutique Hotel / Lake View');
  const [transportationMode, setTransportationMode] = useState<string>('Private Car & Walking');
  const [activityIntensity, setActivityIntensity] = useState<'Paced' | 'Balanced' | 'Action-Packed'>('Balanced');
  const [specialRequirements, setSpecialRequirements] = useState<string>('Prefer sunrise activities and lakeside relaxation');

  // Calculate Duration
  const calculateDuration = () => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diffDays) || diffDays < 1 ? 5 : diffDays;
  };

  const toggleStyle = (style: TravelStyle) => {
    setSelectedStyles(prev => 
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  const handleGenerateTrip = async () => {
    if (!user) {
      router.push('/login?redirect=/create-trip&reason=plan');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    const preferences: TripPreferences = {
      destination,
      startDate,
      endDate,
      durationDays: calculateDuration(),
      travelers,
      budgetTier,
      currency,
      travelStyles: selectedStyles,
      foodPreferences: foodPreferences.split(',').map(s => s.trim()).filter(Boolean),
      accommodationType,
      transportationMode,
      activityIntensity,
      specialRequirements,
    };

    try {
      const res = await fetch('/api/generate-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to generate trip');
      }

      const generatedTripData: TripData = await res.json();

      // Save to Supabase if user logged in
      let tripId = 'demo-' + Date.now();
      if (user) {
        const newId = 'trip-' + Date.now();
        const tripPayload = {
          id: newId,
          user_id: user.id,
          destination: generatedTripData.destination,
          destination_image: generatedTripData.destinationImage,
          start_date: generatedTripData.startDate,
          end_date: generatedTripData.endDate,
          duration_days: generatedTripData.durationDays,
          travelers: generatedTripData.travelers,
          budget_tier: generatedTripData.budgetTier,
          currency: generatedTripData.currency,
          estimated_budget: generatedTripData.estimatedBudget,
          travel_styles: generatedTripData.travelStyles,
          status: generatedTripData.status || 'Upcoming',
          destination_coordinates: generatedTripData.destinationCoordinates,
          budget_breakdown: generatedTripData.budgetBreakdown,
          itinerary: generatedTripData.itinerary,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('trips').insert([tripPayload]);
        if (!error) {
          tripId = newId;
        } else {
          console.warn('Supabase insert failed, caching locally:', error.message);
        }
      }

      // Store in localStorage for instant access & offline caching
      localStorage.setItem(`trip_${tripId}`, JSON.stringify({ ...generatedTripData, id: tripId }));

      router.push(`/trips/${tripId}`);
    } catch (err: any) {
      console.error('Trip generation error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred while generating the trip.');
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return <AIGenerationLoader destination={destination} />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Wizard Progress Bar */}
      <div className="mb-8 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-500">
          <span>Step {step} of 4</span>
          <span>
            {step === 1 && 'Destination'}
            {step === 2 && 'Trip Details'}
            {step === 3 && 'Travel Style'}
            {step === 4 && 'Preferences'}
          </span>
        </div>
        <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 h-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="font-bold underline text-xs">Dismiss</button>
        </div>
      )}

      {/* STEP 1: DESTINATION */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div className="text-left space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
              Where do you want to go?
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Enter any city, country, or region in the world.
            </p>
          </div>

          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Pokhara, Nepal or Kyoto, Japan"
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Popular Destinations
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {POPULAR_DESTINATIONS.map((pop) => (
                <button
                  key={pop.name}
                  onClick={() => setDestination(pop.name)}
                  className={`group relative h-28 rounded-2xl overflow-hidden border text-left transition-all ${
                    destination === pop.name 
                      ? 'border-indigo-600 ring-2 ring-indigo-500' 
                      : 'border-neutral-200 dark:border-neutral-800'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pop.image} alt={pop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/30 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 text-white">
                    <p className="text-xs font-bold truncate">{pop.name}</p>
                    <p className="text-[10px] text-neutral-300">{pop.country}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* STEP 2: TRIP DETAILS */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div className="text-left space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
              Trip Details for {destination}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Specify your travel dates, group size, and budget tier.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-500" /> Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-500" /> End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Travelers & Duration info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-500" /> Number of Travelers
              </label>
              <div className="flex items-center gap-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 p-2 rounded-xl">
                <button
                  onClick={() => setTravelers(Math.max(1, travelers - 1))}
                  className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 font-bold text-neutral-800 dark:text-white"
                >
                  -
                </button>
                <span className="flex-1 text-center font-bold text-lg text-neutral-900 dark:text-white">
                  {travelers} {travelers === 1 ? 'Traveler' : 'Travelers'}
                </span>
                <button
                  onClick={() => setTravelers(travelers + 1)}
                  className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 font-bold text-neutral-800 dark:text-white"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-500" /> Target Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-medium"
              >
                <option value="NPR">NPR - Nepalese Rupee</option>
                <option value="USD">USD - US Dollar ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="INR">INR - Indian Rupee (₹)</option>
                <option value="GBP">GBP - British Pound (£)</option>
                <option value="JPY">JPY - Japanese Yen (¥)</option>
              </select>
            </div>
          </div>

          {/* Budget Tier */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-neutral-600 dark:text-neutral-400">
              Budget Tier
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['Budget', 'Moderate', 'Luxury'] as BudgetTier[]).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setBudgetTier(tier)}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    budgetTier === tier
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-600 text-indigo-900 dark:text-cyan-300 ring-2 ring-indigo-500/50'
                      : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <p className="font-bold text-base">{tier}</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {tier === 'Budget' && 'Hostels, local transit & deals'}
                    {tier === 'Moderate' && '3-4★ hotels & balanced spending'}
                    {tier === 'Luxury' && '5★ resorts, private tours & fine dining'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* STEP 3: TRAVEL STYLE */}
      {step === 3 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div className="text-left space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
              What is your travel style?
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Select all styles that apply to customize your activities.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {TRAVEL_STYLES.map((st) => {
              const isSelected = selectedStyles.includes(st.name);
              return (
                <button
                  key={st.name}
                  onClick={() => toggleStyle(st.name)}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'bg-gradient-to-tr from-indigo-50 to-cyan-50 dark:from-indigo-950/60 dark:to-cyan-950/60 border-indigo-500 text-indigo-950 dark:text-cyan-200 ring-2 ring-indigo-500/30'
                      : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{st.icon}</span>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-cyan-400 font-bold" />}
                  </div>
                  <div className="mt-3">
                    <p className="font-bold text-xs">{st.name}</p>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-0.5">{st.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* STEP 4: PREFERENCES */}
      {step === 4 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div className="text-left space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
              Final Preferences
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Fine-tune food, accommodation, and activity pacing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-amber-500" /> Food Preferences
              </label>
              <input
                type="text"
                value={foodPreferences}
                onChange={(e) => setFoodPreferences(e.target.value)}
                placeholder="e.g. Vegetarian, Local street food, Seafood"
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                <Hotel className="w-4 h-4 text-violet-500" /> Accommodation Style
              </label>
              <input
                type="text"
                value={accommodationType}
                onChange={(e) => setAccommodationType(e.target.value)}
                placeholder="e.g. Boutique Hotel, Resort with Pool, Central Apartment"
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                <Car className="w-4 h-4 text-blue-500" /> Transportation
              </label>
              <input
                type="text"
                value={transportationMode}
                onChange={(e) => setTransportationMode(e.target.value)}
                placeholder="e.g. Public Transit, Walking & Taxi, Rental Car"
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-yellow-500" /> Activity Pace
              </label>
              <select
                value={activityIntensity}
                onChange={(e) => setActivityIntensity(e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm"
              >
                <option value="Paced">Paced (Relaxed, 2-3 activities/day)</option>
                <option value="Balanced">Balanced (Standard, 3-4 activities/day)</option>
                <option value="Action-Packed">Action-Packed (High energy, 5+ activities/day)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-neutral-600 dark:text-neutral-400">
              Special Requirements or Notes
            </label>
            <textarea
              rows={2}
              value={specialRequirements}
              onChange={(e) => setSpecialRequirements(e.target.value)}
              placeholder="e.g. Need accessible paths, celebrating anniversary, early morning flights"
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm"
            />
          </div>
        </motion.div>
      )}

      {/* Navigation Buttons */}
      <div className="mt-8 pt-6 border-t border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between">
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="px-5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm font-semibold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        ) : <div />}

        {step < 4 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!destination.trim()}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center gap-1.5 shadow-md disabled:opacity-50"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleGenerateTrip}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 text-white font-bold text-base flex items-center gap-2 shadow-xl shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Sparkles className="w-5 h-5 animate-pulse" />
            Generate My AI Trip
          </button>
        )}
      </div>
    </div>
  );
}
