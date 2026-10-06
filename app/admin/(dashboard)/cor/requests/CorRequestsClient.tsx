"use client";

import React, { useState, useMemo } from "react";
import {
  CorRequest,
  CorRequestStatus,
  CorMember,
} from "@/lib/types";
import { CorRequestBadge } from "@/components/cor/CorStatusBadge";
import { CorNavTabs } from "@/components/cor/CorNavTabs";
import { ExportDropdown } from "@/components/admin/ExportDropdown";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui";
import {
  approveCorRequestAction,
  declineCorRequestAction,
} from "@/app/admin/actions";
import {
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  FileText,
  Briefcase,
  GraduationCap,
  Globe,
  Clock,
  UserCheck,
  Award,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

interface CorRequestsClientProps {
  initialRequests: CorRequest[];
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

export function CorRequestsClient({
  initialRequests,
  counts,
}: CorRequestsClientProps) {
  const toast = useToast();
  const [requests, setRequests] = useState<CorRequest[]>(initialRequests);
  const [statusFilter, setStatusFilter] = useState<CorRequestStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Drawer review state
  const [selectedRequest, setSelectedRequest] = useState<CorRequest | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Approve confirmation modal
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Decline modal with reason
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("Experience level does not meet current requirements");
  const [declineNote, setDeclineNote] = useState("");
  const [isDeclining, setIsDeclining] = useState(false);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inName = r.creatorName.toLowerCase().includes(q);
        const inRole = r.desiredRole.toLowerCase().includes(q) || r.currentRole.toLowerCase().includes(q);
        const inSkills = r.skills.some((s) => s.toLowerCase().includes(q));
        const inEmail = r.creatorEmail.toLowerCase().includes(q);
        if (!inName && !inRole && !inSkills && !inEmail) return false;
      }
      return true;
    });
  }, [requests, statusFilter, searchQuery]);

  // Paginated
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  const openReviewDrawer = (req: CorRequest) => {
    setSelectedRequest(req);
    setIsDrawerOpen(true);
  };

  // Action: Approve
  const handleConfirmApprove = async () => {
    if (!selectedRequest) return;
    setIsApproving(true);
    try {
      const res = await approveCorRequestAction(selectedRequest.id);
      if (!res.success || !res.request) {
        toast.error("Approval Failed", res.error || "Could not approve request.");
      } else {
        toast.success(
          "Request Approved",
          `${res.request.creatorName} is now an active COR Member.`
        );
        setRequests((prev) =>
          prev.map((r) => (r.id === res.request!.id ? res.request! : r))
        );
        setSelectedRequest(res.request);
        setIsApproveModalOpen(false);
      }
    } catch {
      toast.error("Network Error", "Could not complete approval.");
    } finally {
      setIsApproving(false);
    }
  };

  // Action: Decline
  const handleConfirmDecline = async () => {
    if (!selectedRequest) return;
    setIsDeclining(true);
    try {
      const res = await declineCorRequestAction(selectedRequest.id, declineReason, declineNote);
      if (!res.success || !res.request) {
        toast.error("Decline Failed", res.error || "Could not decline request.");
      } else {
        toast.success("Request Declined", `Request marked as declined.`);
        setRequests((prev) =>
          prev.map((r) => (r.id === res.request!.id ? res.request! : r))
        );
        setSelectedRequest(res.request);
        setIsDeclineModalOpen(false);
      }
    } catch {
      toast.error("Network Error", "Could not complete decline action.");
    } finally {
      setIsDeclining(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="border-b border-[#E8E8E3] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#141413]">
            Creator Requests
          </h1>
          <p className="text-xs sm:text-sm text-[#6E6E69] mt-1 max-w-2xl">
            Review creators who have requested support through COR.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <ExportDropdown
            data={filteredRequests}
            filename="iRAS-COR-Requests"
            reportTitle="COR Requests Report"
            columns={[
              { header: "Creator", key: "creatorName" },
              { header: "Email", key: "creatorEmail" },
              { header: "Requested On", key: (row) => formatDate(row.createdAt) },
              { header: "Preferred Role", key: "desiredRole" },
              { header: "Experience", key: "experienceYears" },
              { header: "Status", key: "status" }
            ]}
          />
          {pendingCount > 0 && (
            <div className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] text-[#92400E] text-xs font-semibold whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
              <span>{pendingCount} Pending Review</span>
            </div>
          )}
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
              { label: "All", value: "all", count: requests.length },
              { label: "Pending", value: "pending", count: requests.filter((r) => r.status === "pending").length },
              { label: "Approved", value: "approved", count: requests.filter((r) => r.status === "approved").length },
              { label: "Declined", value: "declined", count: requests.filter((r) => r.status === "declined").length },
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
            placeholder="Search candidate, role, skills..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs md:text-sm bg-white border border-[#E8E8E3] rounded-lg pl-9 pr-3 py-1.5 text-[#141413] placeholder-[#8A8A85] focus:outline-none focus:ring-1 focus:ring-[#B8532F]"
          />
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white border border-[#E8E8E3] rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#FAFAF8] border-b border-[#E8E8E3]">
              <TableHead className="py-3 px-4 text-xs font-semibold text-[#6E6E69] uppercase tracking-wider">
                Creator
              </TableHead>
              <TableHead className="py-3 px-4 text-xs font-semibold text-[#6E6E69] uppercase tracking-wider">
                Requested On
              </TableHead>
              <TableHead className="py-3 px-4 text-xs font-semibold text-[#6E6E69] uppercase tracking-wider">
                Career Goal
              </TableHead>
              <TableHead className="py-3 px-4 text-xs font-semibold text-[#6E6E69] uppercase tracking-wider">
                Preferred Role
              </TableHead>
              <TableHead className="py-3 px-4 text-xs font-semibold text-[#6E6E69] uppercase tracking-wider">
                Experience
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
            {paginatedRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12">
                  <EmptyState
                    title="No COR requests found"
                    description="No creator questionnaire submissions match your current filters."
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedRequests.map((req) => (
                <TableRow
                  key={req.id}
                  onClick={() => openReviewDrawer(req)}
                  className="cursor-pointer hover:bg-[#FBFBFA] transition-colors border-b border-[#E8E8E3] last:border-none"
                >
                  <TableCell className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {req.creatorAvatar ? (
                        <img
                          src={req.creatorAvatar}
                          alt={req.creatorName}
                          className="w-9 h-9 rounded-full object-cover border border-[#E8E8E3]"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#EAEAE5] flex items-center justify-center text-xs font-semibold text-[#141413]">
                          {req.creatorName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-sm text-[#141413]">
                          {req.creatorName}
                        </div>
                        <div className="text-xs text-[#6E6E69]">
                          {req.location || req.creatorEmail}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 px-4 text-xs text-[#6E6E69]">
                    {formatDate(req.createdAt)}
                  </TableCell>

                  <TableCell className="py-3 px-4 text-xs text-[#6E6E69]">
                    {req.careerGoals?.additionalNotes ? req.careerGoals.additionalNotes.substring(0, 30) + '...' : "Not specified"}
                  </TableCell>

                  <TableCell className="py-3 px-4">
                    <div className="text-xs font-medium text-[#141413]">
                      {req.desiredRole}
                    </div>
                  </TableCell>

                  <TableCell className="py-3 px-4">
                    <div className="text-xs font-medium text-[#141413]">
                      {req.experienceYears}
                    </div>
                  </TableCell>

                  <TableCell className="py-3 px-4">
                    <CorRequestBadge status={req.status} />
                  </TableCell>

                  <TableCell className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openReviewDrawer(req);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E8E8E3] bg-white text-[#141413] hover:bg-[#F3F3EE] transition-colors whitespace-nowrap inline-flex items-center gap-1 shadow-2xs"
                    >
                      <span>Review</span>
                      <span>&rarr;</span>
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {filteredRequests.length > pageSize && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredRequests.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Detailed Questionnaire Review Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Review COR Request"
        maxWidth="lg"
      >
        {selectedRequest && (
          <div className="space-y-6 pb-6 text-[#141413]">
            {/* Header Card */}
            <div className="flex items-start justify-between p-4 rounded-xl border border-[#E8E8E3] bg-[#FAFAF8]">
              <div className="flex items-center gap-3.5">
                {selectedRequest.creatorAvatar ? (
                  <img
                    src={selectedRequest.creatorAvatar}
                    alt={selectedRequest.creatorName}
                    className="w-12 h-12 rounded-full object-cover border border-[#E8E8E3]"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#EAEAE5] flex items-center justify-center text-sm font-semibold text-[#141413]">
                    {selectedRequest.creatorName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-base font-bold text-[#141413]">
                    {selectedRequest.creatorName}
                  </div>
                  <div className="text-xs text-[#6E6E69]">
                    {selectedRequest.creatorEmail} · {selectedRequest.location || "Remote"}
                  </div>
                  <div className="text-xs font-medium text-[#B8532F] mt-0.5">
                    Target Role: {selectedRequest.desiredRole}
                  </div>
                </div>
              </div>
              <div>
                <CorRequestBadge status={selectedRequest.status} />
              </div>
            </div>

            {/* Decision Action Banner if Pending */}
            {selectedRequest.status === "pending" && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-[#E8E8E3] bg-[#FDF8F6] gap-3">
                <div className="text-sm text-[#141413] font-medium leading-relaxed">
                  <strong>COR Membership Decision</strong><br/>
                  Would you like to accept this creator into COR?
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setIsDeclineModalOpen(true)}
                    className="whitespace-nowrap bg-white text-[#141413] border border-[#E8E8E3] hover:bg-gray-50"
                  >
                    Decline Request
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setIsApproveModalOpen(true)}
                    className="whitespace-nowrap bg-[#141413] hover:bg-[#2A2A28] text-white border-none"
                  >
                    Approve Creator
                  </Button>
                </div>
              </div>
            )}

            {/* If Already Decided */}
            {selectedRequest.status === "approved" && (
              <div className="p-3.5 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] text-xs text-[#047857]">
                ✓ Approved on {selectedRequest.approvedAt ? formatDate(selectedRequest.approvedAt) : "Recently"}. Candidate is an active COR Member.
              </div>
            )}

            {selectedRequest.status === "declined" && (
              <div className="p-3.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] text-xs text-[#B91C1C] space-y-1">
                <div className="font-semibold">✕ Request Declined</div>
                {selectedRequest.declineReason && (
                  <div>Reason: {selectedRequest.declineReason}</div>
                )}
                {selectedRequest.adminNotes && (
                  <div>Internal note: {selectedRequest.adminNotes}</div>
                )}
              </div>
            )}

            {/* SECTION 1: Personal & Contact */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[#6E6E69] flex items-center gap-2 border-b border-[#E8E8E3] pb-1.5">
                <span>1. Personal Information</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-xl border border-[#E8E8E3]">
                <div>
                  <span className="text-[#8A8A85]">Full Name:</span>
                  <p className="font-medium text-[#141413] mt-0.5">{selectedRequest.creatorName}</p>
                </div>
                <div>
                  <span className="text-[#8A8A85]">Email Address:</span>
                  <p className="font-medium text-[#141413] mt-0.5">{selectedRequest.creatorEmail}</p>
                </div>
                <div>
                  <span className="text-[#8A8A85]">Phone / WhatsApp:</span>
                  <p className="font-medium text-[#141413] mt-0.5">{selectedRequest.phone || "—"}</p>
                </div>
                <div>
                  <span className="text-[#8A8A85]">Current Location:</span>
                  <p className="font-medium text-[#141413] mt-0.5">{selectedRequest.location || "—"}</p>
                </div>
              </div>
            </div>

            {/* SECTION 2: Career Information */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[#6E6E69] flex items-center gap-2 border-b border-[#E8E8E3] pb-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#B8532F]" />
                <span>2. Career Information</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-xl border border-[#E8E8E3]">
                <div>
                  <span className="text-[#8A8A85]">Current Role:</span>
                  <p className="font-medium text-[#141413] mt-0.5">{selectedRequest.currentRole}</p>
                </div>
                <div>
                  <span className="text-[#8A8A85]">Current Company / Studio:</span>
                  <p className="font-medium text-[#141413] mt-0.5">{selectedRequest.currentCompany || "Independent"}</p>
                </div>
                <div>
                  <span className="text-[#8A8A85]">Total Experience:</span>
                  <p className="font-medium text-[#141413] mt-0.5">{selectedRequest.experienceYears}</p>
                </div>
                <div>
                  <span className="text-[#8A8A85]">Employment Status:</span>
                  <p className="font-medium text-[#141413] mt-0.5">{selectedRequest.employmentStatus || "Self-employed"}</p>
                </div>
              </div>
            </div>

            {/* SECTION 3: Skills & Specialization */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[#6E6E69] flex items-center gap-2 border-b border-[#E8E8E3] pb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#B8532F]" />
                <span>3. Skills & Specialization</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-[#E8E8E3] space-y-3 text-xs">
                <div>
                  <span className="text-[#8A8A85] block mb-1">Primary Core Skills:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRequest.skills.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded-md bg-[#F3F3EE] font-medium text-[#141413]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedRequest.secondarySkills && selectedRequest.secondarySkills.length > 0 && (
                  <div>
                    <span className="text-[#8A8A85] block mb-1">Secondary / Tool Skills:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRequest.secondarySkills.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded-md bg-[#FAFAF8] border border-[#E8E8E3] font-medium text-[#6E6E69]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRequest.specialization && (
                  <div>
                    <span className="text-[#8A8A85] block">Signature Specialization:</span>
                    <p className="text-[#141413] mt-0.5">{selectedRequest.specialization}</p>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 4: Education & Experience */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[#6E6E69] flex items-center gap-2 border-b border-[#E8E8E3] pb-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-[#B8532F]" />
                <span>4. Education & Background</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-[#E8E8E3] text-xs space-y-2">
                <div className="font-semibold text-[#141413]">
                  {selectedRequest.education?.degree || "Formal / Studio Training"}
                </div>
                <div className="text-[#6E6E69]">
                  {selectedRequest.education?.institution} ({selectedRequest.education?.year || "Completed"})
                </div>

                {selectedRequest.workHistory && selectedRequest.workHistory.length > 0 && (
                  <div className="pt-2 border-t border-[#E8E8E3] space-y-2">
                    <span className="text-[#8A8A85] font-medium block">Key Experience Records:</span>
                    {selectedRequest.workHistory.map((wh, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-[#FAFAF8] border border-[#E8E8E3]">
                        <div className="font-semibold text-[#141413]">
                          {wh.role} — {wh.company}
                        </div>
                        <div className="text-[11px] text-[#8A8A85]">{wh.dates}</div>
                        <div className="text-[#5E5E59] mt-1">{wh.responsibilities}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 5: Professional Links & Documents */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[#6E6E69] flex items-center gap-2 border-b border-[#E8E8E3] pb-1.5">
                <Globe className="w-3.5 h-3.5 text-[#B8532F]" />
                <span>5. Links & Documents</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-[#E8E8E3] text-xs grid grid-cols-2 gap-2">
                {selectedRequest.links?.portfolio && (
                  <a
                    href={selectedRequest.links.portfolio}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-[#FAFAF8] hover:bg-[#F3F3EE] text-[#141413] transition-colors"
                  >
                    <span>Portfolio</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#8A8A85]" />
                  </a>
                )}
                {selectedRequest.links?.linkedin && (
                  <a
                    href={selectedRequest.links.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-[#FAFAF8] hover:bg-[#F3F3EE] text-[#141413] transition-colors"
                  >
                    <span>LinkedIn</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#8A8A85]" />
                  </a>
                )}
                {selectedRequest.links?.behance && (
                  <a
                    href={selectedRequest.links.behance}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-[#FAFAF8] hover:bg-[#F3F3EE] text-[#141413] transition-colors"
                  >
                    <span>Behance</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#8A8A85]" />
                  </a>
                )}
                {selectedRequest.links?.website && (
                  <a
                    href={selectedRequest.links.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-[#FAFAF8] hover:bg-[#F3F3EE] text-[#141413] transition-colors"
                  >
                    <span>Studio Website</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#8A8A85]" />
                  </a>
                )}
                {selectedRequest.documents?.resumeUrl && (
                  <div className="col-span-2 flex items-center justify-between p-2 rounded-lg bg-[#F7F7F4] border border-[#E8E8E3]">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#B8532F]" />
                      <span className="font-medium text-[#141413]">CV / Resume Document Attached</span>
                    </div>
                    <span className="text-[11px] text-[#6E6E69]">Verified</span>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 6: Career Goals & Expectations */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[#6E6E69] flex items-center gap-2 border-b border-[#E8E8E3] pb-1.5">
                <span>6. Career Goals & Opportunity Preferences</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-[#E8E8E3] text-xs space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[#8A8A85]">Expected Salary / Rate:</span>
                    <p className="font-semibold text-[#141413] mt-0.5">
                      {selectedRequest.careerGoals?.expectedSalary || "Negotiable"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#8A8A85]">Preferred Work Type:</span>
                    <p className="font-semibold text-[#141413] mt-0.5">
                      {selectedRequest.careerGoals?.preferredWorkType || "Hybrid"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#8A8A85]">Opportunity Type:</span>
                    <p className="font-semibold text-[#141413] mt-0.5">
                      {selectedRequest.careerGoals?.opportunityType || "Full-time / Residency"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#8A8A85]">Target Desired Role:</span>
                    <p className="font-semibold text-[#B8532F] mt-0.5">
                      {selectedRequest.desiredRole}
                    </p>
                  </div>
                </div>

                {selectedRequest.careerGoals?.additionalNotes && (
                  <div className="pt-2 border-t border-[#E8E8E3]">
                    <span className="text-[#8A8A85] block">Additional Goals / Aspirations:</span>
                    <p className="text-[#141413] mt-0.5 leading-relaxed">
                      {selectedRequest.careerGoals.additionalNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Approve Confirmation Modal */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title="Approve COR Request"
        description="Verify candidate eligibility and enroll them into the COR representation program."
      >
        <div className="space-y-4">
          <p className="text-sm text-[#141413]">
            You are about to approve <strong>{selectedRequest?.creatorName}</strong> as an active COR Member.
          </p>

          <div className="p-3 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-xs text-[#047857] space-y-1">
            <div className="font-semibold">Workflow Actions Triggered:</div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              <li>COR Request status changed to <strong>Approved</strong>.</li>
              <li>New COR Member profile created and linked to this creator.</li>
              <li>Membership set to <strong>Active</strong>.</li>
              <li>Candidate becomes eligible for curated opportunity applications.</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E8E8E3]">
            <Button
              variant="secondary"
              onClick={() => setIsApproveModalOpen(false)}
              disabled={isApproving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmApprove}
              isLoading={isApproving}
            >
              Confirm Approval
            </Button>
          </div>
        </div>
      </Modal>

      {/* Decline Reason Modal */}
      <Modal
        isOpen={isDeclineModalOpen}
        onClose={() => setIsDeclineModalOpen(false)}
        title="Decline COR Request"
        description="Select a reason for declining this creator request."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E6E69] mb-1.5">
              Reason for Declining
            </label>
            <select
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="w-full text-sm bg-white border border-[#E8E8E3] rounded-lg px-3 py-2 text-[#141413] focus:outline-none focus:ring-1 focus:ring-[#B8532F]"
            >
              <option value="Experience level does not meet current requirements">
                Experience level does not meet current requirements
              </option>
              <option value="Portfolio outside current curatorial scope">
                Portfolio outside current curatorial scope
              </option>
              <option value="Incomplete or unverified questionnaire credentials">
                Incomplete or unverified questionnaire credentials
              </option>
              <option value="No matching representation opportunities currently available">
                No matching representation opportunities currently available
              </option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E6E69] mb-1.5">
              Internal Admin Note (Admin Only)
            </label>
            <textarea
              rows={3}
              value={declineNote}
              onChange={(e) => setDeclineNote(e.target.value)}
              placeholder="Private note explaining context or recommended follow-up period..."
              className="w-full text-sm bg-white border border-[#E8E8E3] rounded-lg px-3 py-2 text-[#141413] focus:outline-none focus:ring-1 focus:ring-[#B8532F]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E8E8E3]">
            <Button
              variant="secondary"
              onClick={() => setIsDeclineModalOpen(false)}
              disabled={isDeclining}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDecline}
              isLoading={isDeclining}
            >
              Decline Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
