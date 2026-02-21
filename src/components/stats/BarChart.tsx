"use client";

interface BarChartProps {
  data: { label: string; value: number }[];
  maxValue?: number;
  color?: string;
}

export function BarChart({ data, maxValue, color = "var(--color-primary)" }: BarChartProps) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="w-20 flex-shrink-0 text-right text-xs text-muted-foreground truncate" title={item.label}>
            {item.label}
          </span>
          <div className="flex-1 h-6 rounded-md bg-accent overflow-hidden">
            <div
              className="h-full rounded-md transition-all duration-500"
              style={{
                width: `${Math.max((item.value / max) * 100, 2)}%`,
                backgroundColor: color,
              }}
            />
          </div>
          <span className="w-8 flex-shrink-0 text-xs font-medium text-foreground">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
