import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { TripData } from "@/types/trip";

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

export async function POST(req: NextRequest) {
  try {
    const { message, currentTrip }: { message: string; currentTrip: TripData } = await req.json();

    if (!message || !currentTrip) {
      return NextResponse.json(
        { error: "Message and current trip context are required." },
        { status: 400 }
      );
    }

    const ai = getGeminiClient();

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

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI Assistant");
    }

    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("AI Assistant error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process chat message." },
      { status: 500 }
    );
  }
}
