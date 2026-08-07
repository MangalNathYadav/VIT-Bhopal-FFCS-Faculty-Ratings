import { NextRequest, NextResponse } from 'next/server';

// Simple In-Memory Rate Limiter (Sliding Window per IP)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
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

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a minute before requesting another AI refinement.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { currentSchedule, refinementPrompt, allFacultyData } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API Key is missing in environment variables.' },
        { status: 500 }
      );
    }

    // Build Gemini Prompt for Refinement
    const prompt = `
You are an expert academic schedule optimizer for VIT Bhopal FFCS.
The user has an existing timetable schedule and wants to make modifications using natural language instructions.

CURRENT TIMETABLE SCHEDULE:
${JSON.stringify(currentSchedule, null, 2)}

USER'S REFINEMENT REQUEST:
"${refinementPrompt}"

FULL FACULTY & COURSE DATABASE OPTIONS FOR ALTERNATES:
${JSON.stringify(allFacultyData, null, 2)}

INSTRUCTIONS:
1. Apply the user's requested modifications while ensuring the resulting timetable has 100% ZERO slot clashes.
2. If the user asks to change a faculty or slot for a course, pick an alternate option from the database that fits their request.
3. Keep unmodified courses intact unless changing them is necessary to prevent a slot clash.

OUTPUT FORMAT:
Return strictly a raw JSON array of objects representing the updated clash-free schedule:
[
  {
    "courseCode": "CSE1021",
    "courseName": "Intro to Problem Solving",
    "teacherName": "FACULTY NAME",
    "rating": 5.0,
    "slot": "B11+B12",
    "venue": "AB-430",
    "reason": "Swapped to 5.0 rated faculty as requested in prompt"
  }
]

Respond ONLY with valid JSON. Do not include markdown codeblocks or extra text.
`;

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
      console.error("Gemini API Error:", errText);
      return NextResponse.json({ error: `Gemini API returned error status ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const updatedSchedule = JSON.parse(cleanJson);

    return NextResponse.json({ schedule: updatedSchedule });
  } catch (error: any) {
    console.error("Failed to refine schedule:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
