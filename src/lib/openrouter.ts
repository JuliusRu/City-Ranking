import { SITE_URL } from "@/config/constants";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Cheap + reliable JSON-capable default (~$0.25/M tokens ≈ 16k extractions per
// dollar). Override with OPENROUTER_MODEL — e.g. a "...:free" model for zero
// cost, though free models are often upstream-rate-limited (429).
const DEFAULT_MODEL = "google/gemini-3.1-flash-lite";

export class OpenRouterError extends Error {}

// Pull the first {...} object out of a model reply, in case a model ignores the
// json_object response format and wraps the JSON in prose / a code fence.
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new OpenRouterError("Model did not return JSON");
  }
  return body.slice(start, end + 1);
}

/**
 * Ask an OpenRouter model for a JSON object and return it parsed. Server-side
 * only — reads OPENROUTER_API_KEY from the environment (never exposed to the
 * client). Throws OpenRouterError on missing key / API failure / bad JSON.
 */
export async function chatJSON(opts: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<unknown> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new OpenRouterError("OPENROUTER_API_KEY is not set");
  }

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      // Optional attribution headers OpenRouter uses for its dashboard rankings.
      "HTTP-Referer": SITE_URL,
      "X-Title": "City Ranking",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: opts.maxTokens ?? 800,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new OpenRouterError(
      `OpenRouter request failed (${res.status}): ${detail.slice(0, 200)}`
    );
  }

  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";
  if (!content) throw new OpenRouterError("Empty model response");

  try {
    return JSON.parse(extractJson(content));
  } catch {
    throw new OpenRouterError("Could not parse model JSON");
  }
}
