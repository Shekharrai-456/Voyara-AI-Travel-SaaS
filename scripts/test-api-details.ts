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

async function inspectError() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("API Key preview:", apiKey?.substring(0, 8) + "..." + apiKey?.substring(apiKey.length - 4));

  const ai = new GoogleGenAI({
    apiKey,
  });

  try {
    console.log("Attempting ai.models.list()...");
    const list = await ai.models.list();
    console.log("Available models:");
    for await (const m of list) {
      console.log(" - ", m.name);
    }
  } catch (err: any) {
    console.log("List models error:", JSON.stringify({
      message: err.message,
      status: err.status,
      statusCode: err.statusCode,
      code: err.code,
      error: err.error,
      stack: err.stack
    }, null, 2));
  }

  // Also test direct fetch to Google Generative Language API
  try {
    console.log("\nAttempting direct fetch to Google Generative Language API...");
    const directRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const directJson = await directRes.json();
    console.log("Direct API response status:", directRes.status);
    console.log("Direct API response:", JSON.stringify(directJson, null, 2).slice(0, 500));
  } catch (err: any) {
    console.log("Direct fetch error:", err.message);
  }
}

inspectError();
