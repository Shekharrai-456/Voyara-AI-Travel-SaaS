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

async function testGeneration() {
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  const modelsToTest = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.7-flash",
    "gemini-flash-latest",
  ];

  for (const model of modelsToTest) {
    try {
      console.log(`\nTesting generateContent with model: "${model}"...`);
      const res = await ai.models.generateContent({
        model,
        contents: "Respond with the word: READY",
      });
      console.log(`✅ SUCCESS [${model}]:`, res.text?.trim());
    } catch (err: any) {
      console.log(`❌ ERROR [${model}]:`, err.status || err.statusCode, err.message);
    }
  }
}

testGeneration();
