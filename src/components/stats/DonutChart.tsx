"use client";

const COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
  "#06b6d4", // cyan
  "#f97316", // orange
];

interface DonutChartProps {
  data: { label: string; value: number }[];
}

export function DonutChart({ data }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  // Build conic-gradient stops
  let cumulative = 0;
  const stops = data.map((d, i) => {
    const start = cumulative;
    const end = cumulative + (d.value / total) * 360;
    cumulative = end;
    return `${COLORS[i % COLORS.length]} ${start}deg ${end}deg`;
  });

  return (
    <div className="flex items-center gap-6">
      <div
        className="h-32 w-32 flex-shrink-0 rounded-full"
        style={{
          background: `conic-gradient(${stops.join(", ")})`,
          WebkitMask: "radial-gradient(circle at center, transparent 55%, black 55%)",
          mask: "radial-gradient(circle at center, transparent 55%, black 55%)",
        }}
      />
      <div className="space-y-1.5">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-2">
            <div
              className="h-3 w-3 flex-shrink-0 rounded-sm"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-xs text-muted-foreground capitalize">
              {d.label}
            </span>
            <span className="text-xs font-medium text-foreground">
              {d.value} ({Math.round((d.value / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
