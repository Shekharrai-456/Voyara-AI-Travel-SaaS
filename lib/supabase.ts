import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qzflyoyvbsermeiifwqx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_XxWtZCwpPhHsMBy-J62ERw_PgPTGkEV';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// SQL Schema Reference for the user's Supabase instance:
/*
-- Run this in your Supabase SQL Editor to create the necessary tables:

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  photo_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.trips (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  destination TEXT NOT NULL,
  destination_image TEXT,
  start_date TEXT,
  end_date TEXT,
  duration_days INT,
  travelers INT,
  budget_tier TEXT,
  currency TEXT,
  estimated_budget NUMERIC,
  travel_styles JSONB,
  status TEXT,
  destination_coordinates JSONB,
  budget_breakdown JSONB,
  itinerary JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS & add policy for profiles & trips
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own profiles" ON public.profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage their own trips" ON public.trips
  FOR ALL USING (auth.uid()::text = user_id OR user_id = 'demo');
*/
