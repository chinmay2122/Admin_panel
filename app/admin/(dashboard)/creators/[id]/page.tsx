import React from "react";
import { notFound } from "next/navigation";
import {
  creatorsRepo,
  artworksRepo,
  corMembersRepo,
  safeAsync,
} from "@/lib/data";
import { CreatorDetailClient } from "./CreatorDetailClient";

export const dynamic = "force-dynamic";

interface CreatorDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CreatorDetailPageProps) {
  const { id } = await params;
  const creator = await safeAsync(creatorsRepo.getById(id), null);
  return {
    title: creator ? `${creator.name} — Creator Profile` : "Creator Profile",
  };
}

export default async function CreatorDetailPage({ params }: CreatorDetailPageProps) {
  const { id } = await params;

  const creator = await safeAsync(creatorsRepo.getById(id), null);
  if (!creator) {
    notFound();
  }

  // Fetch related data
  const [artworks, corMember] = await Promise.all([
    safeAsync(artworksRepo.list({ creatorId: creator.id }), []),
    safeAsync(corMembersRepo.getByCreatorId(creator.id), null),
  ]);

  return (
    <CreatorDetailClient
      creator={creator}
      artworks={artworks}
      corMember={corMember}
    />
  );
}
