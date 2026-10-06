"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  CorMember,
  CorMemberStatus,
  CorOpportunity,
} from "@/lib/types";
import { CorMemberBadge, CorApplicationBadge } from "@/components/cor/CorStatusBadge";
import { CorNavTabs } from "@/components/cor/CorNavTabs";
import { ApplyForMemberModal } from "@/components/cor/ApplyForMemberModal";
import { ExportDropdown } from "@/components/admin/ExportDropdown";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui";
import { updateCorMemberStatusAction } from "@/app/admin/actions";
import {
  Search,
  UserCheck,
  Send,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface CorMembersClientProps {
  initialMembers: CorMember[];
  availableOpportunities: CorOpportunity[];
  counts: {
    requests: number;
    members: number;
    applications: number;
    opportunities: number;
  };
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function CorMembersClient({
  initialMembers,
  availableOpportunities,
  counts,
}: CorMembersClientProps) {
  const toast = useToast();
  const [members, setMembers] = useState<CorMember[]>(initialMembers);
  const [statusFilter, setStatusFilter] = useState<CorMemberStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Apply modal
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedMemberForApply, setSelectedMemberForApply] = useState<CorMember | null>(null);

  // Status toggle loading
  const [statusTogglingId, setStatusTogglingId] = useState<string | null>(null);

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inName = m.name.toLowerCase().includes(q);
        const inRole = (m.desiredRole || "").toLowerCase().includes(q);
        const inSkills = (m.skills || []).some((s) => s.toLowerCase().includes(q));
        const inLocation = (m.location || "").toLowerCase().includes(q);
        if (!inName && !inRole && !inSkills && !inLocation) return false;
      }
      return true;
    });
  }, [members, statusFilter, searchQuery]);

  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  // Handle Pause / Resume toggle
  const handleToggleStatus = async (member: CorMember) => {
    const nextStatus: CorMemberStatus = member.status === "active" ? "paused" : "active";
    setStatusTogglingId(member.id);

    try {
      const res = await updateCorMemberStatusAction(member.id, nextStatus);
      if (!res.success || !res.member) {
        toast.error("Status Update Failed", res.error || "Could not update status.");
      } else {
        toast.success(
          nextStatus === "paused" ? "Membership Paused" : "Membership Reactivated",
          `${member.name} is now ${nextStatus}.`
        );
        setMembers((prev) =>
          prev.map((m) => (m.id === res.member!.id ? res.member! : m))
        );
      }
    } catch {
      toast.error("Network Error", "Could not toggle membership status.");
    } finally {
      setStatusTogglingId(null);
    }
  };

  const handleOpenApplyModal = (member: CorMember) => {
    setSelectedMemberForApply(member);
    setApplyModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#E8E8E3] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#141413]">
            COR Members
          </h1>
          <p className="text-xs sm:text-sm text-[#6E6E69] mt-1 max-w-2xl">
            Active roster of creators with COR representation. Review career profiles, track applications, and apply for opportunities.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <ExportDropdown exportType="cor-members" filters={{ query: searchQuery, status: statusFilter === "all" ? undefined : statusFilter }} />
          <Button
            variant="dark"
            onClick={() => {
              setSelectedMemberForApply(members[0] || null);
              setApplyModalOpen(true);
            }}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Apply for Creator</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <CorNavTabs counts={counts} />

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Pill Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(
            [
              { label: "All Members", value: "all", count: members.length },
              { label: "Active", value: "active", count: members.filter((m) => m.status === "active").length },
              { label: "Paused", value: "paused", count: members.filter((m) => m.status === "paused").length },
              { label: "Expired", value: "expired", count: members.filter((m) => m.status === "expired" || m.status === "removed").length },
            ] as const
          ).map((tab) => {
            const active = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setCurrentPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? "bg-[#141413] text-white shadow-xs"
                    : "bg-white text-[#6E6E69] border border-[#E8E8E3] hover:text-[#141413] hover:bg-[#F7F7F4]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                    active ? "bg-white/20 text-white" : "bg-[#F3F3EE] text-[#6E6E69]"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#8A8A85] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search member, role, skills..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs md:text-sm bg-white border border-[#E8E8E3] rounded-lg pl-9 pr-3 py-1.5 text-[#141413] placeholder-[#8A8A85] focus:outline-none focus:ring-1 focus:ring-[#B8532F]"
          />
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white border border-[#E8E8E3] rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#FAFAF8] border-b border-[#E8E8E3]">
              <TableHead className="py-3 px-4 text-xs font-semibold text-[#6E6E69] uppercase tracking-wider">
                Creator
              </TableHead>
              <TableHead className="py-3 px-4 text-xs font-semibold text-[#6E6E69] uppercase tracking-wider">
                Role & Skills
              </TableHead>
              <TableHead className="py-3 px-4 text-xs font-semibold text-[#6E6E69] uppercase tracking-wider">
                Location
              </TableHead>
              <TableHead className="py-3 px-4 text-xs font-semibold text-[#6E6E69] uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="py-3 px-4 text-xs font-semibold text-[#6E6E69] uppercase tracking-wider">
                Applications
              </TableHead>
              <TableHead className="py-3 px-4 text-xs font-semibold text-[#6E6E69] uppercase tracking-wider text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12">
                  <EmptyState
                    title="No COR members found"
                    description="No active or paused members match your search filter."
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedMembers.map((member) => (
                <TableRow
                  key={member.id}
                  className="hover:bg-[#FBFBFA] transition-colors border-b border-[#E8E8E3] last:border-none"
                >
                  <TableCell className="py-3 px-4">
                    <Link
                      href={`/admin/cor/members/${member.id}`}
                      className="group flex items-center gap-3"
                    >
                      {member.creatorAvatar ? (
                        <img
                          src={member.creatorAvatar}
                          alt={member.name}
                          className="w-9 h-9 rounded-full object-cover border border-[#E8E8E3]"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#EAEAE5] flex items-center justify-center text-xs font-semibold text-[#141413]">
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-sm text-[#141413] group-hover:text-[#B8532F] transition-colors">
                          {member.name}
                        </div>
                        <div className="text-xs text-[#6E6E69]">
                          Member since {formatDate(member.joinedAt)}
                        </div>
                      </div>
                    </Link>
                  </TableCell>

                  <TableCell className="py-3 px-4">
                    <div className="text-xs font-medium text-[#141413]">
                      {member.desiredRole || "Spatial Media & Design"}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(member.skills || []).slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="px-1.5 py-0.5 rounded bg-[#F3F3EE] text-[10px] font-medium text-[#5E5E59]"
                        >
                          {s}
                        </span>
                      ))}
                      {(member.skills || []).length > 3 && (
                        <span className="text-[10px] text-[#8A8A85]">
                          +{(member.skills || []).length - 3}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="py-3 px-4">
                    <div className="text-xs text-[#141413] font-medium">
                      {member.location || "Remote"}
                    </div>
                    <div className="text-[11px] text-[#6E6E69]">
                      Prefers: {member.preferredWorkType || "Hybrid"}
                    </div>
                  </TableCell>

                  <TableCell className="py-3 px-4">
                    <CorMemberBadge status={member.status} />
                  </TableCell>

                  <TableCell className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#141413]">
                        {member.activeApplicationsCount ?? 1} active
                      </span>
                      {member.latestApplicationStatus && (
                        <CorApplicationBadge status={member.latestApplicationStatus} />
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenApplyModal(member)}
                        title="Apply for Opportunity"
                        className="px-2.5 py-1 rounded-md text-xs font-medium border border-[#E8E8E3] bg-[#FDF8F6] text-[#B8532F] hover:bg-[#FBEBE5] transition-colors whitespace-nowrap inline-flex items-center gap-1 shadow-2xs"
                      >
                        <span>Apply</span>
                        <span aria-hidden="true">→</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(member)}
                        disabled={statusTogglingId === member.id}
                        title={member.status === "active" ? "Pause representation" : "Reactivate"}
                        className="p-1.5 rounded-md text-[#8A8A85] hover:text-[#141413] hover:bg-[#F3F3EE] transition-colors shrink-0 inline-flex items-center justify-center disabled:opacity-50"
                      >
                        {member.status === "active" ? (
                          <PauseCircle className="w-4 h-4" />
                        ) : (
                          <PlayCircle className="w-4 h-4 text-[#10B981]" />
                        )}
                      </button>

                      <Link
                        href={`/admin/cor/members/${member.id}`}
                        className="p-1.5 rounded-md text-[#8A8A85] hover:text-[#141413] hover:bg-[#F3F3EE] transition-colors shrink-0 inline-flex items-center justify-center"
                        title="View Career Profile"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {filteredMembers.length > pageSize && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredMembers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Apply for Member Modal */}
      {selectedMemberForApply && (
        <ApplyForMemberModal
          isOpen={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          availableMembers={members}
          availableOpportunities={availableOpportunities}
          initialMemberId={selectedMemberForApply.id}
          onSuccess={() => {
            // refresh counts
          }}
        />
      )}
    </div>
  );
}
