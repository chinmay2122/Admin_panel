import React from "react";
import { notFound } from "next/navigation";
import {
  collectorsRepo,
  inquiriesRepo,
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

  const [collector, interests] = await Promise.all([
    safeAsync(collectorsRepo.getById(id), null),
    safeAsync(inquiriesRepo.listInterestsByCollector(id), []),
  ]);

  if (!collector) {
    notFound();
  }

  return (
    <CollectorDetailClient
      collector={collector}
      interests={interests || []}
    />
  );
}
