import React, { Suspense } from "react";
import {
  corRequestsRepo,
  corMembersRepo,
  corOpportunitiesRepo,
  corApplicationsRepo,
  corActivityRepo,
  safeAsync,
} from "@/lib/data";
import { CorClient } from "./CorClient";
import { Skeleton } from "@/components/ui/Skeleton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Career Operations & Representation (COR) | Admin Console",
  description: "End-to-end representation console for creator intake, talent representation, and job pipeline tracking.",
};

export default async function CoRPage() {
  const [requests, members, opportunities, applications, activity] = await Promise.all([
    safeAsync(corRequestsRepo.list(), []),
    safeAsync(corMembersRepo.list(), []),
    safeAsync(corOpportunitiesRepo.list(), []),
    safeAsync(corApplicationsRepo.list(), []),
    safeAsync(corActivityRepo.list(10), []),
  ]);

  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="border-b border-[#E8E8E3] pb-5 space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
          <Skeleton className="h-20 w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      }
    >
      <CorClient
        requests={requests}
        members={members}
        opportunities={opportunities}
        applications={applications}
        activity={activity}
      />
    </Suspense>
  );
}
