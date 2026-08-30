import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

// Load .env manually
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
} catch (e) {
  console.log("Could not read .env file:", e);
}

async function testModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("GEMINI_API_KEY exists?", !!apiKey, "Length:", apiKey ? apiKey.length : 0);

  const ai = new GoogleGenAI({ apiKey });

  const candidateModels = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-2.5-flash",
    "gemini-3.7-flash",
  ];

  for (const model of candidateModels) {
    try {
      console.log(`Testing model: "${model}"...`);
      const response = await ai.models.generateContent({
        model,
        contents: "Say hello in one word",
      });
      console.log(`✅ SUCCESS with "${model}":`, response.text?.trim());
    } catch (err: any) {
      console.log(`❌ FAILED with "${model}":`, err.status || err.statusCode || err.message);
    }
  }
}

testModels();
