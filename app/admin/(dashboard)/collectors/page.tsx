import React, { Suspense } from "react";
import { collectorsRepo } from "@/lib/data";
import { CollectorsClient } from "./CollectorsClient";
import { Skeleton } from "@/components/ui/Skeleton";

export default async function CollectorsPage() {
  const [collectors, stats] = await Promise.all([
    collectorsRepo.list(),
    collectorsRepo.stats(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="border-b border-[#E8E8E3] pb-5 space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      }
    >
      <CollectorsClient
        initialCollectors={collectors}
        preferences={stats.preferences}
      />
    </Suspense>
  );
}
