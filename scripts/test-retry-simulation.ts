import {
  extractErrorStatus,
  isRetryableError,
  PRIMARY_GEMINI_MODEL,
  FALLBACK_GEMINI_MODEL,
} from '../lib/gemini';

async function runSimulationTests() {
  console.log('\n--- Running Gemini Retry & Fallback Simulation Tests ---\n');

  // Simulation 1: Mock 503 with Backoff Retry Logic
  console.log('Simulating 503 Backoff Sequence:');
  let attemptCount = 0;
  const mockPrimaryCall = async () => {
    attemptCount++;
    if (attemptCount <= 2) {
      console.log(`  Attempt ${attemptCount}: Mocking 503 UNAVAILABLE (High Demand)`);
      const err: any = new Error('503 Service Unavailable');
      err.status = 503;
      err.error = { code: 503, status: 'UNAVAILABLE' };
      throw err;
    }
    console.log(`  Attempt ${attemptCount}: Success!`);
    return { text: '{"destination": "Pokhara", "durationDays": 3}' };
  };

  const simulateRetry = async (fn: () => Promise<any>, maxRetries = 4) => {
    let delay = 50; // fast delay for unit test
    for (let i = 1; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (err) {
        if (!isRetryableError(err) || i >= maxRetries) throw err;
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
      }
    }
  };

  const res1 = await simulateRetry(mockPrimaryCall);
  console.log('✅ Simulation 1 Passed: Succeeded after 2 retries on attempt', attemptCount);

  // Simulation 2: Primary fails 4 times with 503 -> Seamless Fallback to Secondary Model
  console.log('\nSimulating Primary Model Failure -> Fallback Model Execution:');
  let primaryAttempts = 0;
  let fallbackAttempts = 0;

  const mockExhaustedPrimary = async () => {
    primaryAttempts++;
    const err: any = new Error('This model is currently experiencing high demand.');
    err.status = 503;
    throw err;
  };

  const mockFallback = async () => {
    fallbackAttempts++;
    return { text: '{"destination": "Pokhara", "status": "from_fallback"}' };
  };

  const simulatePrimaryAndFallback = async () => {
    try {
      await simulateRetry(mockExhaustedPrimary, 3);
    } catch (primaryErr) {
      if (isRetryableError(primaryErr)) {
        console.log(`  Primary model exhausted after ${primaryAttempts} attempts. Switching to fallback: ${FALLBACK_GEMINI_MODEL}`);
        return await simulateRetry(mockFallback, 2);
      }
      throw primaryErr;
    }
  };

  const res2 = await simulatePrimaryAndFallback();
  console.log('✅ Simulation 2 Passed: Fallback succeeded on attempt', fallbackAttempts);

  console.log('\n✨ All Simulation Tests Passed!\n');
}

runSimulationTests();
