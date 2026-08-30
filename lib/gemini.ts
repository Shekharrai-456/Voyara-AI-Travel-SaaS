import { GoogleGenAI, GenerateContentParameters, GenerateContentResponse } from "@google/genai";

// Verified, active supported models
export const PRIMARY_GEMINI_MODEL = "gemini-3.6-flash";
export const FALLBACK_GEMINI_MODEL = "gemini-3.5-flash";
export const SECONDARY_FALLBACK_MODEL = "gemini-3.5-flash-lite";

// Backoff configuration
export interface RetryConfig {
  maxRetries?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
  maxDelayMs?: number;
  jitterMs?: number;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 4,
  initialDelayMs: 1000, // 1s
  backoffFactor: 2,     // 1s -> 2s -> 4s -> 8s
  maxDelayMs: 10000,
  jitterMs: 400,
};

export class GeminiAppError extends Error {
  public statusCode: number;
  public userMessage: string;
  public rawStatus?: string;

  constructor(message: string, statusCode: number = 500, userMessage?: string, rawStatus?: string) {
    super(message);
    this.name = "GeminiAppError";
    this.statusCode = statusCode;
    this.rawStatus = rawStatus;
    this.userMessage = userMessage || getFriendlyErrorMessageByStatus(statusCode, rawStatus);
  }
}

/**
 * Initializes GoogleGenAI client securely on server
 */
export const getGeminiClient = (): GoogleGenAI => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiAppError(
      "GEMINI_API_KEY environment variable is missing",
      401,
      "AI Service configuration error: API key is missing on the server."
    );
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "voyara-travel-applet",
      },
    },
  });
};

/**
 * Helper to inspect and parse status codes from Gemini SDK errors
 */
export function extractErrorStatus(error: any): { statusCode: number; statusText: string } {
  if (!error) {
    return { statusCode: 500, statusText: "UNKNOWN" };
  }

  // Check custom error instance
  if (error instanceof GeminiAppError) {
    return { statusCode: error.statusCode, statusText: error.rawStatus || "APP_ERROR" };
  }

  // Check HTTP response status or code on error object
  const code = error.status || error.statusCode || error.code || error.error?.code || error.error?.status;
  const message = (error.message || error.error?.message || "").toLowerCase();

  if (code === 503 || code === "UNAVAILABLE" || message.includes("503") || message.includes("high demand") || message.includes("unavailable")) {
    return { statusCode: 503, statusText: "UNAVAILABLE" };
  }
  if (code === 429 || code === "RESOURCE_EXHAUSTED" || message.includes("429") || message.includes("quota") || message.includes("rate limit") || message.includes("resource_exhausted")) {
    return { statusCode: 429, statusText: "RESOURCE_EXHAUSTED" };
  }
  if (code === 400 || code === "INVALID_ARGUMENT" || message.includes("invalid argument") || message.includes("bad request")) {
    return { statusCode: 400, statusText: "INVALID_ARGUMENT" };
  }
  if (code === 401 || code === 403 || code === "UNAUTHENTICATED" || code === "PERMISSION_DENIED" || message.includes("api key") || message.includes("unauthenticated") || message.includes("permission denied")) {
    return { statusCode: 401, statusText: "UNAUTHENTICATED" };
  }
  if (code === 404 || code === "NOT_FOUND" || message.includes("not found")) {
    return { statusCode: 404, statusText: "NOT_FOUND" };
  }
  if (code === 500 || code === "INTERNAL" || message.includes("internal")) {
    return { statusCode: 500, statusText: "INTERNAL" };
  }

  if (typeof code === "number" && code >= 400 && code < 600) {
    return { statusCode: code, statusText: `HTTP_${code}` };
  }

  return { statusCode: 500, statusText: "INTERNAL_ERROR" };
}

/**
 * Returns whether an error is transient/temporary and safe to retry
 */
export function isRetryableError(error: any): boolean {
  const { statusCode, statusText } = extractErrorStatus(error);
  const msg = (error?.message || "").toLowerCase();

  // 503 (High demand / unavailable), 429 (temporary rate limit spike), 500/502/504, connection reset
  if (statusCode === 503 || statusText === "UNAVAILABLE") return true;
  if (statusCode === 429 || statusText === "RESOURCE_EXHAUSTED") return true;
  if (statusCode === 500 || statusCode === 502 || statusCode === 503 || statusCode === 504) return true;
  if (msg.includes("fetch failed") || msg.includes("econnreset") || msg.includes("etimedout") || msg.includes("network error") || msg.includes("overloaded")) {
    return true;
  }

  return false;
}

/**
 * Friendly user messages based on status codes
 */
export function getFriendlyErrorMessageByStatus(statusCode: number, statusText?: string): string {
  switch (statusCode) {
    case 503:
      return "Our AI travel planner is temporarily experiencing high demand. Please try again in a few moments. Your travel preferences have been saved.";
    case 429:
      return "AI request rate limit reached. Please wait a moment and try again. Your preferences are saved.";
    case 400:
      return "Invalid trip parameters received. Please review your destination and dates.";
    case 401:
    case 403:
      return "AI service authentication error. Please verify the server API key.";
    case 404:
      return "The requested AI planning model was not found.";
    case 500:
    default:
      return "Our AI planner encountered an unexpected temporary error. Please try again. Your preferences are saved.";
  }
}

/**
 * Sleep helper with random jitter
 */
const sleep = (ms: number, jitterMs: number = 300) => {
  const jitter = Math.floor(Math.random() * (jitterMs * 2 + 1)) - jitterMs;
  const delay = Math.max(200, ms + jitter);
  return new Promise((resolve) => setTimeout(resolve, delay));
};

export interface GenerateWithRetryParams {
  model?: string;
  fallbackModel?: string;
  contents: GenerateContentParameters["contents"];
  config?: GenerateContentParameters["config"];
  retryConfig?: RetryConfig;
  contextName?: string;
}

/**
 * Generates content using Gemini with exponential backoff retry and fallback model support
 */
export async function generateContentWithRetry(params: GenerateWithRetryParams): Promise<{ response: GenerateContentResponse; modelUsed: string }> {
  const ai = getGeminiClient();
  const primaryModel = params.model || PRIMARY_GEMINI_MODEL;
  const fallbackModel = params.fallbackModel || FALLBACK_GEMINI_MODEL;
  const config = { ...DEFAULT_RETRY_CONFIG, ...params.retryConfig };
  const contextName = params.contextName || "Itinerary Generation";

  console.log(`[Gemini] Starting ${contextName}`);

  // Models queue to attempt in order
  const modelQueue = [primaryModel, fallbackModel, SECONDARY_FALLBACK_MODEL].filter(
    (m, idx, arr) => m && arr.indexOf(m) === idx
  );

  let lastError: any = null;

  for (let mIdx = 0; mIdx < modelQueue.length; mIdx++) {
    const currentModel = modelQueue[mIdx];
    const isPrimary = mIdx === 0;
    const maxAttempts = isPrimary ? config.maxRetries : 2;
    let currentDelay = config.initialDelayMs;

    console.log(`[Gemini] Attempting generation with model: ${currentModel} (Priority ${mIdx + 1}/${modelQueue.length})`);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[Gemini] Model: ${currentModel} | Attempt: ${attempt}/${maxAttempts}`);
        
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: params.contents,
          config: params.config,
        });

        if (!response.text) {
          throw new Error("Empty response received from Gemini API");
        }

        console.log(`[Gemini] Success on model ${currentModel} (Attempt ${attempt})`);
        return { response, modelUsed: currentModel };
      } catch (error: any) {
        lastError = error;
        const { statusCode, statusText } = extractErrorStatus(error);
        const retryable = isRetryableError(error);

        console.warn(
          `[Gemini] Attempt ${attempt} failed on ${currentModel} - Code: ${statusCode} (${statusText}) - Retryable: ${retryable}`
        );

        if (!retryable) {
          // If error is 404 (model not found on older version), immediately proceed to next fallback model
          if (statusCode === 404 && mIdx < modelQueue.length - 1) {
            console.log(`[Gemini] Model ${currentModel} not available (404). Falling back to next model: ${modelQueue[mIdx + 1]}`);
            break;
          }
          break;
        }

        if (attempt < maxAttempts) {
          console.log(`[Gemini] Temporary ${statusCode} error. Retrying in ${(currentDelay / 1000).toFixed(1)}s...`);
          await sleep(currentDelay, config.jitterMs);
          currentDelay = Math.min(currentDelay * config.backoffFactor, config.maxDelayMs);
        }
      }
    }

    // If there is another fallback model in queue and last error was temporary/retryable or 404, continue to next model
    if (mIdx < modelQueue.length - 1 && (isRetryableError(lastError) || extractErrorStatus(lastError).statusCode === 404)) {
      console.log(`[Gemini] Model ${currentModel} failed. Transitioning to fallback model: ${modelQueue[mIdx + 1]}`);
    }
  }

  // Final failure - throw structured GeminiAppError
  const { statusCode, statusText } = extractErrorStatus(lastError);
  const friendlyMessage = getFriendlyErrorMessageByStatus(statusCode, statusText);

  console.error(`[Gemini] All generation attempts exhausted. Final status: ${statusCode} (${statusText})`);
  throw new GeminiAppError(
    lastError?.message || "Failed to generate AI response after retries",
    statusCode,
    friendlyMessage,
    statusText
  );
}
