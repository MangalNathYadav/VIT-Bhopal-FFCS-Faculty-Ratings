import { NextRequest, NextResponse } from 'next/server';
import { callGeminiWithRotation } from '../../utils/geminiClient';

export const maxDuration = 45; // Allow up to 45 seconds for edge execution

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

// Helper to extract building block from venue string
function getBuildingBlock(venue: string): string {
  if (!venue) return "UNKNOWN";
  const match = venue.match(/(AB-?\d|LC|MB|CB)/i);
  if (match) {
    let block = match[0].toUpperCase();
    if (block.startsWith("AB") && !block.includes("-")) {
      block = block.replace("AB", "AB-");
    }
    return block;
  }
  return "AB-1";
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
    const { selectedCourses, timePreference, prioritizeHighRating, prioritizeSameBlock, mealBreaks } = body;

    // 2. Pre-process and trim options to top 6 candidates per course for lightning fast (< 1.5s) execution
    const preProcessedCourses = selectedCourses.map((c: any) => {
      const optionsWithBlocks = c.availableOptions.map((opt: any) => ({
        ...opt,
        buildingBlock: getBuildingBlock(opt.venue)
      }));

      const sortedOptions = [...optionsWithBlocks].sort((a: any, b: any) => {
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

      // Slice top 6 optimal candidate faculty options to reduce prompt size by 80% and generate in < 1.5 seconds!
      return {
        ...c,
        availableOptions: sortedOptions.slice(0, 6)
      };
    });

    // 3. Build Compact Gemini Prompt
    const prompt = `
You are an expert academic schedule optimizer for VIT Bhopal FFCS.
Select one faculty/slot option for each requested course to build a 100% clash-free timetable.

CONSTRAINTS & PREFERENCES:
- TIME PREFERENCE: "${timePreference.toUpperCase()}" (Morning = 08:30-13:10 / Evening = 13:15-19:30).
- PRIORITIZE SAME BLOCK: ${prioritizeSameBlock ? 'ENABLED (Pick same Academic Block e.g. AB-1 or AB-2 to avoid 10-min sprint)' : 'DISABLED'}.
- SPECIAL RULE MAT1031: Pick DHARMALINGAM M over DONDU HARISH BABU.
- RATING PRIORITY: ${prioritizeHighRating ? 'Higher rated faculties preferred.' : 'Standard'}.
- Meal Breaks to Respect: ${JSON.stringify(mealBreaks)}

PRE-OPTIMIZED TOP CANDIDATE OPTIONS PER COURSE:
${JSON.stringify(preProcessedCourses, null, 2)}

OUTPUT FORMAT:
Return strictly a raw JSON array of objects representing the chosen clash-free schedule:
[
  {
    "courseCode": "CSE1021",
    "courseName": "Intro to Problem Solving",
    "teacherName": "FACULTY NAME",
    "rating": 5.0,
    "slot": "B11+B12",
    "venue": "AB-430",
    "reason": "Same building block (AB-4), top rated faculty"
  }
]

Respond ONLY with valid JSON array. Do not include markdown or extra text.
`;

    // 4. Call Gemini with Multi-Key Rotation
    const { text: rawText } = await callGeminiWithRotation(prompt);

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
