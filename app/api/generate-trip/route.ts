import { Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { TripPreferences, TripData, DayItinerary, Activity, BudgetBreakdown } from "@/types/trip";
import {
  generateContentWithRetry,
  GeminiAppError,
  extractErrorStatus,
  getFriendlyErrorMessageByStatus,
  PRIMARY_GEMINI_MODEL,
  FALLBACK_GEMINI_MODEL,
} from "@/lib/gemini";

/**
 * Validates and sanitizes incoming trip preferences
 */
function sanitizePreferences(raw: any): TripPreferences {
  if (!raw || typeof raw !== "object") {
    throw new GeminiAppError("Invalid request payload", 400, "Please provide valid trip preferences.");
  }

  const destination = typeof raw.destination === "string" ? raw.destination.trim() : "";
  if (!destination || destination.length < 2) {
    throw new GeminiAppError("Destination is required", 400, "Please enter a valid destination.");
  }

  let durationDays = Number(raw.durationDays);
  if (isNaN(durationDays) || durationDays < 1) {
    durationDays = 3;
  } else if (durationDays > 14) {
    durationDays = 14; // Cap duration to prevent massive generation failures
  }

  let travelers = Number(raw.travelers);
  if (isNaN(travelers) || travelers < 1) {
    travelers = 1;
  }

  const startDate = typeof raw.startDate === "string" && raw.startDate ? raw.startDate : new Date().toISOString().split("T")[0];
  const endDate = typeof raw.endDate === "string" && raw.endDate ? raw.endDate : startDate;
  const budgetTier = ["Budget", "Moderate", "Luxury"].includes(raw.budgetTier) ? raw.budgetTier : "Moderate";
  const currency = typeof raw.currency === "string" && raw.currency ? raw.currency.trim().toUpperCase() : "USD";
  
  const travelStyles = Array.isArray(raw.travelStyles)
    ? raw.travelStyles.filter((s: any) => typeof s === "string" && s.trim().length > 0)
    : ["Culture", "Food"];

  const foodPreferences = Array.isArray(raw.foodPreferences)
    ? raw.foodPreferences.filter((f: any) => typeof f === "string" && f.trim().length > 0)
    : typeof raw.foodPreferences === "string"
    ? raw.foodPreferences.split(",").map((s: string) => s.trim()).filter(Boolean)
    : ["Local specialties"];

  const accommodationType = typeof raw.accommodationType === "string" ? raw.accommodationType.trim() : "Comfortable Hotel";
  const transportationMode = typeof raw.transportationMode === "string" ? raw.transportationMode.trim() : "Walking & Public Transit";
  const activityIntensity = ["Paced", "Balanced", "Action-Packed"].includes(raw.activityIntensity)
    ? raw.activityIntensity
    : "Balanced";
  const specialRequirements = typeof raw.specialRequirements === "string" ? raw.specialRequirements.trim() : "";

  return {
    destination,
    startDate,
    endDate,
    durationDays,
    travelers,
    budgetTier,
    currency,
    travelStyles,
    foodPreferences,
    accommodationType,
    transportationMode,
    activityIntensity,
    specialRequirements,
  };
}

/**
 * Builds the travel itinerary prompt for Gemini
 */
function buildItineraryPrompt(pref: TripPreferences): string {
  const paceGuideline =
    pref.activityIntensity === "Paced"
      ? "2 to 3 well-spaced activities per day with ample relaxation and leisurely meals."
      : pref.activityIntensity === "Action-Packed"
      ? "4 to 5 energetic, varied activities per day covering top highlights and adventures."
      : "3 to 4 balanced activities per day combining exploration, sights, and local downtime.";

  return `You are Voyara AI, an expert destination planner and local travel specialist.
Create an authentic, realistic, high-quality day-by-day travel itinerary for "${pref.destination}".

Traveler Profile & Constraints:
- Destination: ${pref.destination}
- Dates: ${pref.startDate} to ${pref.endDate} (${pref.durationDays} full days)
- Group Size: ${pref.travelers} traveler(s)
- Budget Level: ${pref.budgetTier} in currency ${pref.currency}
- Travel Interests / Styles: ${pref.travelStyles.join(", ")}
- Food & Dining Preferences: ${pref.foodPreferences?.join(", ") || "Local specialties"}
- Preferred Accommodation Style: ${pref.accommodationType || "Comfortable / Boutique"}
- Preferred Transportation: ${pref.transportationMode || "Walking, Taxi & Local transit"}
- Activity Pace: ${pref.activityIntensity} (${paceGuideline})
- Special Notes / Requests: ${pref.specialRequirements || "None"}

Planning Guidelines:
1. Complete Schedule: Generate exactly ${pref.durationDays} days of itinerary (Day 1 to Day ${pref.durationDays}).
2. Activity Structure: For each day, create realistic activities adhering to the "${pref.activityIntensity}" pace.
3. Geographical Logic: Group activities logically by neighborhood/distance each day to minimize unnecessary transit time.
4. Accurate Coordinates: Provide realistic latitude and longitude coordinates (lat, lng) within or immediately around ${pref.destination} for the destination and every single activity.
5. Practical Costs: Ensure all estimated costs are realistic for the specified budget level (${pref.budgetTier}) and denominated in ${pref.currency}.
6. Categories: Ensure activity categories are strictly one of: "Hotel", "Food", "Sightseeing", "Activity", "Transport", "Relaxation".
7. Return strictly valid JSON adhering to the provided schema without markdown formatting or conversational prose.`;
}

/**
 * Schema definition for structured JSON generation
 */
const ITINERARY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    destination: { type: Type.STRING },
    destinationCoordinates: {
      type: Type.OBJECT,
      properties: {
        lat: { type: Type.NUMBER },
        lng: { type: Type.NUMBER },
      },
      required: ["lat", "lng"],
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
        total: { type: Type.NUMBER },
      },
      required: ["accommodation", "food", "transportation", "activities", "miscellaneous", "total"],
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
                  enum: ["Hotel", "Food", "Sightseeing", "Activity", "Transport", "Relaxation"],
                },
                estimatedCost: { type: Type.NUMBER },
                durationMinutes: { type: Type.NUMBER },
                lat: { type: Type.NUMBER },
                lng: { type: Type.NUMBER },
                address: { type: Type.STRING },
                rating: { type: Type.NUMBER },
              },
              required: ["id", "time", "title", "description", "locationName", "category", "estimatedCost", "lat", "lng"],
            },
          },
        },
        required: ["day", "title", "activities", "estimatedDayCost"],
      },
    },
  },
  required: [
    "destination",
    "destinationCoordinates",
    "durationDays",
    "estimatedBudget",
    "currency",
    "budgetBreakdown",
    "itinerary",
  ],
};

/**
 * Validates and safely normalizes AI generated itinerary
 */
function validateAndNormalizeItinerary(aiData: any, preferences: TripPreferences): {
  destinationCoordinates: { lat: number; lng: number };
  estimatedBudget: number;
  currency: string;
  budgetBreakdown: BudgetBreakdown;
  itinerary: DayItinerary[];
} {
  if (!aiData || typeof aiData !== "object") {
    throw new GeminiAppError("AI response was not a valid object", 500, "Unable to parse the generated trip itinerary.");
  }

  // Destination coordinates fallback
  const rawCoords = aiData.destinationCoordinates || {};
  const lat = typeof rawCoords.lat === "number" && !isNaN(rawCoords.lat) ? rawCoords.lat : 27.7172;
  const lng = typeof rawCoords.lng === "number" && !isNaN(rawCoords.lng) ? rawCoords.lng : 85.324;
  const destinationCoordinates = { lat, lng };

  const currency = typeof aiData.currency === "string" && aiData.currency ? aiData.currency : preferences.currency || "USD";

  // Budget validation
  const rawBreakdown = aiData.budgetBreakdown || {};
  const accommodation = Number(rawBreakdown.accommodation) || 200;
  const food = Number(rawBreakdown.food) || 150;
  const transportation = Number(rawBreakdown.transportation) || 80;
  const activities = Number(rawBreakdown.activities) || 120;
  const miscellaneous = Number(rawBreakdown.miscellaneous) || 50;
  const total = Number(rawBreakdown.total) || (accommodation + food + transportation + activities + miscellaneous);

  const budgetBreakdown: BudgetBreakdown = {
    accommodation,
    food,
    transportation,
    activities,
    miscellaneous,
    total,
  };

  const estimatedBudget = Number(aiData.estimatedBudget) || total;

  // Itinerary array validation
  const rawItinerary = Array.isArray(aiData.itinerary) ? aiData.itinerary : [];
  if (rawItinerary.length === 0) {
    throw new GeminiAppError("AI generated an empty itinerary", 500, "The generated itinerary was incomplete. Please try again.");
  }

  const validCategories = ["Hotel", "Food", "Sightseeing", "Activity", "Transport", "Relaxation"] as const;

  const normalizedItinerary: DayItinerary[] = rawItinerary.map((dayItem: any, index: number) => {
    const dayNumber = Number(dayItem.day) || index + 1;
    const dayTitle = typeof dayItem.title === "string" && dayItem.title ? dayItem.title : `Day ${dayNumber}: Exploration`;
    const dayTheme = typeof dayItem.theme === "string" ? dayItem.theme : undefined;
    const estimatedDayCost = Number(dayItem.estimatedDayCost) || Math.round(total / (rawItinerary.length || 1));

    const rawActivities = Array.isArray(dayItem.activities) ? dayItem.activities : [];
    const activities: Activity[] = rawActivities.map((act: any, actIdx: number) => {
      const actId = typeof act.id === "string" && act.id ? act.id : `d${dayNumber}-a${actIdx + 1}`;
      const time = typeof act.time === "string" && act.time ? act.time : "10:00 AM";
      const title = typeof act.title === "string" && act.title ? act.title : "Sightseeing Experience";
      const description = typeof act.description === "string" && act.description ? act.description : "Explore local highlights.";
      const locationName = typeof act.locationName === "string" && act.locationName ? act.locationName : preferences.destination;
      
      let category: Activity["category"] = "Sightseeing";
      if (validCategories.includes(act.category)) {
        category = act.category;
      }

      const estimatedCost = typeof act.estimatedCost === "number" && !isNaN(act.estimatedCost) ? act.estimatedCost : 0;
      const durationMinutes = typeof act.durationMinutes === "number" && !isNaN(act.durationMinutes) ? act.durationMinutes : 90;
      
      const actLat = typeof act.lat === "number" && !isNaN(act.lat) ? act.lat : lat + (Math.random() - 0.5) * 0.04;
      const actLng = typeof act.lng === "number" && !isNaN(act.lng) ? act.lng : lng + (Math.random() - 0.5) * 0.04;

      return {
        id: actId,
        time,
        title,
        description,
        locationName,
        category,
        estimatedCost,
        durationMinutes,
        lat: actLat,
        lng: actLng,
        address: typeof act.address === "string" ? act.address : undefined,
        rating: typeof act.rating === "number" ? act.rating : 4.5,
      };
    });

    return {
      day: dayNumber,
      title: dayTitle,
      theme: dayTheme,
      estimatedDayCost,
      activities,
    };
  });

  return {
    destinationCoordinates,
    estimatedBudget,
    currency,
    budgetBreakdown,
    itinerary: normalizedItinerary,
  };
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    // Step 1: Validate and sanitize preferences
    const preferences = sanitizePreferences(rawBody);

    // Step 2: Build enhanced prompt
    const prompt = buildItineraryPrompt(preferences);

    // Step 3: Call Gemini with exponential backoff, jitter, and fallback model
    const { response, modelUsed } = await generateContentWithRetry({
      model: PRIMARY_GEMINI_MODEL,
      fallbackModel: FALLBACK_GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: ITINERARY_SCHEMA as any,
        temperature: 0.7,
      },
      contextName: `Trip Generation for "${preferences.destination}"`,
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new GeminiAppError("Empty response from AI model", 500, "AI planner returned an empty response. Please try again.");
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error("[Gemini] Failed to parse generated JSON:", parseErr, "Raw output:", jsonText);
      throw new GeminiAppError("Malformed JSON from AI", 500, "The AI response format was invalid. Please try again.");
    }

    // Step 4: Validate and normalize the output
    const validatedItineraryData = validateAndNormalizeItinerary(parsedData, preferences);

    // Cover image placeholder
    const coverImage = `https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80`;

    const finalTripData: TripData = {
      id: `trip-${Date.now()}`,
      userId: (rawBody as any).userId || "guest",
      ...preferences,
      ...validatedItineraryData,
      destinationImage: coverImage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "Upcoming",
    };

    console.log(`[Gemini] Itinerary generation complete using ${modelUsed} for "${preferences.destination}"`);
    return NextResponse.json(finalTripData);
  } catch (error: any) {
    const { statusCode, statusText } = extractErrorStatus(error);
    const friendlyMessage = error instanceof GeminiAppError && error.userMessage
      ? error.userMessage
      : getFriendlyErrorMessageByStatus(statusCode, statusText);

    console.error(`[Gemini Route Error] Status: ${statusCode} (${statusText}) - Message: ${error?.message}`);

    return NextResponse.json(
      {
        error: friendlyMessage,
        code: statusText,
        status: statusCode,
      },
      { status: statusCode }
    );
  }
}
