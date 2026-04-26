import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { BriefSchema } from "@loopkit/shared";

// Server-side Anthropic instance
const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Authentication required for AI features." }, { status: 401 });
    }

    // In a real app, verify the token and get the user's tier from Convex.
    // We reject if the user is on the Free tier.
    // For this implementation, we will assume validity and proceed to proxy the AI call.

    const body = await req.json();
    const { prompt, system } = body;

    if (!prompt || !system) {
      return NextResponse.json({ error: "Missing prompt or system payload" }, { status: 400 });
    }

    const { object } = await generateObject({
      model: anthropic("claude-3-7-sonnet-20250219"),
      system,
      prompt,
      schema: BriefSchema,
      temperature: 0.2,
    });

    return NextResponse.json({ result: object });
  } catch (error) {
    console.error("AI Proxy Error:", error);
    return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 });
  }
}
