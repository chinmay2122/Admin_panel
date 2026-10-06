"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  CorOpportunity,
  CorOpportunityStatus,
  CorOpportunityWorkplaceType,
  CorMember,
} from "@/lib/types";
import { CorOpportunityBadge } from "@/components/cor/CorStatusBadge";
import { CorNavTabs } from "@/components/cor/CorNavTabs";
import { ApplyForMemberModal } from "@/components/cor/ApplyForMemberModal";
import { rankMembersForOpportunity } from "@/lib/data/cor-matching";
import { ExportDropdown } from "@/components/admin/ExportDropdown";
import { Modal } from "@/components/ui/Modal";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui";
import {
  createCorOpportunityAction,
  updateCorOpportunityAction,
  deleteCorOpportunityAction,
} from "@/app/admin/actions";
import {
  Search,
  Plus,
  Briefcase,
  Users,
  Send,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Trash2,
  Clock,
  ArrowRight,
} from "lucide-react";

interface CorOpportunitiesClientProps {
  initialOpportunities: CorOpportunity[];
  availableMembers: CorMember[];
  counts: {
    requests: number;
    members: number;
    applications: number;
    opportunities: number;
  };
}

export function CorOpportunitiesClient({
  initialOpportunities,
  availableMembers,
  counts,
}: CorOpportunitiesClientProps) {
  const toast = useToast();
  const [opportunities, setOpportunities] = useState<CorOpportunity[]>(initialOpportunities);
  const [statusFilter, setStatusFilter] = useState<CorOpportunityStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Add Opportunity Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newWorkplace, setNewWorkplace] = useState<CorOpportunityWorkplaceType>("Remote");
  const [newSalary, setNewSalary] = useState("");
  const [newSkills, setNewSkills] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newJobUrl, setNewJobUrl] = useState("");
  const [newRecruiter, setNewRecruiter] = useState("");

  // Candidate Match Drawer
  const [selectedOpportunityForMatching, setSelectedOpportunityForMatching] = useState<CorOpportunity | null>(null);
  const [isMatchingDrawerOpen, setIsMatchingDrawerOpen] = useState(false);

  // Apply Modal
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyOppId, setApplyOppId] = useState<string | undefined>();
  const [applyMemberId, setApplyMemberId] = useState<string | undefined>();

  // Filtered opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      if (statusFilter !== "all" && opp.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = opp.title.toLowerCase().includes(q);
        const inCompany = opp.company.toLowerCase().includes(q);
        const inLoc = opp.location.toLowerCase().includes(q);
        const inSkills = opp.requiredSkills.some((s) => s.toLowerCase().includes(q));
        if (!inTitle && !inCompany && !inLoc && !inSkills) return false;
      }
      return true;
    });
  }, [opportunities, statusFilter, searchQuery]);

  const paginatedOpportunities = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOpportunities.slice(start, start + pageSize);
  }, [filteredOpportunities, currentPage, pageSize]);

  // Ranked candidates for matching drawer
  const rankedMembers = useMemo(() => {
    if (!selectedOpportunityForMatching) return [];
    return rankMembersForOpportunity(availableMembers, selectedOpportunityForMatching);
  }, [selectedOpportunityForMatching, availableMembers]);

  const handleOpenMatching = (opp: CorOpportunity) => {
    setSelectedOpportunityForMatching(opp);
    setIsMatchingDrawerOpen(true);
  };

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCompany.trim() || !newLocation.trim()) {
      toast.error("Required Fields", "Title, Company, and Location are mandatory.");
      return;
    }

    setIsCreating(true);
    try {
      const skillsArray = newSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await createCorOpportunityAction({
        title: newTitle,
        company: newCompany,
        location: newLocation,
        workplaceType: newWorkplace,
        salary: newSalary,
        requiredSkills: skillsArray,
        description: newDesc,
        jobUrl: newJobUrl || undefined,
        recruiterContact: newRecruiter || undefined,
        experienceRequirement: "3+ years professional experience",
        status: "open",
      });

      if (!res.success || !res.opportunity) {
        toast.error("Failed to create opportunity", res.error || "Please try again.");
      } else {
        toast.success("Opportunity Created", `${res.opportunity.title} at ${res.opportunity.company} added.`);
        setOpportunities((prev) => [res.opportunity!, ...prev]);
        setIsAddModalOpen(false);
        // Reset form
        setNewTitle("");
        setNewCompany("");
        setNewLocation("");
        setNewSalary("");
        setNewSkills("");
        setNewDesc("");
        setNewJobUrl("");
        setNewRecruiter("");
      }
    } catch {
      toast.error("Network Error", "Could not create opportunity.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleStatus = async (opp: CorOpportunity) => {
    const nextStatus: CorOpportunityStatus = opp.status === "open" ? "closed" : "open";
    try {
      const res = await updateCorOpportunityAction(opp.id, { status: nextStatus });
      if (res.success && res.opportunity) {
        setOpportunities((prev) =>
          prev.map((o) => (o.id === res.opportunity!.id ? res.opportunity! : o))
        );
        toast.success("Status Updated", `Opportunity marked as ${nextStatus}.`);
      }
    } catch {
      toast.error("Update failed", "Could not change status.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#E8E8E3] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#141413]">
            Opportunities
          </h1>
          <p className="text-xs sm:text-sm text-[#6E6E69] mt-1 max-w-2xl">
            Curate and manage exclusive commissions, residencies, and roles. Match verified COR creators and submit representations.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <ExportDropdown
            data={filteredOpportunities}
            filename="ERAS-COR-Opportunities"
            reportTitle="COR Opportunities Report"
            columns={[
              { header: "Opportunity", key: "title" },
              { header: "Company", key: "company" },
              { header: "Location", key: "location" },
              { header: "Workplace", key: "workplaceType" },
              { header: "Salary", key: (row) => row.salary || "Competitive" },
              { header: "Skills", key: (row) => row.requiredSkills.join(", ") },
              { header: "Status", key: "status" }
            ]}
          />
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 bg-[#141413] hover:bg-[#2A2A28] text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Opportunity</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <CorNavTabs counts={counts} />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Pill Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(
            [
              { label: "All Opportunities", value: "all", count: opportunities.length },
              { label: "Open", value: "open", count: opportunities.filter((o) => o.status === "open").length },
              { label: "Paused", value: "paused", count: opportunities.filter((o) => o.status === "paused").length },
              { label: "Closed", value: "closed", count: opportunities.filter((o) => o.status === "closed").length },
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
            placeholder="Search role, company, skills..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs md:text-sm bg-white border border-[#E8E8E3] rounded-lg pl-9 pr-3 py-1.5 text-[#141413] placeholder-[#8A8A85] focus:outline-none focus:ring-1 focus:ring-[#B8532F]"
          />
        </div>
      </div>

      {/* Opportunities Table */}
      <div className="bg-white border border-[#E8E8E3] rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#FAFAF8] border-b border-[#E8E8E3]">
              <TableHead className="py-3 px-4 text-xs font-semibold text-[#6E6E69] uppercase tracking-wider">
                Opportunity
              </TableHead>
              <TableHead className="py-3 px-4 text-xs font-semibold text-[#6E6E69] uppercase tracking-wider">
                Location
              </TableHead>
              <TableHead className="py-3 px-4 text-xs font-semibold text-[#6E6E69] uppercase tracking-wider">
                Salary
              </TableHead>
              <TableHead className="py-3 px-4 text-xs font-semibold text-[#6E6E69] uppercase tracking-wider">
                Skills
              </TableHead>
              <TableHead className="py-3 px-4 text-xs font-semibold text-[#6E6E69] uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="py-3 px-4 text-xs font-semibold text-[#6E6E69] uppercase tracking-wider text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOpportunities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12">
                  <EmptyState
                    title="No opportunities found"
                    description="No opportunities match your current filter."
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedOpportunities.map((opp) => (
                <TableRow
                  key={opp.id}
                  className="hover:bg-[#FBFBFA] transition-colors border-b border-[#E8E8E3] last:border-none"
                >
                  <TableCell className="py-3 px-4">
                    <Link
                      href={`/admin/cor/opportunities/${opp.id}`}
                      className="group block"
                    >
                      <div className="font-semibold text-sm text-[#141413] group-hover:text-[#B8532F] transition-colors">
                        {opp.title}
                      </div>
                      <div className="text-xs text-[#6E6E69]">
                        {opp.company}
                      </div>
                    </Link>
                  </TableCell>

                  <TableCell className="py-3 px-4">
                    <div className="text-xs font-medium text-[#141413]">
                      {opp.location}
                    </div>
                    <div className="text-[11px] text-[#6E6E69]">
                      {opp.workplaceType}
                    </div>
                  </TableCell>

                  <TableCell className="py-3 px-4">
                    <div className="text-xs font-semibold text-[#141413]">
                      {opp.salary || "Competitive"}
                    </div>
                  </TableCell>

                  <TableCell className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {opp.requiredSkills.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="px-1.5 py-0.5 rounded bg-[#F3F3EE] text-[10px] font-medium text-[#5E5E59]"
                        >
                          {s}
                        </span>
                      ))}
                      {opp.requiredSkills.length > 3 && (
                        <span className="text-[10px] text-[#8A8A85]">
                          +{opp.requiredSkills.length - 3}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="py-3 px-4">
                    <CorOpportunityBadge status={opp.status} />
                  </TableCell>

                  <TableCell className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenMatching(opp)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FDF8F6] text-[#B8532F] border border-[#F5D7CC] hover:bg-[#FBEBE5] transition-colors whitespace-nowrap shadow-2xs"
                        title="Match Candidates"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Match ({availableMembers.length})</span>
                      </button>

                      <Link
                        href={`/admin/cor/opportunities/${opp.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E8E8E3] bg-white text-[#141413] hover:bg-[#F3F3EE] transition-colors whitespace-nowrap inline-flex items-center gap-1 shadow-2xs"
                      >
                        <span>Details</span>
                        <span>&rarr;</span>
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
      {filteredOpportunities.length > pageSize && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredOpportunities.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      )}

      {/* MATCH CANDIDATES DRAWER (Rule-based matching) */}
      <Drawer
        isOpen={isMatchingDrawerOpen}
        onClose={() => setIsMatchingDrawerOpen(false)}
        title={`Candidate Match: ${selectedOpportunityForMatching?.title || "Opportunity"}`}
        maxWidth="lg"
      >
        {selectedOpportunityForMatching && (
          <div className="space-y-5 text-[#141413]">
            <div className="p-4 rounded-xl border border-[#E8E8E3] bg-[#FAFAF8] space-y-1">
              <div className="font-bold text-base text-[#141413]">
                {selectedOpportunityForMatching.company}
              </div>
              <div className="text-xs text-[#6E6E69]">
                {selectedOpportunityForMatching.location} · {selectedOpportunityForMatching.workplaceType} · {selectedOpportunityForMatching.salary || "Competitive"}
              </div>
              <div className="flex flex-wrap gap-1 pt-2">
                {selectedOpportunityForMatching.requiredSkills.map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded bg-white border border-[#E8E8E3] text-[11px] font-medium text-[#141413]">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-xs font-bold uppercase tracking-wider text-[#6E6E69]">
              Ranked COR Members ({rankedMembers.length})
            </div>

            <div className="space-y-3">
              {rankedMembers.map((match) => (
                <div
                  key={match.member.id}
                  className="p-4 rounded-xl border border-[#E8E8E3] bg-white shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {match.member.creatorAvatar ? (
                        <img
                          src={match.member.creatorAvatar}
                          alt={match.member.name}
                          className="w-10 h-10 rounded-full object-cover border border-[#E8E8E3]"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#EAEAE5] flex items-center justify-center text-xs font-semibold text-[#141413]">
                          {match.member.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-sm text-[#141413]">
                          {match.member.name}
                        </div>
                        <div className="text-xs text-[#6E6E69]">
                          {match.member.desiredRole} · {match.member.location || "Remote"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          match.scorePercentage >= 75
                            ? "bg-[#E6F4EA] text-[#137333]"
                            : match.scorePercentage >= 50
                            ? "bg-[#FEF7E0] text-[#B06000]"
                            : "bg-[#F1F3F4] text-[#5F6368]"
                        }`}
                      >
                        {match.scorePercentage}% Match
                      </span>
                    </div>
                  </div>

                  {/* Reasons breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-[#E8E8E3]">
                    {match.reasons.map((r, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        {r.matched ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#137333] shrink-0 mt-0.5" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8A8A85] shrink-0 mt-1.5 mr-1 ml-0.5" />
                        )}
                        <span className="text-[11px] text-[#5E5E59] leading-tight">
                          {r.detail}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Apply action */}
                  <div className="pt-2 flex justify-end">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setApplyMemberId(match.member.id);
                        setApplyOppId(selectedOpportunityForMatching.id);
                        setIsApplyModalOpen(true);
                      }}
                    >
                      <Send className="w-3 h-3" />
                      <span>Apply for {match.member.name}</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>

      {/* Add Opportunity Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Job / Opportunity"
        description="Add a new verified career opportunity or residency to the COR portfolio."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateOpportunity} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E6E69] mb-1">
                Job / Opportunity Title *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Spatial Media Resident"
                className="w-full text-sm bg-white border border-[#E8E8E3] rounded-lg px-3 py-2 text-[#141413] focus:outline-none focus:ring-1 focus:ring-[#B8532F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E6E69] mb-1">
                Company / Organization *
              </label>
              <input
                type="text"
                required
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                placeholder="e.g. Atelier Kōra"
                className="w-full text-sm bg-white border border-[#E8E8E3] rounded-lg px-3 py-2 text-[#141413] focus:outline-none focus:ring-1 focus:ring-[#B8532F]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E6E69] mb-1">
                Location *
              </label>
              <input
                type="text"
                required
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="e.g. Kyoto / Remote"
                className="w-full text-sm bg-white border border-[#E8E8E3] rounded-lg px-3 py-2 text-[#141413] focus:outline-none focus:ring-1 focus:ring-[#B8532F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E6E69] mb-1">
                Workplace Type
              </label>
              <select
                value={newWorkplace}
                onChange={(e) => setNewWorkplace(e.target.value as CorOpportunityWorkplaceType)}
                className="w-full text-sm bg-white border border-[#E8E8E3] rounded-lg px-3 py-2 text-[#141413] focus:outline-none focus:ring-1 focus:ring-[#B8532F]"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Onsite">Onsite</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E6E69] mb-1">
                Salary / Budget
              </label>
              <input
                type="text"
                value={newSalary}
                onChange={(e) => setNewSalary(e.target.value)}
                placeholder="e.g. $90,000 – $115,000 USD"
                className="w-full text-sm bg-white border border-[#E8E8E3] rounded-lg px-3 py-2 text-[#141413] focus:outline-none focus:ring-1 focus:ring-[#B8532F]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E6E69] mb-1">
              Required Skills (comma separated)
            </label>
            <input
              type="text"
              value={newSkills}
              onChange={(e) => setNewSkills(e.target.value)}
              placeholder="e.g. Spatial Media, Interactive Lighting, CAD, Parametric Design"
              className="w-full text-sm bg-white border border-[#E8E8E3] rounded-lg px-3 py-2 text-[#141413] focus:outline-none focus:ring-1 focus:ring-[#B8532F]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E6E69] mb-1">
              Description & Requirements
            </label>
            <textarea
              rows={3}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Detailed description of the residency or commission scope..."
              className="w-full text-sm bg-white border border-[#E8E8E3] rounded-lg px-3 py-2 text-[#141413] focus:outline-none focus:ring-1 focus:ring-[#B8532F]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E6E69] mb-1">
                Job / Listing URL
              </label>
              <input
                type="url"
                value={newJobUrl}
                onChange={(e) => setNewJobUrl(e.target.value)}
                placeholder="https://company.com/listing"
                className="w-full text-sm bg-white border border-[#E8E8E3] rounded-lg px-3 py-2 text-[#141413] focus:outline-none focus:ring-1 focus:ring-[#B8532F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E6E69] mb-1">
                Recruiter Contact
              </label>
              <input
                type="text"
                value={newRecruiter}
                onChange={(e) => setNewRecruiter(e.target.value)}
                placeholder="Name / Email / Phone"
                className="w-full text-sm bg-white border border-[#E8E8E3] rounded-lg px-3 py-2 text-[#141413] focus:outline-none focus:ring-1 focus:ring-[#B8532F]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E8E8E3]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isCreating}>
              Create Opportunity
            </Button>
          </div>
        </form>
      </Modal>

      {/* Apply Modal */}
      {isApplyModalOpen && (
        <ApplyForMemberModal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          availableMembers={availableMembers}
          availableOpportunities={opportunities}
          initialMemberId={applyMemberId}
          initialOpportunityId={applyOppId}
          onSuccess={() => {
            setIsMatchingDrawerOpen(false);
          }}
        />
      )}
    </div>
  );
}
