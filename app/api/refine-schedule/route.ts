import { NextRequest, NextResponse } from 'next/server';
import { callGeminiWithRotation } from '../../utils/geminiClient';

const rateLimitMap = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const valid = timestamps.filter(ts => now - ts < 60000);
  if (valid.length >= 10) return true;
  valid.push(now);
  rateLimitMap.set(ip, valid);
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests. Please wait.' }, { status: 429 });
    }

    const body = await req.json();
    const { currentSchedule, refinementPrompt, allFacultyData } = body;

    const prompt = `You are an expert schedule optimizer for VIT Bhopal FFCS.
Modify the user's existing schedule based on their instruction while keeping 0 slot clashes.

CURRENT SCHEDULE:
${JSON.stringify(currentSchedule, null, 2)}

USER REQUEST: "${refinementPrompt}"

AVAILABLE FACULTY OPTIONS:
${JSON.stringify(allFacultyData, null, 2)}

Return strictly a raw JSON array of the updated clash-free schedule:
[{"courseCode":"...","courseName":"...","teacherName":"...","rating":5.0,"slot":"...","venue":"...","reason":"..."}]
No markdown, no extra text.`;

    const result = await callGeminiWithRotation(prompt);

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
      const updatedSchedule = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ schedule: updatedSchedule });
    } catch {
      return NextResponse.json({ error: "Failed to parse Gemini JSON. Please try again." }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
