import React from "react";
import { notFound } from "next/navigation";
import {
  collectorsRepo,
  safeAsync,
} from "@/lib/data";
import { CollectorDetailClient } from "./CollectorDetailClient";

export const dynamic = "force-dynamic";

interface CollectorDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CollectorDetailPageProps) {
  const { id } = await params;
  const collector = await safeAsync(collectorsRepo.getById(id), null);
  return {
    title: collector ? `${collector.name} — Collector Profile` : "Collector Profile",
  };
}

export default async function CollectorDetailPage({ params }: CollectorDetailPageProps) {
  const { id } = await params;

  const collector = await safeAsync(collectorsRepo.getById(id), null);
  if (!collector) {
    notFound();
  }

  // Currently we do not have specific purchased artworks table, so we don't fetch anything here for now.
  // When purchased artworks exist, fetch them here.

  return (
    <CollectorDetailClient
      collector={collector}
    />
  );
}
