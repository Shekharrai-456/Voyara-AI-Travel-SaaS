'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TripData } from '@/types/trip';
import { supabase } from '@/lib/supabase';
import TripDetailView from '@/components/trip/TripDetailView';
import { Compass } from 'lucide-react';

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
      ],
    },
  ],
};

export default function TripDetailPage() {
  const params = useParams();
  const tripId = params.id as string;
  const [trip, setTrip] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrip() {
      if (!tripId) return;

      if (tripId.startsWith('demo-')) {
        const local = localStorage.getItem(`trip_${tripId}`);
        if (local) {
          try {
            setTrip(JSON.parse(local));
          } catch {
            setTrip(DEFAULT_POKHARA_TRIP);
          }
        } else {
          setTrip(DEFAULT_POKHARA_TRIP);
        }
        setLoading(false);
        return;
      }

      try {
        // Try localStorage first for instant load
        const local = localStorage.getItem(`trip_${tripId}`);
        if (local) {
          try {
            setTrip(JSON.parse(local));
          } catch (e) {}
        }

        // Fetch from Supabase
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .eq('id', tripId)
          .single();

        if (data && !error) {
          const tripData: TripData = {
            id: data.id,
            userId: data.user_id,
            destination: data.destination,
            destinationImage: data.destination_image,
            startDate: data.start_date,
            endDate: data.end_date,
            durationDays: data.duration_days,
            travelers: data.travelers,
            budgetTier: data.budget_tier,
            currency: data.currency,
            estimatedBudget: Number(data.estimated_budget),
            travelStyles: data.travel_styles || [],
            status: data.status || 'Upcoming',
            destinationCoordinates: data.destination_coordinates,
            budgetBreakdown: data.budget_breakdown,
            itinerary: data.itinerary || [],
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
          setTrip(tripData);
          localStorage.setItem(`trip_${tripId}`, JSON.stringify(tripData));
        } else if (!local) {
          setTrip(DEFAULT_POKHARA_TRIP);
        }
      } catch (err) {
        console.error('Error fetching trip details from Supabase:', err);
        if (!trip) setTrip(DEFAULT_POKHARA_TRIP);
      } finally {
        setLoading(false);
      }
    }

    fetchTrip();
  }, [tripId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <Compass className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
          Fetching Trip Details...
        </h3>
        <p className="text-xs text-neutral-500 mt-1">Loading Gemini itinerary & map points</p>
      </div>
    );
  }

  return <TripDetailView initialTrip={trip || DEFAULT_POKHARA_TRIP} />;
}
