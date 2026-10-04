import React from "react";
import { notFound } from "next/navigation";
import {
  corApplicationsRepo,
  corEventsRepo,
  corNotesRepo,
  corMembersRepo,
  corOpportunitiesRepo,
  safeAsync,
} from "@/lib/data";
import { CorApplicationDetailClient } from "./CorApplicationDetailClient";

export const dynamic = "force-dynamic";

interface ApplicationDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ApplicationDetailPageProps) {
  const { id } = await params;
  const application = await safeAsync(corApplicationsRepo.getById(id), null);
  return {
    title: application
      ? `${application.creatorName} — ${application.opportunityTitle} (${application.company})`
      : "Application Details — COR",
  };
}

export default async function CorApplicationDetailPage({ params }: ApplicationDetailPageProps) {
  const { id } = await params;

  const application = await safeAsync(corApplicationsRepo.getById(id), null);
  if (!application) {
    notFound();
  }

  const [events, adminNotes, member, opportunity] = await Promise.all([
    safeAsync(corEventsRepo.listForApplication(id), []),
    safeAsync(corNotesRepo.listForApplication(id), []),
    application.corMemberId ? safeAsync(corMembersRepo.getById(application.corMemberId), null) : null,
    application.opportunityId ? safeAsync(corOpportunitiesRepo.getById(application.opportunityId), null) : null,
  ]);

  return (
    <CorApplicationDetailClient
      application={application}
      events={events}
      adminNotes={adminNotes}
      member={member}
      opportunity={opportunity}
    />
  );
}
