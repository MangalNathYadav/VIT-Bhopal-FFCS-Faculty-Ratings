import { NextRequest, NextResponse } from 'next/server';

// Simple In-Memory Rate Limiter (Sliding Window per IP)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  
  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  
  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  return false;
}

// Helper to count morning sub-slots vs evening sub-slots
function getSlotTimeStats(slotStr: string) {
  if (!slotStr) return { morningCount: 0, eveningCount: 0 };
  const subSlots = slotStr.split('+').map(s => s.trim());
  let morningCount = 0;
  let eveningCount = 0;

  subSlots.forEach(s => {
    if (/^[A-F](11|12|13)$/.test(s)) {
      morningCount++;
    } else {
      eveningCount++;
    }
  });

  return { morningCount, eveningCount };
}

export async function POST(req: NextRequest) {
  try {
    // 1. Check Rate Limiting Guardrail
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a minute before requesting another AI schedule generation.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { selectedCourses, timePreference, prioritizeHighRating, mealBreaks } = body;

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API Key is missing in environment variables. Please add GEMINI_API_KEY in your deployment settings.' },
        { status: 500 }
      );
    }

    // 2. Pre-process and sort options based on timePreference and teacher rating
    const preProcessedCourses = selectedCourses.map((c: any) => {
      const sortedOptions = [...c.availableOptions].sort((a: any, b: any) => {
        const statsA = getSlotTimeStats(a.slot);
        const statsB = getSlotTimeStats(b.slot);

        if (c.courseCode === "MAT1031") {
          if (a.teacherName.includes("DHARMALINGAM") && !b.teacherName.includes("DHARMALINGAM")) return -1;
          if (!a.teacherName.includes("DHARMALINGAM") && b.teacherName.includes("DHARMALINGAM")) return 1;
        }

        if (timePreference === 'morning') {
          if (statsB.morningCount !== statsA.morningCount) {
            return statsB.morningCount - statsA.morningCount;
          }
        } else if (timePreference === 'evening') {
          if (statsB.eveningCount !== statsA.eveningCount) {
            return statsB.eveningCount - statsA.eveningCount;
          }
        }

        return (b.rating || -1) - (a.rating || -1);
      });

      return {
        ...c,
        availableOptions: sortedOptions
      };
    });

    // 3. Build Gemini Prompt
    const prompt = `
You are an expert academic schedule optimizer for VIT Bhopal FFCS (Fully Flexible Credit System).
Your task is to select one faculty/slot option for each of the requested courses to build a 100% clash-free timetable.

CRITICAL TIMING & FACULTY SELECTION INSTRUCTIONS:
- User Time Preference is STRICTLY: "${timePreference.toUpperCase()}".
  - If MORNING: You MUST pick options whose slots fall in morning periods (08:30 - 13:10, slots ending in 11, 12, 13 like A11, B11, C11, D11, E11, F11). DO NOT pick evening slots (P4, P5, P6, P7) unless NO morning option exists.
  - If EVENING: You MUST pick options whose slots fall in evening periods (13:15 - 19:30).
- SPECIAL RULE FOR MAT1031 (Calculus BHI): Always pick DHARMALINGAM M (Morning Slot: B11+B12+B13+C14+E11+E12) over DONDU HARISH BABU.
- FACULTY RATING PRIORITY: ${prioritizeHighRating ? 'Maximum priority to higher rated faculties.' : 'Standard consideration'}.

RULES & CONSTRAINTS:
1. No slot clashes allowed! Two slots clash if they share any sub-slot (e.g. A11 clashes with A11).
2. Meal Breaks to Respect: ${JSON.stringify(mealBreaks)}
   - Breakfast: 7:30 - 9:30 AM (Avoid 08:30 slots if breakfast requested)
   - Lunch: 12:00 - 2:30 PM (Avoid 11:40 - 13:10 or 13:15 - 14:45 if lunch requested)
   - Snacks: 5:00 - 6:30 PM (Avoid 16:25 - 17:55 if snacks requested)

PRE-SORTED AVAILABLE COURSE OPTIONS (OPTIMIZED FOR ${timePreference.toUpperCase()} & RATING):
${JSON.stringify(preProcessedCourses, null, 2)}

OUTPUT FORMAT:
Return strictly a raw JSON array of objects representing the chosen schedule option(s):
[
  {
    "courseCode": "CSE1021",
    "courseName": "Intro to Problem Solving",
    "teacherName": "FACULTY NAME",
    "rating": 5.0,
    "slot": "B11+B12",
    "venue": "AB-430",
    "reason": "Morning slot (08:30), top rated faculty"
  }
]

Respond ONLY with valid JSON. Do not include markdown codeblocks or extra text.
`;

    // 4. Call Gemini REST API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API Error Response:", errText);
      return NextResponse.json(
        { error: `Gemini API Key error (${response.status}). Please verify GEMINI_API_KEY environment variable in your Vercel deployment settings.` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Robust JSON Array extraction using Regex
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("No JSON array found in Gemini response:", rawText);
      return NextResponse.json({ error: "Gemini AI returned a non-JSON response. Please try generating again." }, { status: 500 });
    }

    try {
      const scheduleResult = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ schedule: scheduleResult });
    } catch (parseError: any) {
      console.error("JSON parse error:", parseError, "Raw output:", rawText);
      return NextResponse.json({ error: "Failed to parse schedule JSON from Gemini response. Please try again." }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Failed to generate AI schedule:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
