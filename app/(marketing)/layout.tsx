import Link from "next/link";
import { GroupStrip } from "@/components/marketing/group-strip";
import { Button } from "@/components/ui/button";

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-[rgba(10,11,13,0.92)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="leading-none">
          <span className="font-display text-3xl tracking-wide text-foreground">
            Verdo<span className="text-primary">cast</span>
          </span>
          <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Office World Cup 2026
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/#how-it-works"
            className="hidden px-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            How it works
          </Link>
          <Link
            href="/pricing"
            className="px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
          <Button asChild size="sm">
            <Link href="/pricing">Get started</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center">
        <div>
          <span className="font-display text-xl tracking-wide text-foreground">
            Verdo<span className="text-primary">cast</span>
          </span>
          <p className="mt-1 text-xs">
            Forecast every match. Settle every debate.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link href="/#faq" className="hover:text-foreground">
            FAQ
          </Link>
          <a href="mailto:hello@verdocast.com" className="hover:text-foreground">
            Contact
          </a>
        </div>
        <p className="text-xs text-text-faint">
          © 2026 Verdocast. Not affiliated with FIFA.
        </p>
      </div>
    </footer>
  );
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <GroupStrip />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
