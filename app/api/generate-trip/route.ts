import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { TripPreferences } from "@/types/trip";

// Initialize Gemini Client server-side only
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing");
  }
  return new GoogleGenAI({ apiKey });
};

export async function POST(req: NextRequest) {
  try {
    const preferences: TripPreferences = await req.json();

    if (!preferences.destination || !preferences.durationDays) {
      return NextResponse.json(
        { error: "Destination and duration are required." },
        { status: 400 }
      );
    }

    const ai = getGeminiClient();

    const systemPrompt = `You are Voyara AI, an expert luxury & adventure travel itinerary planner.
Create a detailed, highly realistic, custom day-by-day travel itinerary for a trip to "${preferences.destination}".

Trip Parameters:
- Destination: ${preferences.destination}
- Dates: ${preferences.startDate} to ${preferences.endDate} (${preferences.durationDays} days)
- Travelers: ${preferences.travelers} person(s)
- Budget Level: ${preferences.budgetTier}
- Target Currency: ${preferences.currency || "USD"}
- Travel Styles: ${preferences.travelStyles?.join(", ") || "General Sightseeing"}
- Food Preferences: ${preferences.foodPreferences?.join(", ") || "Local Specialties"}
- Accommodation Style: ${preferences.accommodationType || "Boutique / Comfortable"}
- Activity Pace: ${preferences.activityIntensity || "Balanced"}
- Special Requests: ${preferences.specialRequirements || "None"}

Requirements:
1. Provide exact day-by-day itineraries for all ${preferences.durationDays} days.
2. For each day, include 3 to 5 realistic activities with time slots, descriptions, category, and cost.
3. For EVERY activity, include realistic geographic coordinates (lat, lng) within or near ${preferences.destination}.
4. Provide a total estimated budget and breakdown across Accommodation, Food, Transportation, Activities, and Miscellaneous.
5. Provide overall destination coordinates (lat, lng).
6. Return purely valid JSON matching the schema without markdown wrappers or extra commentary.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            destination: { type: Type.STRING },
            destinationCoordinates: {
              type: Type.OBJECT,
              properties: {
                lat: { type: Type.NUMBER },
                lng: { type: Type.NUMBER }
              },
              required: ["lat", "lng"]
            },
            durationDays: { type: Type.NUMBER },
            estimatedBudget: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            budgetBreakdown: {
              type: Type.OBJECT,
              properties: {
                accommodation: { type: Type.NUMBER },
                food: { type: Type.NUMBER },
                transportation: { type: Type.NUMBER },
                activities: { type: Type.NUMBER },
                miscellaneous: { type: Type.NUMBER },
                total: { type: Type.NUMBER }
              },
              required: ["accommodation", "food", "transportation", "activities", "miscellaneous", "total"]
            },
            itinerary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.NUMBER },
                  title: { type: Type.STRING },
                  theme: { type: Type.STRING },
                  estimatedDayCost: { type: Type.NUMBER },
                  activities: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        time: { type: Type.STRING },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        locationName: { type: Type.STRING },
                        category: { 
                          type: Type.STRING,
                          enum: ["Hotel", "Food", "Sightseeing", "Activity", "Transport", "Relaxation"]
                        },
                        estimatedCost: { type: Type.NUMBER },
                        durationMinutes: { type: Type.NUMBER },
                        lat: { type: Type.NUMBER },
                        lng: { type: Type.NUMBER },
                        address: { type: Type.STRING },
                        rating: { type: Type.NUMBER }
                      },
                      required: ["id", "time", "title", "description", "locationName", "category", "estimatedCost", "lat", "lng"]
                    }
                  }
                },
                required: ["day", "title", "activities", "estimatedDayCost"]
              }
            }
          },
          required: ["destination", "destinationCoordinates", "durationDays", "estimatedBudget", "currency", "budgetBreakdown", "itinerary"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No output generated from Gemini API");
    }

    const parsedData = JSON.parse(jsonText);

    // Attach high quality unsplash destination photo URL based on destination name
    const destinationQuery = encodeURIComponent(preferences.destination.toLowerCase());
    const coverImage = `https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80`;

    const finalTripData = {
      ...preferences,
      ...parsedData,
      destinationImage: coverImage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "Upcoming"
    };

    return NextResponse.json(finalTripData);
  } catch (error: any) {
    console.error("Error generating trip with Gemini:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate AI trip itinerary." },
      { status: 500 }
    );
  }
}
