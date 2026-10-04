import React from "react";
import { notFound } from "next/navigation";
import {
  corOpportunitiesRepo,
  corApplicationsRepo,
  corMembersRepo,
  safeAsync,
} from "@/lib/data";
import { CorOpportunityDetailClient } from "./CorOpportunityDetailClient";

export const dynamic = "force-dynamic";

interface OpportunityDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: OpportunityDetailPageProps) {
  const { id } = await params;
  const opp = await safeAsync(corOpportunitiesRepo.getById(id), null);
  return {
    title: opp ? `${opp.title} at ${opp.company} — Opportunity` : "Opportunity",
  };
}

export default async function CorOpportunityDetailPage({ params }: OpportunityDetailPageProps) {
  const { id } = await params;

  const opportunity = await safeAsync(corOpportunitiesRepo.getById(id), null);
  if (!opportunity) {
    notFound();
  }

  const [allApplications, members] = await Promise.all([
    safeAsync(corApplicationsRepo.list(), []),
    safeAsync(corMembersRepo.list({ status: "active" }), []),
  ]);

  const oppApplications = allApplications.filter((a) => a.opportunityId === id);

  return (
    <CorOpportunityDetailClient
      opportunity={opportunity}
      applications={oppApplications}
      availableMembers={members}
    />
  );
}
