import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Trip from '@/models/Trip';
import { getUserFromRequest } from '@/lib/jwt';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const trip = await Trip.findOne({
      $or: [{ tripId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    }).lean();

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const formattedTrip = {
      id: (trip as any).tripId || (trip as any)._id.toString(),
      userId: (trip as any).userId,
      destination: (trip as any).destination,
      startDate: (trip as any).startDate,
      endDate: (trip as any).endDate,
      durationDays: (trip as any).durationDays,
      travelers: (trip as any).travelers,
      budgetTier: (trip as any).budgetTier,
      currency: (trip as any).currency,
      travelStyles: (trip as any).travelStyles || [],
      foodPreferences: (trip as any).foodPreferences || [],
      accommodationType: (trip as any).accommodationType,
      transportationMode: (trip as any).transportationMode,
      activityIntensity: (trip as any).activityIntensity,
      specialRequirements: (trip as any).specialRequirements,
      destinationImage: (trip as any).destinationImage,
      destinationCoordinates: (trip as any).destinationCoordinates,
      estimatedBudget: (trip as any).estimatedBudget,
      itinerary: (trip as any).itinerary || [],
      budgetBreakdown: (trip as any).budgetBreakdown || {},
      status: (trip as any).status || 'Upcoming',
      createdAt: (trip as any).createdAt ? new Date((trip as any).createdAt).toISOString() : new Date().toISOString(),
      updatedAt: (trip as any).updatedAt ? new Date((trip as any).updatedAt).toISOString() : new Date().toISOString(),
    };

    return NextResponse.json({ trip: formattedTrip });
  } catch (error: any) {
    console.error('Error fetching trip by ID:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const updateData = await req.json();

    await connectToDatabase();

    const trip = await Trip.findOne({
      $or: [{ tripId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Ensure user owns trip
    if (trip.userId !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden: You do not own this trip' }, { status: 403 });
    }

    Object.assign(trip, updateData);
    await trip.save();

    return NextResponse.json({ message: 'Trip updated successfully', trip });
  } catch (error: any) {
    console.error('Error updating trip:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await connectToDatabase();

    const trip = await Trip.findOne({
      $or: [{ tripId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    if (trip.userId !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden: You do not own this trip' }, { status: 403 });
    }

    await Trip.deleteOne({ _id: trip._id });

    return NextResponse.json({ message: 'Trip deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting trip:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
