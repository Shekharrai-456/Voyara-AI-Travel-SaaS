import { generateContentWithRetry } from "../lib/gemini";
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

async function testWithRetry() {
  console.log("Testing generateContentWithRetry via lib/gemini.ts...");
  const result = await generateContentWithRetry({
    contents: "Say 'Voyara AI is working perfectly'",
    contextName: "Verification Test",
  });
  console.log(`✅ Success! Model used: ${result.modelUsed}`);
  console.log(`Response text: ${result.response.text?.trim()}`);
}

testWithRetry();
