import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function OverviewLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Page Header Skeleton */}
      <div className="border-b border-[#E8E8E3] pb-5 space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* 8 Stat Cards Skeleton Grid */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-[#E8E8E3] rounded-lg p-4 space-y-2"
            >
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-8 w-12" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Grid: Recent Signups & Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Signups Skeleton (span 2) */}
        <div className="lg:col-span-2 space-y-3">
          <Skeleton className="h-5 w-36" />
          <div className="bg-white border border-[#E8E8E3] rounded-lg p-5 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[#F0F0EB] last:border-none">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-16 rounded" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Needs Attention Skeleton (span 1) */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-[#E8E8E3] rounded-lg p-4 flex items-center justify-between"
              >
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <Skeleton className="h-7 w-12 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
