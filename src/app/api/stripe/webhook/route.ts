import { NextRequest } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

// Node runtime: we need the RAW request bytes for signature verification, and
// the Stripe SDK isn't edge-compatible. force-dynamic so the body is never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Flip isPro for the user behind a subscription. We resolve them by the userId we
// stamped into subscription metadata at checkout, falling back to the stored
// subscription id. updateMany so an unmatched event is a no-op, not a throw.
async function setProForSubscription(sub: Stripe.Subscription, isPro: boolean) {
  const metaUserId = sub.metadata?.userId;
  await prisma.user.updateMany({
    where: metaUserId ? { id: metaUserId } : { stripeSubscriptionId: sub.id },
    data: { isPro },
  });
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return new Response("Webhook not configured", { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  // Raw body — constructEvent verifies it against the signature header, proving
  // the request really came from Stripe (this is the whole security model here).
  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      // Payment succeeded → grant Pro and link the Stripe customer/subscription.
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId =
          s.client_reference_id ?? (s.metadata?.userId as string | undefined);
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              isPro: true,
              proSince: new Date(),
              stripeCustomerId:
                typeof s.customer === "string" ? s.customer : undefined,
              stripeSubscriptionId:
                typeof s.subscription === "string" ? s.subscription : undefined,
            },
          });
        }
        break;
      }
      // Status changed (renewal, past_due, cancel-at-period-end took effect…).
      // Pro stays on only while the sub is genuinely active/trialing.
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const active = sub.status === "active" || sub.status === "trialing";
        await setProForSubscription(sub, active);
        break;
      }
      // Subscription fully ended → revoke Pro (accent reverts via profile.ts).
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await setProForSubscription(sub, false);
        break;
      }
    }
  } catch (err) {
    console.error(`Stripe webhook handler error (${event.type}):`, err);
    // 500 → Stripe retries with backoff, so a transient DB blip self-heals.
    return new Response("Handler error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
