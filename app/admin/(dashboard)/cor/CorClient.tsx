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
import { ApplyForMemberModal } from "@/components/cor/ApplyForMemberModal";
import { Button } from "@/components/ui/Button";
import {
  Users,
  UserPlus,
  Briefcase,
  FileText,
  AlertCircle,
  Plus,
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
}: CorClientProps) {
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const activeMembers = members.filter((m) => m.status === "active");
  const openOpportunities = opportunities.filter((o) => o.status === "open");
  
  // Exclude rejected/offer to find active applications
  const activeApplications = applications.filter((app) => 
    !["Rejected", "Offer"].includes(app.status)
  );

  const needsAttentionCount = pendingRequests.length + (activeApplications.length > 0 ? 1 : 0); // Simplified attention calculation

  const counts = {
    requests: pendingRequests.length,
    members: members.length,
    applications: applications.length,
    opportunities: openOpportunities.length,
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E8E8E3]">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#141413]">
            COR
          </h1>
          <p className="text-sm text-[#71716D] mt-1">
            Manage creator career opportunities, applications and COR members from one place.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="dark"
            onClick={() => setApplyModalOpen(true)}
            className="shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Apply for Creator
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <CorNavTabs counts={counts} />



      {/* Needs Your Attention Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[#141413]">Needs Your Attention</h2>
        <div className="grid grid-cols-1 gap-3">
          {pendingRequests.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-white border border-[#E8E8E3] rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-[#B54708]" />
                <span className="text-sm font-medium text-[#141413]">
                  {pendingRequests.length} {pendingRequests.length === 1 ? "creator is" : "creators are"} waiting for COR approval
                </span>
              </div>
              <Link href="/admin/cor/requests" className="text-sm font-medium text-[#141413] hover:underline px-4 py-2 border border-[#E8E8E3] rounded-md bg-white hover:bg-gray-50 transition-colors">
                Review Requests
              </Link>
            </div>
          )}

          {activeApplications.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-white border border-[#E8E8E3] rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-[#295BAC]" />
                <span className="text-sm font-medium text-[#141413]">
                  {activeApplications.length} {activeApplications.length === 1 ? "application is" : "applications are"} currently active
                </span>
              </div>
              <Link href="/admin/cor/applications" className="text-sm font-medium text-[#141413] hover:underline px-4 py-2 border border-[#E8E8E3] rounded-md bg-white hover:bg-gray-50 transition-colors">
                View Applications
              </Link>
            </div>
          )}

          {openOpportunities.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-white border border-[#E8E8E3] rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-[#1D7A46]" />
                <span className="text-sm font-medium text-[#141413]">
                  {openOpportunities.length} {openOpportunities.length === 1 ? "opportunity is" : "opportunities are"} available to match
                </span>
              </div>
              <Link href="/admin/cor/opportunities" className="text-sm font-medium text-[#141413] hover:underline px-4 py-2 border border-[#E8E8E3] rounded-md bg-white hover:bg-gray-50 transition-colors">
                View Opportunities
              </Link>
            </div>
          )}

          {pendingRequests.length === 0 && activeApplications.length === 0 && openOpportunities.length === 0 && (
            <div className="p-6 text-center text-sm text-[#71716D] border border-[#E8E8E3] border-dashed rounded-lg bg-white">
              No items need your immediate attention right now.
            </div>
          )}
        </div>
      </div>

      {/* Apply For Member Modal */}
      <ApplyForMemberModal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        availableMembers={activeMembers}
        availableOpportunities={openOpportunities}
      />
    </div>
  );
}

