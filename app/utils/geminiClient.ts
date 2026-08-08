/**
 * Ultra-Fast Multi-Key Round-Robin Client for Google Gemini API.
 * Instantly rotates across multiple API keys with fast AbortSignal timeouts (6s max)
 * to prevent serverless function 504 Inactivity Timeout errors on Netlify/Vercel.
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

export async function callGeminiWithRotation(prompt: string): Promise<{ text: string; keyUsedIndex: number; totalKeys: number }> {
  const keys = getGeminiApiKeys();

  if (keys.length === 0) {
    throw new Error('Gemini API Key is missing in environment variables. Please add GEMINI_API_KEY in your deployment settings.');
  }

  // Strictly use valid model (gemini-flash-latest with gemini-1.5-flash fallback)
  const models = ['gemini-flash-latest', 'gemini-1.5-flash'];
  let lastError = '';

  // Try each key in pool starting from keyIndex pointer without artificial delays
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const currentKeyIndex = (keyIndex + attempt) % keys.length;
    const apiKey = keys[currentKeyIndex];

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        
        // Fast 6-second timeout signal to avoid hanging serverless functions
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (rawText) {
            keyIndex = (currentKeyIndex + 1) % keys.length;
            return { text: rawText, keyUsedIndex: currentKeyIndex, totalKeys: keys.length };
          }
        }

        const errText = await response.text();
        console.warn(`Gemini Key #${currentKeyIndex + 1}/${keys.length} (${model}) status ${response.status}: ${errText.substring(0, 120)}`);

        if (response.status === 429) {
          lastError = `Rate limit (429) reached on API Key #${currentKeyIndex + 1}`;
          break; // Switch to next key immediately!
        } else if (response.status === 400 || response.status === 403) {
          lastError = `Google Gemini API Error (${response.status}) on Key #${currentKeyIndex + 1}: ${errText.substring(0, 120)}`;
          break;
        } else {
          lastError = `Gemini API Error (${response.status}): ${errText.substring(0, 120)}`;
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.warn(`Key #${currentKeyIndex + 1} (${model}) timed out after 6s. Trying next option...`);
          lastError = `Request timed out on Key #${currentKeyIndex + 1}`;
        } else {
          console.error(`Fetch error on Key #${currentKeyIndex + 1}:`, err);
          lastError = err.message || 'Fetch error';
        }
      }
    }
  }

  throw new Error(lastError || `Google Gemini API Quota / Rate Limit reached across all ${keys.length} key(s). Please try again in 10-15 seconds or add additional keys.`);
}
