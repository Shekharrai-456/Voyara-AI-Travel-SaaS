import mongoose, { Schema, Document } from 'mongoose';

export interface ITrip extends Document {
  tripId: string;
  userId: string;
  destination: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  travelers: number;
  budgetTier: string;
  currency: string;
  travelStyles: string[];
  foodPreferences?: string[];
  accommodationType?: string;
  transportationMode?: string;
  activityIntensity?: string;
  specialRequirements?: string;
  destinationImage: string;
  destinationCoordinates?: {
    lat: number;
    lng: number;
  };
  estimatedBudget: number;
  itinerary: any[];
  budgetBreakdown: any;
  status: 'Upcoming' | 'Completed' | 'Draft';
  createdAt: Date;
  updatedAt: Date;
}

const TripSchema = new Schema<ITrip>(
  {
    tripId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    destination: { type: String, required: true },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    durationDays: { type: Number, default: 1 },
    travelers: { type: Number, default: 1 },
    budgetTier: { type: String, default: 'Moderate' },
    currency: { type: String, default: 'USD' },
    travelStyles: [{ type: String }],
    foodPreferences: [{ type: String }],
    accommodationType: { type: String, default: 'Hotel' },
    transportationMode: { type: String, default: 'Flight' },
    activityIntensity: { type: String, default: 'Balanced' },
    specialRequirements: { type: String, default: '' },
    destinationImage: { type: String, default: '' },
    destinationCoordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    estimatedBudget: { type: Number, default: 0 },
    itinerary: { type: Schema.Types.Mixed, default: [] },
    budgetBreakdown: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['Upcoming', 'Completed', 'Draft'], default: 'Upcoming' },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Trip || mongoose.model<ITrip>('Trip', TripSchema);
