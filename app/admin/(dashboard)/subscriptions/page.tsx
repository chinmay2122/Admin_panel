import React, { Suspense } from "react";
import type { Metadata } from "next";
import { getSubscriptionStats, getSubscribers } from "@/lib/data/subscriptions";
import { SubscriptionsClient } from "./SubscriptionsClient";
import { Skeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = {
  title: "Subscriptions | ERAS Studio Admin",
  description: "Platform subscription tiers, membership plan controls, and subscriber management.",
};

export default async function SubscriptionsPage() {
  const [subscribers, stats] = await Promise.all([
    getSubscribers(),
    getSubscriptionStats(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="space-y-6 pb-16">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-9 w-72 rounded-full" />
          </div>
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      }
    >
      <SubscriptionsClient initialSubscribers={subscribers} stats={stats} />
    </Suspense>
  );
}

