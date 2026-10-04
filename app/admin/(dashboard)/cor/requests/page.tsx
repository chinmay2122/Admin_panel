import React from "react";
import {
  corRequestsRepo,
  corMembersRepo,
  corApplicationsRepo,
  corOpportunitiesRepo,
  safeAsync,
} from "@/lib/data";
import { CorRequestsClient } from "./CorRequestsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "COR Requests | Admin Console",
  description: "Review and process creator questionnaire applications for COR representation.",
};

export default async function CorRequestsPage() {
  const [requests, members, applications, opportunities] = await Promise.all([
    safeAsync(corRequestsRepo.list(), []),
    safeAsync(corMembersRepo.list(), []),
    safeAsync(corApplicationsRepo.list(), []),
    safeAsync(corOpportunitiesRepo.list(), []),
  ]);

  const counts = {
    requests: requests.filter((r) => r.status === "pending").length,
    members: members.filter((m) => m.status === "active").length,
    applications: applications.length,
    opportunities: opportunities.filter((o) => o.status === "open").length,
  };

  return <CorRequestsClient initialRequests={requests} counts={counts} />;
}
