export const dynamic = 'force-dynamic';

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Outfit, Quicksand } from "next/font/google";
import "./globals.css";

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
};

// Initialize cache during build time
async function initCache() {
  if (process.env.VERCEL_ENV) {
    try {
      const baseUrl = process.env.VERCEL_URL ? 
        `https://${process.env.VERCEL_URL}` : 
        process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

      console.log('[CACHE INIT] Starting cache initialization...');
      const response = await fetch(`${baseUrl}/api/init-cache`);
      if (!response.ok) {
        throw new Error(`Failed to initialize cache: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log('[CACHE INIT] Result:', data);
    } catch (error) {
      console.error('[CACHE INIT] Failed:', error);
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
      </body>
    </html>
  );
}
