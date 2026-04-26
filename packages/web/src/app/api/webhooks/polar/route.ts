import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

const webhookSecret = process.env.POLAR_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("webhook-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const wh = new Webhook(webhookSecret);
    const event = wh.verify(rawBody, {
      "webhook-signature": signature,
    }) as any;

    switch (event.type) {
      case "subscription.created":
      case "subscription.updated":
        const sub = event.data;
        const userId = sub.customerMetadata?.userId;
        
        if (!userId) {
          console.error("No userId in customer metadata", sub.id);
          break;
        }

        await fetchMutation(api.subscriptions.upsertSubscription, {
          userId: userId as Id<"users">,
          polarId: sub.id,
          polarPriceId: sub.priceId,
          status: sub.status,
          currentPeriodEnd: sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).getTime() : undefined,
        });
        break;
      
      case "subscription.canceled":
        // Handle cancel
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Polar webhook error:", err);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
