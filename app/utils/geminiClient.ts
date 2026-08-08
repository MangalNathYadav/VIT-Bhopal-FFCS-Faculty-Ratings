/**
 * Multi-Key Round-Robin & Auto-Retry Fallback Client for Google Gemini API.
 * Uses strictly gemini-flash-latest (with gemini-1.5-flash fallback).
 * Automatically rotates between multiple API keys and retries on HTTP 429 (Rate Limit).
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

  // Use strictly valid Gemini models as requested (gemini-flash-latest)
  const models = ['gemini-flash-latest', 'gemini-1.5-flash'];
  const MAX_RETRY_CYCLES = 4;
  let lastError = '';

  for (let cycle = 1; cycle <= MAX_RETRY_CYCLES; cycle++) {
    // Rotate keys starting from current pointer
    for (let attempt = 0; attempt < keys.length; attempt++) {
      const currentKeyIndex = (keyIndex + attempt) % keys.length;
      const apiKey = keys[currentKeyIndex];

      for (const model of models) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-goog-api-key': apiKey,
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          });

          if (response.ok) {
            const data = await response.json();
            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (rawText) {
              keyIndex = (currentKeyIndex + 1) % keys.length;
              return { text: rawText, keyUsedIndex: currentKeyIndex, totalKeys: keys.length };
            }
          }

          const errText = await response.text();
          console.warn(`[Cycle ${cycle}/${MAX_RETRY_CYCLES}] Gemini Key #${currentKeyIndex + 1}/${keys.length} (${model}) status ${response.status}: ${errText.substring(0, 150)}`);

          if (response.status === 429) {
            lastError = `Rate limit (429) reached on key #${currentKeyIndex + 1}`;
            // Try next key in pool immediately
            break;
          } else if (response.status === 400 || response.status === 403) {
            // Log exact Google API Error for invalid key / project configuration
            lastError = `Google Gemini API Error (${response.status}) on key #${currentKeyIndex + 1}: ${errText.substring(0, 150)}`;
            // Continue trying other keys in pool
            break;
          } else {
            lastError = `Gemini API Error (${response.status}): ${errText.substring(0, 150)}`;
          }
        } catch (err: any) {
          console.error(`Fetch error on key #${currentKeyIndex + 1} (${model}):`, err);
          lastError = err.message || 'Network fetch error';
        }
      }
    }

    // Wait briefly before auto-retrying next cycle if all keys were busy/rate-limited
    if (cycle < MAX_RETRY_CYCLES) {
      const backoffMs = cycle * 1500;
      await sleep(backoffMs);
    }
  }

  throw new Error(lastError || `Google Gemini API Error across all ${keys.length} key(s). Please verify your Google AI Studio API key format.`);
}
