"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavLink {
  href: string;
  label: string;
}

/** App header for authenticated surfaces: wordmark home, section tabs, sign out. */
export function AppNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-[rgba(10,11,13,0.92)] backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-3">
        <Link
          href="/"
          className="font-display text-2xl tracking-wide text-foreground"
        >
          Verdo<span className="text-primary">cast</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          {links.map((l) => {
            const active =
              pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-md px-3 py-1.5 transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {l.label}
              </Link>
            );
          })}
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
