import React from "react";
import {
  corMembersRepo,
  corOpportunitiesRepo,
  corRequestsRepo,
  corApplicationsRepo,
  safeAsync,
} from "@/lib/data";
import { CorMembersClient } from "./CorMembersClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "COR Members | Admin Console",
  description: "Roster of creators with active COR representation, applications, and placement tracking.",
};

export default async function CorMembersPage() {
  const [members, opportunities, requests, applications] = await Promise.all([
    safeAsync(corMembersRepo.list(), []),
    safeAsync(corOpportunitiesRepo.list({ status: "open" }), []),
    safeAsync(corRequestsRepo.list(), []),
    safeAsync(corApplicationsRepo.list(), []),
  ]);

  const counts = {
    requests: requests.filter((r) => r.status === "pending").length,
    members: members.filter((m) => m.status === "active").length,
    applications: applications.length,
    opportunities: opportunities.length,
  };

  return (
    <CorMembersClient
      initialMembers={members}
      availableOpportunities={opportunities}
      counts={counts}
    />
  );
}
