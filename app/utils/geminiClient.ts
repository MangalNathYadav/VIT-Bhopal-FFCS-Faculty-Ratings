/**
 * Multi-Key Round-Robin & Auto-Fallback Client for Google Gemini API.
 * Automatically rotates between multiple API keys and falls back if any key hits HTTP 429 (Rate Limit).
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

export async function callGeminiWithRotation(prompt: string): Promise<{ text: string; keyUsedIndex: number; totalKeys: number }> {
  const keys = getGeminiApiKeys();

  if (keys.length === 0) {
    throw new Error('Gemini API Key is missing in environment variables. Please add GEMINI_API_KEY in your deployment settings.');
  }

  const models = ['gemini-flash-latest', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'];
  let lastError = '';

  // Try up to keys.length attempts, rotating keys on 429 / rate limits
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
            // Update global pointer for round-robin
            keyIndex = (currentKeyIndex + 1) % keys.length;
            return { text: rawText, keyUsedIndex: currentKeyIndex, totalKeys: keys.length };
          }
        }

        const errText = await response.text();
        console.warn(`Gemini Key #${currentKeyIndex + 1}/${keys.length} (${model}) status ${response.status}: ${errText.substring(0, 100)}`);

        if (response.status === 429 || response.status === 403) {
          lastError = `Rate limit / quota reached on key #${currentKeyIndex + 1}`;
          // Break model loop to switch to next key in pool!
          break;
        } else {
          lastError = `Gemini API status ${response.status}: ${errText.substring(0, 100)}`;
        }
      } catch (err: any) {
        console.error(`Gemini fetch error on key #${currentKeyIndex + 1}:`, err);
        lastError = err.message || 'Fetch error';
      }
    }
  }

  // If all keys in pool failed
  throw new Error(`All ${keys.length} Gemini API Key(s) in pool hit rate limit / quota. Please wait 20 seconds or add more keys to GEMINI_API_KEYS.`);
}
