export type BudgetTier = 'Budget' | 'Moderate' | 'Luxury';

export type TravelStyle = 
  | 'Adventure' 
  | 'Relaxation' 
  | 'Culture' 
  | 'Food' 
  | 'Nature' 
  | 'Photography' 
  | 'Shopping' 
  | 'Nightlife' 
  | 'History' 
  | 'Family';

export interface Activity {
  id: string;
  time: string; // e.g. "09:00 AM"
  title: string;
  description: string;
  locationName: string;
  category: 'Hotel' | 'Food' | 'Sightseeing' | 'Activity' | 'Transport' | 'Relaxation';
  estimatedCost: number;
  durationMinutes: number;
  lat?: number;
  lng?: number;
  address?: string;
  rating?: number;
  photoUrl?: string;
  placeId?: string;
}

export interface DayItinerary {
  day: number;
  title: string;
  theme?: string;
  activities: Activity[];
  estimatedDayCost: number;
}

export interface BudgetCategory {
  category: string; // 'Accommodation' | 'Food' | 'Transportation' | 'Activities' | 'Miscellaneous'
  amount: number;
  color?: string;
}

export interface BudgetBreakdown {
  accommodation: number;
  food: number;
  transportation: number;
  activities: number;
  miscellaneous: number;
  total: number;
}

export interface TripPreferences {
  destination: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  travelers: number;
  budgetTier: BudgetTier;
  currency: string;
  travelStyles: TravelStyle[];
  foodPreferences?: string[];
  accommodationType?: string;
  transportationMode?: string;
  activityIntensity?: 'Paced' | 'Balanced' | 'Action-Packed';
  specialRequirements?: string;
}

export interface TripData extends TripPreferences {
  id: string;
  userId: string;
  destinationImage: string;
  destinationCoordinates?: {
    lat: number;
    lng: number;
  };
  estimatedBudget: number;
  itinerary: DayItinerary[];
  budgetBreakdown: BudgetBreakdown;
  status: 'Upcoming' | 'Completed' | 'Draft';
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt?: string;
  preferences?: {
    favoriteDestinations?: string[];
    defaultTravelStyle?: TravelStyle[];
    defaultBudgetTier?: BudgetTier;
    foodPreferences?: string[];
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  updatedTripData?: Partial<TripData>;
}
