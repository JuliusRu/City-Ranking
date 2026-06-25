import type { ReactNode } from "react";

// The single horizontal rhythm for the whole app: one max-width + one gutter,
// applied to the header AND every page so their left/right edges line up
// top-to-bottom. This alignment is what makes a layout read as "designed"
// rather than each page floating at its own width. Pass extra classes (e.g.
// vertical padding, flex) via className.
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
