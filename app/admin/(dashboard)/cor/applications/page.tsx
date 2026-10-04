import React from "react";
import {
  corApplicationsRepo,
  corMembersRepo,
  corOpportunitiesRepo,
  corRequestsRepo,
  safeAsync,
} from "@/lib/data";
import { CorApplicationsClient } from "./CorApplicationsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Application Tracker | COR Admin Console",
  description: "Keep every candidate and opportunity moving together across the representation pipeline.",
};

export default async function CorApplicationsPage() {
  const [applications, members, opportunities, requests] = await Promise.all([
    safeAsync(corApplicationsRepo.list(), []),
    safeAsync(corMembersRepo.list({ status: "active" }), []),
    safeAsync(corOpportunitiesRepo.list({ status: "open" }), []),
    safeAsync(corRequestsRepo.list(), []),
  ]);

  const counts = {
    requests: requests.filter((r) => r.status === "pending").length,
    members: members.length,
    applications: applications.length,
    opportunities: opportunities.length,
  };

  return (
    <CorApplicationsClient
      initialApplications={applications}
      availableMembers={members}
      availableOpportunities={opportunities}
      counts={counts}
    />
  );
}
