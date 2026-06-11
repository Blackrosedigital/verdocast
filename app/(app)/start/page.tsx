import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { CreateLeagueForm } from "@/components/start/create-league-form";
import { getUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Start free - Verdocast",
  description:
    "Create a free World Cup 2026 prediction league for your office or group. Free for the group stage.",
};

export default async function StartPage() {
  const user = await getUser();
  const defaultOrgName = user?.email
    ? (() => {
        const domain = user.email.split("@")[1]?.split(".")[0] ?? "";
        const generic = ["gmail", "outlook", "hotmail", "yahoo", "icloud", "proton"];
        if (!domain || generic.includes(domain.toLowerCase())) return "My league";
        return domain.charAt(0).toUpperCase() + domain.slice(1);
      })()
    : "My league";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16">
      <Link href="/" className="leading-none">
        <span className="font-display text-4xl tracking-wide text-foreground">
          Verdo<span className="text-primary">cast</span>
        </span>
      </Link>

      {user ? (
        <CreateLeagueForm defaultOrgName={defaultOrgName} />
      ) : (
        <div className="w-full max-w-sm text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">
            Free for the group stage
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-wide text-foreground">
            Start your league
          </h1>
          <p className="mt-2 mb-6 text-sm text-muted-foreground">
            Enter your email and we&rsquo;ll send a magic link. No password, no
            payment.
          </p>
          <LoginForm next="/start" allowSignup cta="Send my magic link" />
        </div>
      )}
    </main>
  );
}
