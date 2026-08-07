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

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API Key is missing in environment variables. Please add GEMINI_API_KEY in your deployment settings.' },
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
      return NextResponse.json({ error: "Gemini AI returned a non-JSON response. Please try refining again." }, { status: 500 });
    }

    try {
      const updatedSchedule = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ schedule: updatedSchedule });
    } catch (parseError: any) {
      console.error("JSON parse error:", parseError, "Raw output:", rawText);
      return NextResponse.json({ error: "Failed to parse schedule JSON from Gemini response. Please try again." }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Failed to refine schedule:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
