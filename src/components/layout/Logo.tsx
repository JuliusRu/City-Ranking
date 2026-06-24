// Brand mark: a wireframe globe encircled by ten 4-point sparkles, all in one
// colour (inherits currentColor — sky-blue in the header). Globe = cities, the
// ring of stars = ratings. Scales cleanly; size via the className (default h-7 w-7).
const SPARKLE =
  "M0,-4 C0.7,-0.7 0.7,-0.7 4,0 C0.7,0.7 0.7,0.7 0,4 C-0.7,0.7 -0.7,0.7 -4,0 C-0.7,-0.7 -0.7,-0.7 0,-4 Z";

const STAR_COUNT = 10;
const RING_RADIUS = 20; // distance of each star from the globe's center
const CENTER = 24;

// Ten stars evenly spaced around the globe, starting at the top (12 o'clock).
const stars = Array.from({ length: STAR_COUNT }, (_, i) => {
  const angle = (-90 + (360 / STAR_COUNT) * i) * (Math.PI / 180);
  return {
    x: +(CENTER + RING_RADIUS * Math.cos(angle)).toFixed(2),
    y: +(CENTER + RING_RADIUS * Math.sin(angle)).toFixed(2),
  };
});

export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      {/* globe */}
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="24" cy="24" r="12" />
        <ellipse cx="24" cy="24" rx="12" ry="4.7" />
        <path d="M24 12 C 16 18, 16 30, 24 36" />
        <path d="M24 12 C 32 18, 32 30, 24 36" />
      </g>
      {/* ring of ten sparkles — same colour as the globe */}
      <g fill="currentColor">
        {stars.map((s, i) => (
          <path
            key={i}
            d={SPARKLE}
            transform={`translate(${s.x} ${s.y}) scale(0.6)`}
          />
        ))}
      </g>
    </svg>
  );
}
