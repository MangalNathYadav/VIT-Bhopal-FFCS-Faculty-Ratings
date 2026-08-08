/**
 * Multi-Key Round-Robin & Auto-Retry Fallback Client for Google Gemini API.
 * Automatically rotates between multiple API keys, tries alternate models,
 * and continuously auto-retries with exponential backoff on HTTP 429 rate limits until a schedule is generated!
 */

let keyIndex = 0;

export function getGeminiApiKeys(): string[] {
  const keys: string[] = [];

  // 1. Check comma-separated GEMINI_API_KEYS or GEMINI_API_KEY
  const rawEnv = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
  if (rawEnv) {
    rawEnv.split(',').forEach(k => {
      const trimmed = k.trim();
      if (trimmed && !keys.includes(trimmed)) {
        keys.push(trimmed);
      }
    });
  }

  // 2. Check numbered keys: GEMINI_API_KEY_1, GEMINI_API_KEY_2, GEMINI_API_KEY_3, etc.
  for (let i = 1; i <= 10; i++) {
    const k = (process.env[`GEMINI_API_KEY_${i}`] || '').trim();
    if (k && !keys.includes(k)) {
      keys.push(k);
    }
  }

  return keys;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function callGeminiWithRotation(prompt: string): Promise<{ text: string; keyUsedIndex: number; totalKeys: number }> {
  const keys = getGeminiApiKeys();

  if (keys.length === 0) {
    throw new Error('Gemini API Key is missing in environment variables. Please add GEMINI_API_KEY in your deployment settings.');
  }

  // Official high-performance Gemini models
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-flash-latest', 'gemini-1.5-pro'];
  const MAX_RETRY_CYCLES = 5;
  let lastError = '';

  for (let cycle = 1; cycle <= MAX_RETRY_CYCLES; cycle++) {
    // Try each key in the pool starting from the current keyIndex pointer
    for (let attempt = 0; attempt < keys.length; attempt++) {
      const currentKeyIndex = (keyIndex + attempt) % keys.length;
      const apiKey = keys[currentKeyIndex];

      for (const model of models) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': apiKey,
              },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
              })
            }
          );

          if (response.ok) {
            const data = await response.json();
            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (rawText) {
              // Advance pointer for next call
              keyIndex = (currentKeyIndex + 1) % keys.length;
              return { text: rawText, keyUsedIndex: currentKeyIndex, totalKeys: keys.length };
            }
          }

          const errText = await response.text();
          console.warn(`[Cycle ${cycle}/${MAX_RETRY_CYCLES}] Gemini Key #${currentKeyIndex + 1}/${keys.length} (${model}) status ${response.status}: ${errText.substring(0, 100)}`);

          if (response.status === 429 || response.status === 403) {
            lastError = `Rate limit reached on key #${currentKeyIndex + 1} (${model})`;
            // Break model loop to try next key in pool immediately
            break;
          } else {
            lastError = `Gemini API status ${response.status}: ${errText.substring(0, 100)}`;
          }
        } catch (err: any) {
          console.error(`Fetch error on key #${currentKeyIndex + 1} (${model}):`, err);
          lastError = err.message || 'Network fetch error';
        }
      }
    }

    // If all keys hit rate limits in this cycle, wait briefly before auto-retrying cycle
    if (cycle < MAX_RETRY_CYCLES) {
      const backoffMs = cycle * 2000; // 2s, 4s, 6s...
      console.log(`All ${keys.length} key(s) busy/rate-limited. Auto-retrying in ${backoffMs / 1000}s (Cycle ${cycle}/${MAX_RETRY_CYCLES})...`);
      await sleep(backoffMs);
    }
  }

  // If all retry cycles completed without success
  throw new Error(`Google Gemini API Rate Limit / Quota reached across all ${keys.length} key(s) after ${MAX_RETRY_CYCLES} auto-retry attempts. Please wait 15 seconds and try again, or add additional keys to GEMINI_API_KEYS.`);
}
