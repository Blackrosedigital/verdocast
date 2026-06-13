import type { Metadata } from "next";
import { Archivo, Bebas_Neue, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { CookieConsent } from "@/components/analytics/cookie-consent";
import { FlagPolyfill } from "@/components/flag-polyfill";
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Verdocast - World Cup 2026 Predictor for Offices and Fans",
    template: "%s",
  },
  description:
    "Forecast every match. Settle every debate. Free World Cup 2026 prediction league for your office, mates, or group - set up in 2 minutes.",
  keywords: [
    "World Cup 2026 predictions",
    "World Cup 2026 predictor",
    "World Cup 2026 prediction league",
    "World Cup 2026 sweepstake",
    "office World Cup game",
    "predict World Cup scores",
    "free World Cup prediction game",
    "World Cup 2026 fixtures",
    "World Cup 2026 groups",
  ],
  openGraph: {
    title: "Verdocast - World Cup 2026 Predictor",
    description: "Free office predictor league. Set up in 2 minutes.",
    url: "https://verdocast.com",
    siteName: "Verdocast",
    images: [
      {
        url: "https://verdocast.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Verdocast - World Cup 2026 Predictor",
      },
    ],
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Verdocast - World Cup 2026 Predictor",
    description: "Free office predictor league. Set up in 2 minutes.",
    images: ["https://verdocast.com/og-image.png"],
  },
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
        <FlagPolyfill />
        <Analytics />
      </body>
    </html>
  );
}
