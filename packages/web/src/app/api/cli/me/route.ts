import { NextRequest, NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";

export async function GET(req: NextRequest) {
  // In a real implementation, we'd validate the bearer token against Convex Auth
  // For the MVP proxy, we'll assume the CLI sends a valid token and we fetch the user
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // In production, we'd use convex Auth logic here. Since this is an external API route,
    // we would ideally use a custom token or JWT exchange. For now, we mock the return
    // based on the presence of a token for the sake of the MVP implementation plan.
    
    // Example: verify token, get userId, fetch tier
    // const user = await verifyToken(token);
    
    return NextResponse.json({
      tier: "pro", // Mocked for now, assumes any token is a Pro user
      id: "user_123",
      email: "founder@example.com"
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
