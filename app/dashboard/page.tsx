'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { TripData } from '@/types/trip';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import TripsGrid from '@/components/dashboard/TripsGrid';
import { Plus, MapPin, Calendar, Users, DollarSign, ArrowRight, Sparkles, Compass } from 'lucide-react';

// Default Sample Pokhara Trip for featured demonstration
const DEFAULT_POKHARA_TRIP: TripData = {
  id: 'demo-pokhara-001',
  userId: 'demo',
  destination: 'Pokhara, Nepal',
  destinationImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
  startDate: '2026-08-28',
  endDate: '2026-09-01',
  durationDays: 5,
  travelers: 2,
  budgetTier: 'Moderate',
  currency: 'NPR',
  estimatedBudget: 42000,
  travelStyles: ['Adventure', 'Relaxation', 'Culture'],
  status: 'Upcoming',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  destinationCoordinates: { lat: 28.2096, lng: 83.9856 },
  budgetBreakdown: {
    accommodation: 15000,
    food: 8000,
    transportation: 7000,
    activities: 6000,
    miscellaneous: 6000,
    total: 42000,
  },
  itinerary: [
    {
      day: 1,
      title: 'Arrival & Lakeside Exploration',
      theme: 'Relaxed Lake Vibes',
      estimatedDayCost: 5000,
      activities: [
        {
          id: 'act-101',
          time: '09:00 AM',
          title: 'Hotel Check-in & Breakfast',
          description: 'Settle into lakeside hotel and enjoy fresh Himalayan tea.',
          locationName: 'Lakeside Pokhara',
          category: 'Hotel',
          estimatedCost: 1500,
          durationMinutes: 60,
          lat: 28.2096,
          lng: 83.9856,
        },
        {
          id: 'act-102',
          time: '11:00 AM',
          title: 'Visit Phewa Lake & Tal Barahi Temple',
          description: 'Boating across Phewa Lake to island temple with Annapurna reflections.',
          locationName: 'Phewa Lake',
          category: 'Sightseeing',
          estimatedCost: 1200,
          durationMinutes: 120,
          lat: 28.2056,
          lng: 83.9556,
        },
        {
          id: 'act-103',
          time: '01:30 PM',
          title: 'Lakeside Nepalese Thali Lunch',
          description: 'Traditional organic Nepalese Thali at Moondance Restaurant.',
          locationName: 'Moondance Restaurant',
          category: 'Food',
          estimatedCost: 1000,
          durationMinutes: 60,
          lat: 28.212,
          lng: 83.96,
        },
        {
          id: 'act-104',
          time: '03:30 PM',
          title: 'International Mountain Museum',
          description: 'Explore Himalayan mountaineering history and indigenous culture exhibits.',
          locationName: 'Rato Pahir, Pokhara',
          category: 'Sightseeing',
          estimatedCost: 800,
          durationMinutes: 90,
          lat: 28.19,
          lng: 83.98,
        },
        {
          id: 'act-105',
          time: '06:00 PM',
          title: 'Lakeside Sunset & Acoustic Lounge',
          description: 'Unwind with sunset views over the water and live acoustic music.',
          locationName: 'Lakeside Promenade',
          category: 'Relaxation',
          estimatedCost: 500,
          durationMinutes: 120,
          lat: 28.21,
          lng: 83.96,
        },
      ],
    },
    {
      day: 2,
      title: 'Sunrise Sarangkot & Adventure',
      theme: 'Himalayan Views & Thrills',
      estimatedDayCost: 9500,
      activities: [
        {
          id: 'act-201',
          time: '05:00 AM',
          title: 'Sarangkot Himalayan Sunrise View',
          description: 'Watch the sun illuminate Dhaulagiri and Annapurna mountain peaks.',
          locationName: 'Sarangkot Hill',
          category: 'Sightseeing',
          estimatedCost: 1000,
          durationMinutes: 120,
          lat: 28.243,
          lng: 83.948,
        },
        {
          id: 'act-202',
          time: '09:00 AM',
          title: 'Tandem Paragliding Adventure',
          description: 'Fly over Pokhara valley with panoramic views of Phewa Lake.',
          locationName: 'Sarangkot Flight Point',
          category: 'Activity',
          estimatedCost: 6500,
          durationMinutes: 90,
          lat: 28.245,
          lng: 83.95,
        },
        {
          id: 'act-203',
          time: '01:00 PM',
          title: 'Lunch at Cafe Busy Bee',
          description: 'Wood-fired pizza and fresh smoothies.',
          locationName: 'Busy Bee Cafe',
          category: 'Food',
          estimatedCost: 1200,
          durationMinutes: 60,
          lat: 28.21,
          lng: 83.962,
        },
        {
          id: 'act-204',
          time: '03:30 PM',
          title: 'Devi’s Fall & Gupteshwor Cave',
          description: 'Underground waterfall and sacred Shiva cave shrine.',
          locationName: 'Chhorpatan',
          category: 'Sightseeing',
          estimatedCost: 800,
          durationMinutes: 90,
          lat: 28.188,
          lng: 83.958,
        },
      ],
    },
  ],
};

export default function DashboardPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [trips, setTrips] = useState<TripData[]>([]);
  const [fetchingTrips, setFetchingTrips] = useState(true);

  useEffect(() => {
    async function loadTrips() {
      if (user) {
        try {
          const q = query(collection(db, 'trips'), where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const loaded: TripData[] = [];
          querySnapshot.forEach((docSnap) => {
            loaded.push({ id: docSnap.id, ...docSnap.data() } as TripData);
          });
          setTrips(loaded.length > 0 ? loaded : [DEFAULT_POKHARA_TRIP]);
        } catch (err) {
          console.error('Error fetching trips:', err);
          setTrips([DEFAULT_POKHARA_TRIP]);
        }
      } else {
        // Collect transient trips from localStorage
        const localTrips: TripData[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('trip_')) {
            try {
              const item = JSON.parse(localStorage.getItem(key) || '{}');
              localTrips.push(item);
            } catch (e) {
              // ignore
            }
          }
        }
        setTrips(localTrips.length > 0 ? localTrips : [DEFAULT_POKHARA_TRIP]);
      }
      setFetchingTrips(false);
    }

    loadTrips();
  }, [user]);

  const handleDeleteTrip = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trip?')) return;
    try {
      if (user && !id.startsWith('demo-')) {
        await deleteDoc(doc(db, 'trips', id));
      } else {
        localStorage.removeItem(`trip_${id}`);
      }
      setTrips((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const displayName = userProfile?.displayName || user?.email?.split('@')[0] || 'Shekhar';

  // Get featured upcoming trip
  const featuredTrip = trips.find((t) => t.status === 'Upcoming') || trips[0] || DEFAULT_POKHARA_TRIP;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header Greeting & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 dark:border-neutral-800 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Good morning, {displayName} 👋
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Where are you going next? Choose a trip or generate a new AI itinerary.
          </p>
        </div>

        <Link
          href="/create-trip"
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          Create New Trip
        </Link>
      </div>

      {/* Featured Upcoming Trip Section */}
      {featuredTrip && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-500">
            <span>Upcoming Journey</span>
            <span className="text-indigo-600 dark:text-cyan-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Next Destination
            </span>
          </div>

          <div className="relative rounded-3xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 bg-neutral-900 text-white shadow-xl min-h-[220px] flex flex-col sm:flex-row justify-between p-6 sm:p-8 items-start sm:items-center group">
            {/* Background Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featuredTrip.destinationImage}
              alt={featuredTrip.destination}
              className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/70 to-transparent" />

            {/* Left Featured Content */}
            <div className="relative z-10 space-y-2 max-w-md">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase tracking-wider border border-cyan-500/30">
                Featured Trip
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight">
                {featuredTrip.destination}
              </h2>
              <p className="text-xs text-neutral-300 font-medium flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  {featuredTrip.durationDays} Days · {featuredTrip.travelers} Travelers
                </span>
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <DollarSign className="w-3.5 h-3.5" />
                  {featuredTrip.currency} {featuredTrip.estimatedBudget?.toLocaleString()}
                </span>
              </p>
            </div>

            {/* Right CTA */}
            <div className="relative z-10 mt-4 sm:mt-0">
              <Link
                href={`/trips/${featuredTrip.id}`}
                className="px-6 py-3 rounded-2xl bg-white text-neutral-900 font-bold text-xs shadow-lg hover:bg-neutral-100 transition-all flex items-center gap-2"
              >
                View Trip <ArrowRight className="w-4 h-4 text-indigo-600" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Saved Trips Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            My Saved Trips
          </h2>
          <span className="text-xs text-neutral-500 font-medium">
            {trips.length} {trips.length === 1 ? 'Itinerary' : 'Itineraries'}
          </span>
        </div>

        <TripsGrid trips={trips} onDeleteTrip={handleDeleteTrip} />
      </div>
    </div>
  );
}
