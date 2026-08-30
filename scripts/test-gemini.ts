import {
  extractErrorStatus,
  isRetryableError,
  getFriendlyErrorMessageByStatus,
  GeminiAppError,
} from '../lib/gemini';

function runTests() {
  console.log('--- Running Gemini Resilience Unit & Status Tests ---');
  let passed = 0;
  let total = 0;

  function assert(name: string, condition: boolean, details?: any) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}`, details);
    }
  }

  // Test 1: 503 UNAVAILABLE Detection & Retryable Check
  const error503 = {
    error: {
      code: 503,
      message: 'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.',
      status: 'UNAVAILABLE',
    },
  };
  const status503 = extractErrorStatus(error503);
  assert('Detects 503 status code', status503.statusCode === 503);
  assert('Detects UNAVAILABLE status text', status503.statusText === 'UNAVAILABLE');
  assert('503 is marked as retryable', isRetryableError(error503));
  assert(
    'Friendly message for 503 is helpful',
    getFriendlyErrorMessageByStatus(503).includes('temporarily experiencing high demand')
  );

  // Test 2: 429 RESOURCE_EXHAUSTED Detection & Retryable Check
  const error429 = {
    status: 429,
    message: 'Quota exceeded for quota metric GenerateContentRequests',
  };
  const status429 = extractErrorStatus(error429);
  assert('Detects 429 status code', status429.statusCode === 429);
  assert('429 is marked as retryable for temporary spikes', isRetryableError(error429));
  assert(
    'Friendly message for 429 is friendly',
    getFriendlyErrorMessageByStatus(429).includes('rate limit reached')
  );

  // Test 3: 400 Bad Request
  const error400 = {
    status: 400,
    message: 'Invalid argument: duration is out of range',
  };
  const status400 = extractErrorStatus(error400);
  assert('Detects 400 status code', status400.statusCode === 400);
  assert('400 is NOT retryable', !isRetryableError(error400));
  assert(
    'Friendly message for 400 asks to check parameters',
    getFriendlyErrorMessageByStatus(400).includes('Invalid trip parameters')
  );

  // Test 4: 401 / 403 Authentication Error
  const error401 = {
    status: 401,
    message: 'API key not valid. Please pass a valid API key.',
  };
  const status401 = extractErrorStatus(error401);
  assert('Detects 401 status code', status401.statusCode === 401);
  assert('401 is NOT retryable', !isRetryableError(error401));
  assert(
    'Friendly message for 401 notifies about API key',
    getFriendlyErrorMessageByStatus(401).includes('authentication error')
  );

  // Test 5: Network / Connection reset error
  const networkError = new Error('fetch failed: ECONNRESET');
  assert('Network errors marked retryable', isRetryableError(networkError));

  // Test 6: Custom GeminiAppError
  const appError = new GeminiAppError('Internal failure', 503, 'Planner is busy', 'UNAVAILABLE');
  assert('GeminiAppError holds statusCode', appError.statusCode === 503);
  assert('GeminiAppError holds userMessage', appError.userMessage === 'Planner is busy');

  console.log(`\nResults: ${passed}/${total} assertions passed successfully! ✨\n`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
