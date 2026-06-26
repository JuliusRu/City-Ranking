import Stripe from "stripe";

// Lazy singleton: constructing Stripe eagerly would throw during `next build`
// (and crash any route that merely imports this) when the key isn't present.
// Instead we build it on first real use, so the key is only required at runtime.
let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  client = new Stripe(key);
  return client;
}

// The recurring €1/mo price, created once in the Stripe dashboard. Kept in env
// so test/live keys can point at their own price ids without a code change.
export function getProPriceId(): string {
  const id = process.env.STRIPE_PRICE_ID;
  if (!id) throw new Error("STRIPE_PRICE_ID is not set");
  return id;
}
