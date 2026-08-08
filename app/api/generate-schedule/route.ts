import { NextRequest, NextResponse } from 'next/server';
import { callGeminiWithRotation } from '../../utils/geminiClient';

// Simple In-Memory Rate Limiter (Sliding Window per IP)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) return true;
  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  return false;
}

function getSlotTimeStats(slotStr: string) {
  if (!slotStr) return { morningCount: 0, eveningCount: 0 };
  const subSlots = slotStr.split('+').map(s => s.trim());
  let morningCount = 0, eveningCount = 0;
  subSlots.forEach(s => { /^[A-F](11|12|13)$/.test(s) ? morningCount++ : eveningCount++; });
  return { morningCount, eveningCount };
}

function getBuildingBlock(venue: string): string {
  if (!venue) return "UNKNOWN";
  const match = venue.match(/(AB-?\d|LC|MB|CB)/i);
  if (match) {
    let block = match[0].toUpperCase();
    if (block.startsWith("AB") && !block.includes("-")) block = block.replace("AB", "AB-");
    return block;
  }
  return "AB-1";
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
    }

    const body = await req.json();
    const { selectedCourses, timePreference, prioritizeHighRating, prioritizeSameBlock, mealBreaks } = body;

    // Pre-process: sort & trim to top 6 candidates per course
    const preProcessedCourses = selectedCourses.map((c: any) => {
      const optionsWithBlocks = c.availableOptions.map((opt: any) => ({
        ...opt,
        buildingBlock: getBuildingBlock(opt.venue)
      }));

      const sortedOptions = [...optionsWithBlocks].sort((a: any, b: any) => {
        if (c.courseCode === "MAT1031") {
          if (a.teacherName.includes("DHARMALINGAM") && !b.teacherName.includes("DHARMALINGAM")) return -1;
          if (!a.teacherName.includes("DHARMALINGAM") && b.teacherName.includes("DHARMALINGAM")) return 1;
        }
        const statsA = getSlotTimeStats(a.slot), statsB = getSlotTimeStats(b.slot);
        if (timePreference === 'morning' && statsB.morningCount !== statsA.morningCount) return statsB.morningCount - statsA.morningCount;
        if (timePreference === 'evening' && statsB.eveningCount !== statsA.eveningCount) return statsB.eveningCount - statsA.eveningCount;
        return (b.rating || -1) - (a.rating || -1);
      });

      return { ...c, availableOptions: sortedOptions.slice(0, 6) };
    });

    const prompt = `You are an expert academic schedule optimizer for VIT Bhopal FFCS.
Select one faculty/slot option for each requested course to build a 100% clash-free timetable.

CONSTRAINTS:
- TIME PREFERENCE: "${timePreference.toUpperCase()}" (Morning=08:30-13:10 / Evening=13:15-19:30).
- SAME BLOCK: ${prioritizeSameBlock ? 'ENABLED (avoid AB-1↔AB-2 10-min sprint)' : 'DISABLED'}.
- MAT1031: Pick DHARMALINGAM M over DONDU HARISH BABU.
- RATING: ${prioritizeHighRating ? 'Prefer higher rated.' : 'Standard'}.
- Meals: ${JSON.stringify(mealBreaks)}

TOP CANDIDATE OPTIONS:
${JSON.stringify(preProcessedCourses, null, 2)}

Return strictly a raw JSON array:
[{"courseCode":"...","courseName":"...","teacherName":"...","rating":5.0,"slot":"...","venue":"...","reason":"..."}]
No markdown, no extra text.`;

    const result = await callGeminiWithRotation(prompt);

    // If all keys are rate-limited, return retryAfterMs so frontend can auto-retry
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, retryAfterMs: result.retryAfterMs },
        { status: 503 }
      );
    }

    const jsonMatch = result.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Gemini returned non-JSON. Please try again." }, { status: 500 });
    }

    try {
      const scheduleResult = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ schedule: scheduleResult });
    } catch {
      return NextResponse.json({ error: "Failed to parse Gemini JSON. Please try again." }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
