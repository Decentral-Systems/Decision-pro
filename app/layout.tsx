import React from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { BRANDING } from "@/lib/constants/branding";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: BRANDING.metadata.themeColor,
};

export const metadata: Metadata = {
  title: BRANDING.company.fullName,
  icons: {
    icon: "/logos/logo_only.jpeg",
    apple: "/logos/logo_only.jpeg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
