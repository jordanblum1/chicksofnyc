export const dynamic = 'force-dynamic';

import { Analytics } from "@vercel/analytics/react";
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
      </body>
    </html>
  );
}
