"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CorRequest,
  CorMember,
  CorOpportunity,
  CorApplication,
  CorActivity,
} from "@/lib/types";
import { CorNavTabs } from "@/components/cor/CorNavTabs";
import { CorApplicationBadge, CorMemberBadge, CorRequestBadge } from "@/components/cor/CorStatusBadge";
import { ApplyForMemberModal } from "@/components/cor/ApplyForMemberModal";
import { Button } from "@/components/ui/Button";
import {
  Award,
  UserCheck,
  Briefcase,
  FileText,
  Clock,
  ArrowRight,
  Plus,
  Sparkles,
  TrendingUp,
  Building,
  CheckCircle2,
  Calendar,
  ExternalLink,
} from "lucide-react";

interface CorClientProps {
  requests: CorRequest[];
  members: CorMember[];
  opportunities: CorOpportunity[];
  applications: CorApplication[];
  activity: CorActivity[];
}

export function CorClient({
  requests,
  members,
  opportunities,
  applications,
  activity,
}: CorClientProps) {
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const activeMembers = members.filter((m) => m.status === "active");
  const openOpportunities = opportunities.filter((o) => o.status === "open");

  // Status breakdown for applications
  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const counts = {
    requests: pendingRequests.length,
    members: members.length,
    applications: applications.length,
    opportunities: openOpportunities.length,
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="border-b border-[#E8E8E3] pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#141413]">
              Career Operations & Representation (COR)
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F5ECE8] text-[#B8532F] border border-[#EACEC3]">
              Operations Hub
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#71716D] mt-1">
            End-to-end representation console: triage creator intake, manage represented talent, match opportunities, and submit & track job applications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => setApplyModalOpen(true)}
            className="bg-[#B8532F] hover:bg-[#9E4323] text-white gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Apply for Member
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <CorNavTabs counts={counts} />

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Requests */}
        <Link
          href="/admin/cor/requests"
          className="group block p-4 rounded-xl border border-[#E8E8E3] bg-white hover:border-[#B8532F] hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#71716D] uppercase tracking-wider">
              Pending Requests
            </span>
            <div className={`p-1.5 rounded-md ${pendingRequests.length > 0 ? "bg-[#FEF6EE] text-[#B54708]" : "bg-[#F5F5F0] text-[#71716D]"}`}>
              <Award className="w-4 h-4 stroke-[1.75]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-[#141413]">
              {pendingRequests.length}
            </span>
            <span className="text-xs text-[#71716D]">
              of {requests.length} total
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F0F0EB] flex items-center justify-between text-xs text-[#71716D] group-hover:text-[#B8532F]">
            <span>Review intake queue</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>

        {/* Represented Members */}
        <Link
          href="/admin/cor/members"
          className="group block p-4 rounded-xl border border-[#E8E8E3] bg-white hover:border-[#B8532F] hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#71716D] uppercase tracking-wider">
              Active Members
            </span>
            <div className="p-1.5 rounded-md bg-[#EDF8F1] text-[#1D7A46]">
              <UserCheck className="w-4 h-4 stroke-[1.75]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-[#141413]">
              {activeMembers.length}
            </span>
            <span className="text-xs text-[#71716D]">
              represented talent
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F0F0EB] flex items-center justify-between text-xs text-[#71716D] group-hover:text-[#B8532F]">
            <span>View talent roster</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>

        {/* Applications */}
        <Link
          href="/admin/cor/applications"
          className="group block p-4 rounded-xl border border-[#E8E8E3] bg-white hover:border-[#B8532F] hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#71716D] uppercase tracking-wider">
              Applications
            </span>
            <div className="p-1.5 rounded-md bg-[#F0F4FA] text-[#295BAC]">
              <FileText className="w-4 h-4 stroke-[1.75]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-[#141413]">
              {applications.length}
            </span>
            <span className="text-xs text-[#71716D]">
              pipeline in flight
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F0F0EB] flex items-center justify-between text-xs text-[#71716D] group-hover:text-[#B8532F]">
            <span>Open tracker</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>

        {/* Open Opportunities */}
        <Link
          href="/admin/cor/opportunities"
          className="group block p-4 rounded-xl border border-[#E8E8E3] bg-white hover:border-[#B8532F] hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#71716D] uppercase tracking-wider">
              Opportunities
            </span>
            <div className="p-1.5 rounded-md bg-[#F5ECE8] text-[#B8532F]">
              <Briefcase className="w-4 h-4 stroke-[1.75]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-[#141413]">
              {openOpportunities.length}
            </span>
            <span className="text-xs text-[#71716D]">
              verified openings
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F0F0EB] flex items-center justify-between text-xs text-[#71716D] group-hover:text-[#B8532F]">
            <span>Match candidates</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>
      </div>

      {/* Applications Pipeline Breakdown Bar */}
      <div className="p-4 rounded-xl border border-[#E8E8E3] bg-white space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#B8532F]" />
            <h2 className="text-sm font-semibold text-[#141413]">
              Active Representation Pipeline Stages
            </h2>
          </div>
          <Link
            href="/admin/cor/applications"
            className="text-xs text-[#B8532F] hover:underline font-medium"
          >
            View full tracker &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {[
            { label: "Recommended", count: statusCounts["Recommended"] || 0, color: "bg-[#F5F5F0] text-[#555]" },
            { label: "Preparing", count: statusCounts["Preparing Application"] || 0, color: "bg-[#F3EFF8] text-[#693994]" },
            { label: "Applied", count: statusCounts["Applied"] || 0, color: "bg-[#EAF1FB] text-[#1E4D94]" },
            { label: "Screening", count: statusCounts["Screening"] || 0, color: "bg-[#E5F5FA] text-[#0A6783]" },
            { label: "Interview", count: statusCounts["Interview"] || 0, color: "bg-[#FEF6EE] text-[#B54708]" },
            { label: "Final Round", count: statusCounts["Final Round"] || 0, color: "bg-[#FBF0EA] text-[#B8532F]" },
            { label: "Offer", count: statusCounts["Offer"] || 0, color: "bg-[#EDF8F1] text-[#1D7A46]" },
            { label: "Rejected", count: statusCounts["Rejected"] || 0, color: "bg-[#FBEAEB] text-[#9A2227]" },
          ].map((s) => (
            <div key={s.label} className={`p-2.5 rounded-lg border border-[#E8E8E3]/60 ${s.color}`}>
              <div className="text-[11px] font-medium opacity-90 truncate">{s.label}</div>
              <div className="text-lg font-semibold mt-0.5">{s.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Pending Requests & Recent Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Intake Requests */}
        <div className="p-5 rounded-xl border border-[#E8E8E3] bg-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EB]">
            <div>
              <h2 className="text-sm font-semibold text-[#141413] flex items-center gap-2">
                Inbound Questionnaires Awaiting Triage
                {pendingRequests.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FEF6EE] text-[#B54708]">
                    {pendingRequests.length} pending
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#71716D] mt-0.5">
                Review questionnaire submissions to accept creators into COR representation.
              </p>
            </div>
            <Link
              href="/admin/cor/requests"
              className="text-xs text-[#B8532F] hover:underline font-medium shrink-0"
            >
              All requests &rarr;
            </Link>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="py-8 text-center text-[#71716D]">
              <CheckCircle2 className="w-8 h-8 mx-auto text-[#1D7A46] opacity-75 mb-2" />
              <p className="text-xs font-medium">All creator intake questionnaires triaged!</p>
              <p className="text-[11px] text-[#A0A09B] mt-0.5">New creator submissions will appear here automatically.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingRequests.slice(0, 4).map((req) => (
                <div
                  key={req.id}
                  className="p-3 rounded-lg border border-[#E8E8E3] hover:border-[#D0D0CA] transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#141413] truncate">
                        {req.creatorName}
                      </span>
                      <CorRequestBadge status={req.status} />
                    </div>
                    <div className="text-[11px] text-[#71716D] truncate mt-0.5">
                      {req.desiredRole || req.currentRole || "Creator"} • {req.location || "Remote"}
                    </div>
                    {req.skills && req.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {req.skills.slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className="px-1.5 py-0.2 rounded text-[10px] bg-[#F5F5F0] text-[#555] border border-[#E8E8E3]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/admin/cor/requests?id=${req.id}`}
                    className="shrink-0 px-2.5 py-1 rounded text-xs font-medium border border-[#E8E8E3] bg-white hover:bg-[#F5F5F0] text-[#141413] transition-colors"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applications in Pipeline */}
        <div className="p-5 rounded-xl border border-[#E8E8E3] bg-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EB]">
            <div>
              <h2 className="text-sm font-semibold text-[#141413]">
                Recent In-Flight Applications
              </h2>
              <p className="text-xs text-[#71716D] mt-0.5">
                Represented creators active across partner opportunities.
              </p>
            </div>
            <Link
              href="/admin/cor/applications"
              className="text-xs text-[#B8532F] hover:underline font-medium shrink-0"
            >
              Tracker &rarr;
            </Link>
          </div>

          <div className="space-y-2.5">
            {applications.slice(0, 4).map((app) => (
              <div
                key={app.id}
                className="p-3 rounded-lg border border-[#E8E8E3] hover:border-[#D0D0CA] transition-colors flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#141413] truncate">
                      {app.creatorName}
                    </span>
                    <CorApplicationBadge status={app.status} />
                  </div>
                  <div className="text-[11px] text-[#71716D] truncate mt-0.5 flex items-center gap-1.5">
                    <Building className="w-3 h-3 text-[#A0A09B]" />
                    <span>{app.opportunityTitle}</span>
                    <span className="text-[#A0A09B]">•</span>
                    <span>{app.company}</span>
                  </div>
                  <div className="text-[10px] text-[#A0A09B] mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Applied {app.appliedDate}</span>
                  </div>
                </div>
                <Link
                  href={`/admin/cor/applications/${app.id}`}
                  className="shrink-0 px-2.5 py-1 rounded text-xs font-medium border border-[#E8E8E3] bg-white hover:bg-[#F5F5F0] text-[#141413] transition-colors"
                >
                  Details
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Opportunities & Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Open Opportunities */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-[#E8E8E3] bg-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EB]">
            <div>
              <h2 className="text-sm font-semibold text-[#141413]">
                Open Opportunities Ready for Candidate Matching
              </h2>
              <p className="text-xs text-[#71716D] mt-0.5">
                Browse roles and trigger rule-based candidate matching.
              </p>
            </div>
            <Link
              href="/admin/cor/opportunities"
              className="text-xs text-[#B8532F] hover:underline font-medium shrink-0"
            >
              All opportunities &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {openOpportunities.slice(0, 4).map((opp) => (
              <div
                key={opp.id}
                className="p-3.5 rounded-lg border border-[#E8E8E3] hover:border-[#B8532F]/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-semibold text-[#141413] line-clamp-1">
                      {opp.title}
                    </h3>
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#EDF8F1] text-[#1D7A46]">
                      {opp.workplaceType}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#71716D] mt-1 flex items-center gap-1">
                    <Building className="w-3 h-3 text-[#A0A09B]" />
                    <span>{opp.company}</span>
                    <span className="text-[#A0A09B]">•</span>
                    <span>{opp.location}</span>
                  </div>
                  {opp.salary && (
                    <div className="text-[11px] font-medium text-[#141413] mt-1.5">
                      {opp.salary}
                    </div>
                  )}
                  {opp.requiredSkills && opp.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {opp.requiredSkills.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="px-1.5 py-0.5 rounded text-[9px] bg-[#F5F5F0] text-[#666] border border-[#E8E8E3]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#F0F0EB] flex items-center justify-between">
                  <Link
                    href={`/admin/cor/opportunities/${opp.id}`}
                    className="text-xs text-[#B8532F] hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Match Candidates &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Admin Activity Feed */}
        <div className="p-5 rounded-xl border border-[#E8E8E3] bg-white space-y-4">
          <div className="pb-3 border-b border-[#F0F0EB]">
            <h2 className="text-sm font-semibold text-[#141413]">
              Career Team Activity
            </h2>
            <p className="text-xs text-[#71716D] mt-0.5">
              Live audit trail across decisions & submissions.
            </p>
          </div>

          <div className="space-y-3">
            {activity.slice(0, 6).map((item) => (
              <div key={item.id} className="text-xs space-y-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[#141413]">{item.actorName}</span>
                  <span className="text-[#A0A09B]">{item.createdAt?.split("T")[0]}</span>
                </div>
                <p className="text-[#71716D] text-[11px] leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Apply For Member Modal */}
      <ApplyForMemberModal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        availableMembers={members.filter((m) => m.status === "active")}
        availableOpportunities={openOpportunities}
      />
    </div>
  );
}
