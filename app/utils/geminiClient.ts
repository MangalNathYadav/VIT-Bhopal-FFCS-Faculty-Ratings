/**
 * Multi-Key Round-Robin Client for Google Gemini API.
 * Uses STRICTLY `gemini-flash-latest` model endpoint.
 * Returns retryAfterMs when all keys are rate-limited so the caller can retry.
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

  // 2. Check numbered keys: GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.
  for (let i = 1; i <= 10; i++) {
    const k = (process.env[`GEMINI_API_KEY_${i}`] || '').trim();
    if (k && !keys.includes(k)) {
      keys.push(k);
    }
  }

  return keys;
}

export type GeminiResult =
  | { ok: true; text: string; keyUsedIndex: number; totalKeys: number }
  | { ok: false; retryAfterMs: number; error: string; totalKeys: number };

export async function callGeminiWithRotation(prompt: string): Promise<GeminiResult> {
  const keys = getGeminiApiKeys();

  if (keys.length === 0) {
    return { ok: false, retryAfterMs: 0, error: 'Gemini API Key is missing. Please add GEMINI_API_KEY in your deployment settings.', totalKeys: 0 };
  }

  const MODEL = 'gemini-flash-latest';
  let maxRetryDelay = 0;

  // Rotate through all keys starting from current pointer
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const currentKeyIndex = (keyIndex + attempt) % keys.length;
    const apiKey = keys[currentKeyIndex];

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
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
          keyIndex = (currentKeyIndex + 1) % keys.length;
          return { ok: true, text: rawText, keyUsedIndex: currentKeyIndex, totalKeys: keys.length };
        }
      }

      const errText = await response.text();
      console.warn(`Gemini Key #${currentKeyIndex + 1}/${keys.length} (${MODEL}) status ${response.status}: ${errText.substring(0, 150)}`);

      if (response.status === 429) {
        // Extract retryDelay from Google's error response
        try {
          const errJson = JSON.parse(errText);
          const retryInfo = errJson?.error?.details?.find((d: any) => d['@type']?.endsWith('RetryInfo'));
          if (retryInfo?.retryDelay) {
            const secs = parseFloat(retryInfo.retryDelay.replace('s', ''));
            if (secs > maxRetryDelay) maxRetryDelay = secs;
          }
        } catch { /* ignore parse errors */ }
      }
    } catch (err: any) {
      console.error(`Fetch error on Key #${currentKeyIndex + 1}:`, err);
    }
  }

  // All keys exhausted — return retry signal instead of throwing
  const retryMs = maxRetryDelay > 0 ? Math.ceil(maxRetryDelay * 1000) + 1000 : 22000;
  return {
    ok: false,
    retryAfterMs: retryMs,
    error: `All ${keys.length} API key(s) hit rate limit. Auto-retrying in ${Math.ceil(retryMs / 1000)}s...`,
    totalKeys: keys.length
  };
}
