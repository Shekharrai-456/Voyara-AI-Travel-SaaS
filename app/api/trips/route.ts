import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Trip from '@/models/Trip';
import { getUserFromRequest } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    await connectToDatabase();

    // If authenticated user, filter by userId; else return recent trips if public or empty
    const filter = payload ? { userId: payload.userId } : {};
    const trips = await Trip.find(filter).sort({ createdAt: -1 }).lean();

    const formattedTrips = trips.map((t: any) => ({
      id: t.tripId || t._id.toString(),
      userId: t.userId,
      destination: t.destination,
      startDate: t.startDate,
      endDate: t.endDate,
      durationDays: t.durationDays,
      travelers: t.travelers,
      budgetTier: t.budgetTier,
      currency: t.currency,
      travelStyles: t.travelStyles || [],
      foodPreferences: t.foodPreferences || [],
      accommodationType: t.accommodationType,
      transportationMode: t.transportationMode,
      activityIntensity: t.activityIntensity,
      specialRequirements: t.specialRequirements,
      destinationImage: t.destinationImage,
      destinationCoordinates: t.destinationCoordinates,
      estimatedBudget: t.estimatedBudget,
      itinerary: t.itinerary || [],
      budgetBreakdown: t.budgetBreakdown || {},
      status: t.status || 'Upcoming',
      createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({ trips: formattedTrips });
  } catch (error: any) {
    console.error('Error fetching trips:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to create trips.' }, { status: 401 });
    }

    const tripData = await req.json();
    if (!tripData.destination) {
      return NextResponse.json({ error: 'Destination is required' }, { status: 400 });
    }

    await connectToDatabase();

    const tripId = tripData.id || `trip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newTrip = await Trip.create({
      tripId,
      userId: payload.userId,
      destination: tripData.destination,
      startDate: tripData.startDate || '',
      endDate: tripData.endDate || '',
      durationDays: tripData.durationDays || 1,
      travelers: tripData.travelers || 1,
      budgetTier: tripData.budgetTier || 'Moderate',
      currency: tripData.currency || 'USD',
      travelStyles: tripData.travelStyles || [],
      foodPreferences: tripData.foodPreferences || [],
      accommodationType: tripData.accommodationType || 'Hotel',
      transportationMode: tripData.transportationMode || 'Flight',
      activityIntensity: tripData.activityIntensity || 'Balanced',
      specialRequirements: tripData.specialRequirements || '',
      destinationImage: tripData.destinationImage || '',
      destinationCoordinates: tripData.destinationCoordinates,
      estimatedBudget: tripData.estimatedBudget || 0,
      itinerary: tripData.itinerary || [],
      budgetBreakdown: tripData.budgetBreakdown || {},
      status: tripData.status || 'Upcoming',
    });

    return NextResponse.json({
      message: 'Trip saved successfully',
      trip: {
        id: newTrip.tripId,
        userId: newTrip.userId,
        destination: newTrip.destination,
        startDate: newTrip.startDate,
        endDate: newTrip.endDate,
        durationDays: newTrip.durationDays,
        travelers: newTrip.travelers,
        budgetTier: newTrip.budgetTier,
        currency: newTrip.currency,
        travelStyles: newTrip.travelStyles,
        foodPreferences: newTrip.foodPreferences,
        accommodationType: newTrip.accommodationType,
        transportationMode: newTrip.transportationMode,
        activityIntensity: newTrip.activityIntensity,
        specialRequirements: newTrip.specialRequirements,
        destinationImage: newTrip.destinationImage,
        destinationCoordinates: newTrip.destinationCoordinates,
        estimatedBudget: newTrip.estimatedBudget,
        itinerary: newTrip.itinerary,
        budgetBreakdown: newTrip.budgetBreakdown,
        status: newTrip.status,
        createdAt: newTrip.createdAt.toISOString(),
        updatedAt: newTrip.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error saving trip:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
