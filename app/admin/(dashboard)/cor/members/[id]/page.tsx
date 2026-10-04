import React from "react";
import { notFound } from "next/navigation";
import {
  corMembersRepo,
  corRequestsRepo,
  corApplicationsRepo,
  corOpportunitiesRepo,
  corNotesRepo,
  corActivityRepo,
  safeAsync,
} from "@/lib/data";
import { CorMemberDetailClient } from "./CorMemberDetailClient";

export const dynamic = "force-dynamic";

interface MemberDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: MemberDetailPageProps) {
  const { id } = await params;
  const member =
    (await safeAsync(corMembersRepo.getById(id), null)) ||
    (await safeAsync(corMembersRepo.getByCreatorId(id), null));
  return {
    title: member ? `${member.name} — COR Member Profile` : "COR Member",
  };
}

export default async function CorMemberDetailPage({ params }: MemberDetailPageProps) {
  const { id } = await params;

  const member =
    (await safeAsync(corMembersRepo.getById(id), null)) ||
    (await safeAsync(corMembersRepo.getByCreatorId(id), null));
  if (!member) {
    notFound();
  }

  const [request, applications, opportunities, adminNotes, activity] = await Promise.all([
    member.creatorId ? safeAsync(corRequestsRepo.getByCreatorId(member.creatorId), null) : null,
    safeAsync(corApplicationsRepo.getByMemberId(member.id), []),
    safeAsync(corOpportunitiesRepo.list({ status: "open" }), []),
    safeAsync(corNotesRepo.listForMember(member.id), []),
    safeAsync(corActivityRepo.list(20, member.creatorId, member.id), []),
  ]);

  return (
    <CorMemberDetailClient
      member={member}
      request={request}
      applications={applications}
      availableOpportunities={opportunities}
      adminNotes={adminNotes}
      activity={activity}
    />
  );
}
