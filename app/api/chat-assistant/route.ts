import { NextRequest, NextResponse } from "next/server";
import { TripData } from "@/types/trip";
import {
  generateContentWithRetry,
  GeminiAppError,
  extractErrorStatus,
  getFriendlyErrorMessageByStatus,
  PRIMARY_GEMINI_MODEL,
  FALLBACK_GEMINI_MODEL,
} from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON request." },
        { status: 400 }
      );
    }

    const { message, currentTrip }: { message: string; currentTrip: TripData } = body;

    if (!message || !currentTrip) {
      return NextResponse.json(
        { error: "Message and current trip context are required." },
        { status: 400 }
      );
    }

    const prompt = `You are Voyara AI, an interactive travel concierge.
The user is viewing their trip to "${currentTrip.destination}" (${currentTrip.durationDays} days, Budget: ${currentTrip.currency} ${currentTrip.estimatedBudget}).

Current Itinerary Context (JSON):
${JSON.stringify(currentTrip.itinerary, null, 2)}

User Prompt: "${message}"

Your Goal:
1. Provide a helpful, concise, friendly conversational response answering the user's request.
2. If the user asked to modify, add, remove, or optimize the itinerary, provide an updated "itinerary" array matching the DayItinerary structure with lat/lng for activities.
3. Respond in JSON format:
{
  "replyText": "Your friendly response explaining the changes or answer...",
  "updatedItinerary": [ ...optional full updated day-by-day itinerary if modified... ],
  "updatedBudget": optional_number_if_cost_changed
}`;

    const { response } = await generateContentWithRetry({
      model: PRIMARY_GEMINI_MODEL,
      fallbackModel: FALLBACK_GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
      contextName: "Travel Concierge Chat",
    });

    const text = response.text;
    if (!text) {
      throw new GeminiAppError("No response received from AI Assistant", 500);
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch (err) {
      data = {
        replyText: text.trim(),
      };
    }

    return NextResponse.json(data);
  } catch (error: any) {
    const { statusCode, statusText } = extractErrorStatus(error);
    const friendlyMessage =
      error instanceof GeminiAppError && error.userMessage
        ? error.userMessage
        : getFriendlyErrorMessageByStatus(statusCode, statusText);

    console.error(`[AI Assistant Error] Status: ${statusCode} (${statusText}) - Message: ${error?.message}`);

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
