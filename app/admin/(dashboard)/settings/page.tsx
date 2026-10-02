import React, { Suspense } from "react";
import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/auth";
import { settingsRepo } from "@/lib/data";
import { SettingsClient } from "./SettingsClient";
import { Skeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = {
  title: "Studio Settings | ErasStudio® Admin",
  description: "Configure rules, platform allowances, limits, and studio controls.",
};

export default async function SettingsPage() {
  // Strictly enforce admin session server-side
  await requireAdminSession("settings:manage");

  // Load real settings from central repository/database
  const settings = await settingsRepo.get();

  return (
    <Suspense
      fallback={
        <div className="space-y-6 pb-20 max-w-4xl">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="bg-white rounded-2xl border border-[#E8E8E3] p-8 space-y-6">
            <Skeleton className="h-6 w-48" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>
      }
    >
      <SettingsClient initialSettings={settings} />
    </Suspense>
  );
}
