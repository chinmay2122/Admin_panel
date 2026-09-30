import React, { Suspense } from "react";
import { applicationsRepo, jobsRepo } from "@/lib/data";
import { ApplicationsClient } from "./ApplicationsClient";
import { Skeleton } from "@/components/ui/Skeleton";

export default async function ApplicationsPage() {
  const [applications, jobs] = await Promise.all([
    applicationsRepo.list(),
    jobsRepo.list(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="border-b border-[#E8E8E3] pb-5 space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>
      }
    >
      <ApplicationsClient
        initialApplications={applications}
        availableJobs={jobs}
      />
    </Suspense>
  );
}
