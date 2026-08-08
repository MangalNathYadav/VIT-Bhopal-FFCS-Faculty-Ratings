/**
 * Multi-Key Round-Robin Client for Google Gemini API.
 * Uses STRICTLY `gemini-flash-latest` model endpoint as requested by user.
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

  // STRICT SINGLE MODEL CHOICE AS INSTRUCTED BY USER: gemini-flash-latest ONLY
  const MODEL = 'gemini-flash-latest';
  let lastError = '';

  // Rotate through keys starting from current pointer
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
          return { text: rawText, keyUsedIndex: currentKeyIndex, totalKeys: keys.length };
        }
      }

      const errText = await response.text();
      console.warn(`Gemini Key #${currentKeyIndex + 1}/${keys.length} (${MODEL}) status ${response.status}: ${errText.substring(0, 150)}`);

      if (response.status === 429) {
        lastError = `Rate limit (429) reached on API Key #${currentKeyIndex + 1}`;
      } else {
        lastError = `Gemini API Error (${response.status}) on Key #${currentKeyIndex + 1}: ${errText.substring(0, 150)}`;
      }
    } catch (err: any) {
      console.error(`Fetch error on Key #${currentKeyIndex + 1}:`, err);
      lastError = err.message || 'Fetch error';
    }
  }

  throw new Error(`Google Gemini API Rate Limit / Quota reached across all ${keys.length} key(s) on ${MODEL}. Please wait 15 seconds or add more keys to GEMINI_API_KEYS.`);
}
