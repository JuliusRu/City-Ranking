// Avatar that shows the user's uploaded picture when present, else a coloured
// circle with their initial. Plain <img> (not next/image) so we don't need
// remotePatterns config; the Supabase domain is already allowed in img-src.
export function Avatar({
  src,
  name,
  size = 40,
  className = "",
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const initial = (name ?? "U").charAt(0).toUpperCase();
  const dim = { width: size, height: size };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? ""}
        style={dim}
        className={`flex-shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      style={dim}
      className={`flex flex-shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground ${className}`}
    >
      {initial}
    </div>
  );
}
