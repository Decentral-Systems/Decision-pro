import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { BRANDING } from "@/lib/constants/branding";

export const metadata: Metadata = {
  title: BRANDING.company.fullName,
  description: BRANDING.metadata.description,
  keywords: [
    "Decision PRO",
    "AIS Platform",
    "Credit Scoring",
    "Risk Management",
    "Financial Intelligence",
    "Ethiopian Financial Services",
  ],
  authors: [{ name: "Akafay Intelligent Services" }],
  creator: "Akafay Intelligent Services",
  publisher: "Akafay Intelligent Services",
  icons: {
    icon: "/logos/logo_only.jpeg",
    apple: "/logos/logo_only.jpeg",
  },
  themeColor: BRANDING.metadata.themeColor,
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  openGraph: {
    type: "website",
    title: BRANDING.company.fullName,
    description: BRANDING.metadata.description,
    siteName: BRANDING.company.name,
    images: [
      {
        url: "/logos/logo_blue.jpeg",
        width: 1200,
        height: 630,
        alt: BRANDING.company.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: BRANDING.company.fullName,
    description: BRANDING.metadata.description,
    images: ["/logos/logo_blue.jpeg"],
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

