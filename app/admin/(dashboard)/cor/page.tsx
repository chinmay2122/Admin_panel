import React, { Suspense } from "react";
import { corRepo, usersRepo } from "@/lib/data";
import { CorClient } from "./CorClient";
import { Skeleton } from "@/components/ui/Skeleton";

export default async function CoRPage() {
  const [members, users] = await Promise.all([
    corRepo.list(),
    usersRepo.list(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="border-b border-[#E8E8E3] pb-5 space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="grid grid-cols-3 gap-3.5">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>
      }
    >
      <CorClient initialMembers={members} availableUsers={users} />
    </Suspense>
  );
}
