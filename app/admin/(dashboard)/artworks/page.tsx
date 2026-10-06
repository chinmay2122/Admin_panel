import React, { Suspense } from "react";
import { artworksRepo, creatorsRepo } from "@/lib/data";
import { ArtworksClient } from "./ArtworksClient";
import { Skeleton } from "@/components/ui/Skeleton";

export default async function ArtworksPage() {
  const [artworks, stats, creators] = await Promise.all([
    artworksRepo.list(),
    artworksRepo.stats(),
    creatorsRepo.list(),
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-4/3 w-full rounded-lg" />
            ))}
          </div>
        </div>
      }
    >
      <ArtworksClient
        initialArtworks={artworks}
        distinctCreators={stats.distinctCreators}
        distinctMedia={stats.distinctMedia}
        creators={creators}
      />
    </Suspense>
  );
}
