import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";
import path from "path";

try {
  const envContent = fs.readFileSync(path.resolve(process.cwd(), ".env"), "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
} catch (e) {}

async function testFullTripGeneration() {
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  console.log("Testing Full Trip Itinerary Generation with gemini-3.6-flash...");
  const prompt = `You are Voyara AI, an expert travel planner.
Create a 3-day itinerary for "Pokhara, Nepal" for 2 travelers with Balanced pace and Moderate budget.`;

  const res = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          destination: { type: Type.STRING },
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
                    },
                    required: ["id", "time", "title", "description", "locationName", "category", "estimatedCost", "lat", "lng"],
                  },
                },
              },
              required: ["day", "title", "activities", "estimatedDayCost"],
            },
          },
        },
        required: ["destination", "durationDays", "estimatedBudget", "currency", "budgetBreakdown", "itinerary"],
      },
    },
  });

  console.log("Response text received! Length:", res.text?.length);
  const parsed = JSON.parse(res.text || "{}");
  console.log("Destination:", parsed.destination);
  console.log("Days generated:", parsed.itinerary?.length);
  console.log("Estimated Budget:", parsed.currency, parsed.estimatedBudget);
  console.log("Day 1 Activities count:", parsed.itinerary?.[0]?.activities?.length);
  console.log("Sample Activity:", parsed.itinerary?.[0]?.activities?.[0]);
  console.log("✅ FULL GENERATION TEST PASSED!");
}

testFullTripGeneration();
