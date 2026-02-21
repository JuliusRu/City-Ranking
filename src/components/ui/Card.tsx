interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className = "", children }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-card p-5 ${className}`}
    >
      {children}
    </div>
  );
}
