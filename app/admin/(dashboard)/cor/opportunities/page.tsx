import React from "react";
import {
  corOpportunitiesRepo,
  corMembersRepo,
  corRequestsRepo,
  corApplicationsRepo,
  safeAsync,
} from "@/lib/data";
import { CorOpportunitiesClient } from "./CorOpportunitiesClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "COR Opportunities | Admin Console",
  description: "Curate commissions, residencies, and roles. Match verified COR creators.",
};

export default async function CorOpportunitiesPage() {
  const [opportunities, members, requests, applications] = await Promise.all([
    safeAsync(corOpportunitiesRepo.list(), []),
    safeAsync(corMembersRepo.list({ status: "active" }), []),
    safeAsync(corRequestsRepo.list(), []),
    safeAsync(corApplicationsRepo.list(), []),
  ]);

  const counts = {
    requests: requests.filter((r) => r.status === "pending").length,
    members: members.length,
    applications: applications.length,
    opportunities: opportunities.filter((o) => o.status === "open").length,
  };

  return (
    <CorOpportunitiesClient
      initialOpportunities={opportunities}
      availableMembers={members}
      counts={counts}
    />
  );
}
