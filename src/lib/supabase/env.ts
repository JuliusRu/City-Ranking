// Supabase URL + anon key, sanitized. Some hosting UIs (e.g. Coolify) can
// introduce stray whitespace/newlines when pasting long values; a JWT/URL never
// contains whitespace, so stripping it makes the build resilient to that.
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(
  /\s/g,
  ""
);

export const SUPABASE_ANON_KEY = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
).replace(/\s/g, "");
