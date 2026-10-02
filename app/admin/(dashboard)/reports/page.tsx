import React, { Suspense } from "react";
import type { Metadata } from "next";
import { reportsRepo } from "@/lib/data";
import { ReportsClient } from "./ReportsClient";
import { Skeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = {
  title: "Reports & Moderation | ErasStudio® Admin",
  description: "Community moderation, content reports, copyright enforcement and member conduct.",
};

export default async function ReportsPage() {
  const reports = await reportsRepo.list();

  return (
    <Suspense
      fallback={
        <div className="space-y-6 pb-16">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-9 w-72 rounded-full" />
            <Skeleton className="h-9 w-64 rounded-full" />
          </div>
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      }
    >
      <ReportsClient initialReports={reports} />
    </Suspense>
  );
}

