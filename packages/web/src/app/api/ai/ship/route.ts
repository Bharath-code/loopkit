import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { ShipDraftsSchema } from "@loopkit/shared";
import { verifyAndRateLimit, incrementAIUsage } from "../_helpers";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAndRateLimit(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { prompt, system } = body;

    if (!prompt || !system) {
      return NextResponse.json({ error: "Missing prompt or system payload" }, { status: 400 });
    }

    const { object } = await generateObject({
      model: anthropic("claude-3-7-sonnet-20250219"),
      system,
      prompt,
      schema: ShipDraftsSchema,
      temperature: 0.4,
    });

    await incrementAIUsage(auth.token, auth.user._id);

    return NextResponse.json({ result: object });
  } catch (error) {
    console.error("AI Proxy Error:", error);
    return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 });
  }
}
