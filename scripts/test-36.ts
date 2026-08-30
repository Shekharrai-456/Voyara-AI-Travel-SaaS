import { GoogleGenAI } from "@google/genai";
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

async function test36() {
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  const models = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite"];
  for (const model of models) {
    try {
      console.log(`Testing model: "${model}"...`);
      const res = await ai.models.generateContent({
        model,
        contents: "Respond with the word: WORKING",
      });
      console.log(`✅ SUCCESS with "${model}":`, res.text?.trim());
    } catch (err: any) {
      console.log(`❌ FAILED with "${model}":`, err.status || err.statusCode, err.message);
    }
  }
}

test36();
