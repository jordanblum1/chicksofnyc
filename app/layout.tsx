export const dynamic = 'force-dynamic';

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Outfit, Quicksand } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import logger from "./utils/logger";

const quicksand = Quicksand({ 
  subsets: ["latin"],
  variable: '--font-quicksand',
});

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: "Chicks of NYC",
  description: "Finding the best chicken wings in New York",
  openGraph: {
    title: "Chicks of NYC",
    description: "Finding the best chicken wings in New York",
    type: "website",
    url: "https://chicksofnyc.com",
    siteName: "Chicks of NYC",
    images: [
      {
        url: "/chicks-of-nyc-logo.gif",
        width: 400,
        height: 210,
        alt: "Chicks of NYC - Animated Logo",
        type: "image/gif",
      },
      // Fallback static image (keep this larger for social media)
      {
        url: "/chicks-of-nyc-logo.png",
        width: 1200,
        height: 630,
        alt: "Chicks of NYC Logo",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chicks of NYC",
    description: "Finding the best chicken wings in New York",
  },
};

// Initialize cache during build time
async function initCache() {
  if (process.env.VERCEL_ENV) {
    try {
      const baseUrl = process.env.VERCEL_URL ? 
        `https://${process.env.VERCEL_URL}` : 
        process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

      logger.info('CACHE_INIT', 'Starting cache initialization...');
      const response = await fetch(`${baseUrl}/api/init-cache`);
      if (!response.ok) {
        throw new Error(`Failed to initialize cache: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      logger.info('CACHE_INIT', 'Result:', data);
    } catch (error) {
      logger.error('CACHE_INIT', 'Failed:', error);
    }
  }
}

// Call initCache during build
initCache();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${quicksand.variable} ${outfit.variable} font-sans`}>
        {children}
        <Analytics />
        <SpeedInsights />
        <Script
          id="google-maps-script"
          strategy="beforeInteractive"
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,geocoding`}
        />
      </body>
    </html>
  );
}
