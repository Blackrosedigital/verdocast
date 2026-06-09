import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in — Verdocast",
  description: "Sign in to your Verdocast admin or league.",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16">
      <Link href="/" className="leading-none">
        <span className="font-display text-4xl tracking-wide text-foreground">
          Verdo<span className="text-primary">cast</span>
        </span>
      </Link>
      <LoginForm />
    </main>
  );
}
