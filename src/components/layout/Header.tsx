"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useUser } from "@/hooks/useUser";

const navItems = [
  { href: "/", label: "Globe" },
  { href: "/visits", label: "Visits" },
  { href: "/cities", label: "Cities" },
  { href: "/stats", label: "Stats" },
  { href: "/visits/new", label: "Add Visit" },
];

export function Header() {
  const pathname = usePathname();
  const { user } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const initial = user?.name?.charAt(0).toUpperCase() ?? "U";

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-lg font-bold text-primary sm:text-xl">
          City Ranking
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <nav aria-label="Main navigation" className="flex gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Avatar dropdown */}
          <div className="relative ml-2" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground transition-opacity hover:opacity-80"
              aria-label="User menu"
              aria-expanded={dropdownOpen}
            >
              {initial}
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-border bg-card py-1 shadow-lg">
                <Link
                  href="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-foreground hover:bg-accent"
                >
                  Profile &amp; Settings
                </Link>
                <div className="my-1 border-t border-border" />
                <button
                  disabled
                  className="w-full px-4 py-2 text-left text-sm text-muted-foreground opacity-50"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
