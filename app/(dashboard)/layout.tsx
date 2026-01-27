import React from "react";
import { requireAuth } from "@/lib/auth/middleware";
import { DashboardLayout as Layout } from "@/components/layout/DashboardLayout";

// Force dynamic rendering for all dashboard pages (they use client-side features)
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth(); // Ensure user is authenticated

  return <Layout>{children}</Layout>;
}

