import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { apiError, apiUnauthorized, apiSuccess } from "@/lib/api-response";
import { getStripe } from "@/lib/stripe";
import { SITE_URL } from "@/config/constants";

// Opens Stripe's hosted Billing Portal so a subscriber can update their card or
// cancel — no cancellation UI to build ourselves, and it satisfies the EU
// "easy cancellation" requirement. Returns the URL; the client redirects.
export async function POST() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return apiUnauthorized();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });
    if (!user?.stripeCustomerId) return apiError("No subscription found", 400);

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${SITE_URL}/settings`,
    });

    return apiSuccess({ url: session.url });
  } catch (error) {
    console.error("POST /api/stripe/portal error:", error);
    return apiError("Failed to open billing portal");
  }
}
