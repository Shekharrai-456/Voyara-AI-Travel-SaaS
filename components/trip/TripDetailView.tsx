'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TripData, Activity } from '@/types/trip';
import DayTimeline from '@/components/itinerary/DayTimeline';
import TripMap from '@/components/map/TripMap';
import BudgetVisualizer from '@/components/budget/BudgetVisualizer';
import AITravelAssistant from '@/components/chat/AITravelAssistant';
import { 
  MapPin, Calendar, Users, DollarSign, Share2, Trash2, RefreshCw, 
  Sparkles, Compass, Edit, PieChart, MessageSquare, ArrowLeft, Check
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';

interface TripDetailViewProps {
  initialTrip: TripData;
}

export default function TripDetailView({ initialTrip }: TripDetailViewProps) {
  const router = useRouter();
  const [trip, setTrip] = useState<TripData>(initialTrip);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'map' | 'budget' | 'assistant'>('itinerary');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Collect all activities across all days for the map
  const allActivities = trip.itinerary.flatMap((d) => d.activities);

  const handleUpdateTrip = async (updatedItinerary: any[], updatedBudget?: number) => {
    const newTrip = {
      ...trip,
      itinerary: updatedItinerary,
      estimatedBudget: updatedBudget || trip.estimatedBudget,
      updatedAt: new Date().toISOString(),
    };

    setTrip(newTrip);

    // Save update to Firestore if not demo
    if (!trip.id.startsWith('demo-')) {
      try {
        await updateDoc(doc(db, 'trips', trip.id), {
          itinerary: updatedItinerary,
          estimatedBudget: newTrip.estimatedBudget,
          updatedAt: newTrip.updatedAt,
        });
      } catch (err) {
        console.error('Failed to update trip in Firestore:', err);
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this trip itinerary?')) return;
    setIsDeleting(true);
    try {
      if (!trip.id.startsWith('demo-')) {
        await deleteDoc(doc(db, 'trips', trip.id));
      } else {
        localStorage.removeItem(`trip_${trip.id}`);
      }
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to delete trip:', err);
      setIsDeleting(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch('/api/generate-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trip),
      });

      if (res.ok) {
        const newData = await res.json();
        const updated = {
          ...newData,
          id: trip.id,
          userId: trip.userId,
        };
        setTrip(updated);

        if (!trip.id.startsWith('demo-')) {
          await updateDoc(doc(db, 'trips', trip.id), updated);
        }
      }
    } catch (err) {
      console.error('Error regenerating:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Trip URL copied to clipboard! You can now share it with friends.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
          ✨ AI Optimized Itinerary
        </span>
      </div>

      {/* Top Banner Hero Header */}
      <div className="relative rounded-3xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 shadow-xl bg-neutral-900 text-white min-h-[280px] flex flex-col justify-end p-6 md:p-10">
        {/* Cover Photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={trip.destinationImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80'}
          alt={trip.destination}
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
                <MapPin className="w-4 h-4" /> {trip.destination}
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                {trip.destination}
              </h1>
              <p className="text-sm sm:text-base text-neutral-300 font-normal mt-1 flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  {trip.durationDays} Days ({trip.startDate} – {trip.endDate})
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-cyan-400" />
                  {trip.travelers} {trip.travelers === 1 ? 'Traveler' : 'Travelers'}
                </span>
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <DollarSign className="w-4 h-4" />
                  {trip.currency} {trip.estimatedBudget?.toLocaleString() || 0} estimated
                </span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/20"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                Regenerate
              </button>
              <button
                onClick={handleShare}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/20"
              >
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 transition-all border border-rose-500/30"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive View Tabs (Desktop Grid or Tab Switcher) */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('itinerary')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'itinerary'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Calendar className="w-4 h-4" /> Day-by-Day Itinerary
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'map'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Compass className="w-4 h-4" /> Interactive Map
        </button>

        <button
          onClick={() => setActiveTab('budget')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'budget'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <PieChart className="w-4 h-4" /> Budget Breakdown
        </button>

        <button
          onClick={() => setActiveTab('assistant')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'assistant'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" /> AI Assistant Chat
        </button>
      </div>

      {/* Split Desktop Layout: Left Content & Right Sticky Sidebar Map/Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Content Area */}
        <div className="lg:col-span-7 space-y-6">
          {activeTab === 'itinerary' && (
            <DayTimeline
              itinerary={trip.itinerary}
              currency={trip.currency}
              selectedActivityId={selectedActivity?.id}
              onSelectActivity={(act) => {
                setSelectedActivity(act);
                setActiveTab('map');
              }}
            />
          )}

          {activeTab === 'map' && (
            <div className="h-[550px]">
              <TripMap
                activities={allActivities}
                centerCoordinates={trip.destinationCoordinates}
                selectedActivityId={selectedActivity?.id}
                onSelectActivity={(act) => setSelectedActivity(act)}
              />
            </div>
          )}

          {activeTab === 'budget' && (
            <BudgetVisualizer
              breakdown={trip.budgetBreakdown}
              currency={trip.currency}
              totalBudget={trip.estimatedBudget}
            />
          )}

          {activeTab === 'assistant' && (
            <AITravelAssistant
              tripData={trip}
              onUpdateTrip={handleUpdateTrip}
            />
          )}
        </div>

        {/* Right Desktop Auxiliary Sidebar */}
        <div className="hidden lg:block lg:col-span-5 sticky top-24 space-y-6">
          {activeTab !== 'map' && (
            <div className="h-[360px] rounded-3xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 shadow-md">
              <TripMap
                activities={allActivities}
                centerCoordinates={trip.destinationCoordinates}
                selectedActivityId={selectedActivity?.id}
                onSelectActivity={(act) => setSelectedActivity(act)}
              />
            </div>
          )}

          {activeTab !== 'assistant' && (
            <AITravelAssistant
              tripData={trip}
              onUpdateTrip={handleUpdateTrip}
            />
          )}
        </div>
      </div>
    </div>
  );
}
