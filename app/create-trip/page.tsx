'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import TripWizard from '@/components/trip/TripWizard';
import { Compass } from 'lucide-react';

export default function CreateTripPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/create-trip&reason=plan');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Compass className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-neutral-500 font-medium">Verifying sign-in status...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-6">
      <TripWizard />
    </div>
  );
}

