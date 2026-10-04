import React from "react";
import { notFound } from "next/navigation";
import {
  corApplicationsRepo,
  corEventsRepo,
  corNotesRepo,
  corMembersRepo,
  corOpportunitiesRepo,
} from "@/lib/data";
import { CorApplicationDetailClient } from "../../cor/applications/[id]/CorApplicationDetailClient";

interface ApplicationDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ApplicationDetailPageProps) {
  const { id } = await params;
  const application = await corApplicationsRepo.getById(id);
  return {
    title: application
      ? `${application.creatorName} — ${application.opportunityTitle} (${application.company})`
      : "Application Details — COR",
  };
}

export default async function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
  const { id } = await params;

  const application = await corApplicationsRepo.getById(id);
  if (!application) {
    notFound();
  }

  const [events, adminNotes, member, opportunity] = await Promise.all([
    corEventsRepo.listForApplication(id),
    corNotesRepo.listForApplication(id),
    application.corMemberId ? corMembersRepo.getById(application.corMemberId) : null,
    application.opportunityId ? corOpportunitiesRepo.getById(application.opportunityId) : null,
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
