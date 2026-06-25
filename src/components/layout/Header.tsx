"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "@/components/layout/Logo";
import { Container } from "@/components/layout/Container";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";

const navItems = [
  { href: "/", label: "Globe" },
  { href: "/feed", label: "Feed" },
  { href: "/visits", label: "Visits" },
  { href: "/cities", label: "Cities" },
  { href: "/places", label: "Places" },
  { href: "/stats", label: "Stats" },
  { href: "/visits/new", label: "Add Visit" },
];

export function Header() {
  const pathname = usePathname();
  const { user, isLoading } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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

  // Close the mobile menu whenever the route changes, so tapping a link doesn't
  // leave the panel hanging open over the new page.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    await createClient().auth.signOut();
    window.location.assign("/login");
  }

  return (
    <header className="relative z-50 h-16 border-b border-border bg-card/80 backdrop-blur-sm">
      <Container className="flex h-full items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-primary sm:text-xl"
        >
          <Logo className="h-7 w-7" />
          City Ranking
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {isLoading ? null : !user ? (
            <Link
              href="/login"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Sign In
            </Link>
          ) : (
            <>
              {/* Desktop nav — hidden below md, where the hamburger takes over */}
              <nav
                aria-label="Main navigation"
                className="hidden gap-1 md:flex"
              >
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
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors lg:px-4 ${
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

              {/* Beta feedback — pill on desktop, in the menu on mobile */}
              <FeedbackButton />

              {/* Search — always visible */}
              <Link
                href="/search"
                aria-label="Search"
                aria-current={pathname.startsWith("/search") ? "page" : undefined}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                  pathname.startsWith("/search")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </Link>

              {/* Hamburger — only below md */}
              <button
                onClick={() => setMobileOpen((prev) => !prev)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent md:hidden"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav"
              >
                {mobileOpen ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                )}
              </button>

              {/* Avatar dropdown */}
              <div className="relative ml-2" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center rounded-full text-sm transition-opacity hover:opacity-80"
                  aria-label="User menu"
                  aria-expanded={dropdownOpen}
                >
                  <Avatar src={user.avatarUrl} name={user.name} size={36} />
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
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </Container>

      {/* Mobile nav panel — slides down below the bar, only below md */}
      {user && mobileOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile navigation"
          className="absolute inset-x-0 top-16 z-50 border-b border-border bg-card shadow-lg md:hidden"
        >
          <div className="flex flex-col px-2 py-2">
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
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="my-1 border-t border-border" />
            <FeedbackButton variant="menu" />
          </div>
        </nav>
      )}
    </header>
  );
}
