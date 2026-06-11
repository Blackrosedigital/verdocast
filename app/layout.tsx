import type { Metadata } from "next";
import { Archivo, Bebas_Neue, JetBrains_Mono } from "next/font/google";
import { CookieConsent } from "@/components/analytics/cookie-consent";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

// Brand typography (CLAUDE.md): Bebas Neue display, Archivo body, JetBrains Mono numbers.
const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Archivo({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Verdocast - Run your office World Cup 2026 predictor",
  description:
    "Forecast every match. Settle every debate. Verdocast lets companies run World Cup 2026 prediction leagues for their employees.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${display.variable} ${body.variable} ${mono.variable}`}
      >
        {children}
        <Toaster />
        <CookieConsent />
      </body>
    </html>
  );
}
