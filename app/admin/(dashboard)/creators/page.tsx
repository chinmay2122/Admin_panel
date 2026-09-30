import React, { Suspense } from "react";
import { creatorsRepo } from "@/lib/data";
import { CreatorsClient } from "./CreatorsClient";
import { Skeleton } from "@/components/ui/Skeleton";

export default async function CreatorsPage() {
  const [creators, stats] = await Promise.all([
    creatorsRepo.list(),
    creatorsRepo.stats(),
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
      <CreatorsClient
        initialCreators={creators}
        disciplines={stats.disciplines}
      />
    </Suspense>
  );
}
