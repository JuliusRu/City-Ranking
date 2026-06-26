import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { apiError, apiUnauthorized, apiSuccess } from "@/lib/api-response";
import { getStripe, getProPriceId } from "@/lib/stripe";
import { SITE_URL } from "@/config/constants";

// Starts a Stripe Checkout session for the €1/mo Pro subscription and returns
// its hosted URL; the client redirects there. We never touch card data — Stripe
// collects it. The webhook (not this route) flips isPro once payment succeeds.
export async function POST() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return apiUnauthorized();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, isPro: true, stripeCustomerId: true },
    });
    if (!user) return apiError("User not found", 404);
    if (user.isPro) return apiError("You're already Pro", 400);

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: getProPriceId(), quantity: 1 }],
      // Reuse an existing Stripe customer when we have one, otherwise let
      // Checkout create one from this email. Both client_reference_id and the
      // subscription metadata carry our userId so the webhook can map back.
      ...(user.stripeCustomerId
        ? { customer: user.stripeCustomerId }
        : user.email
          ? { customer_email: user.email }
          : {}),
      client_reference_id: user.id,
      subscription_data: { metadata: { userId: user.id } },
      success_url: `${SITE_URL}/settings?pro=success`,
      cancel_url: `${SITE_URL}/settings?pro=cancelled`,
      allow_promotion_codes: true,
    });

    return apiSuccess({ url: session.url });
  } catch (error) {
    console.error("POST /api/stripe/checkout error:", error);
    return apiError("Failed to start checkout");
  }
}
