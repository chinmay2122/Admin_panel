"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import {
  Search,
  X,
  ShieldAlert,
  Eye,
  CheckCircle2,
  XCircle,
  EyeOff,
  Trash2,
  UserX,
  ExternalLink,
  Clock,
  AlertTriangle,
  Info,
  Check,
  ChevronDown,
} from "lucide-react";
import { Report, ReportStatus } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { ExportDropdown } from "@/components/admin/ExportDropdown";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import {
  dismissReportAction,
  resolveReportAction,
  hideArtworkModerationAction,
  removeArtworkModerationAction,
  suspendUserModerationAction,
} from "@/app/admin/actions";


interface ReportsClientProps {
  initialReports: Report[];
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function ReportsClient({ initialReports }: ReportsClientProps) {
  const toast = useToast();
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [activeTab, setActiveTab] = useState<ReportStatus | "all">("all");

  // Search
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Detail Drawer
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Moderation Modals
  const [dismissTarget, setDismissTarget] = useState<Report | null>(null);
  const [hideTarget, setHideTarget] = useState<Report | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Report | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<Report | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Table row action dropdown state
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdownId(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveDropdownId(null);
    };
    window.addEventListener("click", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("click", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Calculate dynamic real-data counts
  const counts = useMemo(() => {
    return {
      all: reports.length,
      pending: reports.filter((r) => r.status === "pending").length,
      resolved: reports.filter((r) => r.status === "resolved").length,
      dismissed: reports.filter((r) => r.status === "dismissed").length,
    };
  }, [reports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      // Tab filter
      if (activeTab !== "all" && rep.status !== activeTab) {
        return false;
      }

      // Search query
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        const matchesTitle = rep.artworkTitle?.toLowerCase().includes(q);
        const matchesOwner = rep.ownerName?.toLowerCase().includes(q);
        const matchesReporter = rep.reporterName?.toLowerCase().includes(q);
        const matchesReason = rep.reason?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesOwner && !matchesReporter && !matchesReason) {
          return false;
        }
      }

      return true;
    });
  }, [reports, activeTab, debouncedSearch]);

  // Pagination slice
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReports.slice(start, start + pageSize);
  }, [filteredReports, currentPage, pageSize]);

  // Open detail drawer
  const handleOpenDetail = (rep: Report) => {
    setSelectedReport(rep);
    setIsDrawerOpen(true);
  };

  // Status Badge Rendering matching reference
  const renderStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#EFEFEF] text-[#4A4A48] select-none capitalize">
            Pending
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#EAF2EC] text-[#28633B] select-none capitalize">
            Resolved
          </span>
        );
      case "dismissed":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#F3F3EF] text-[#71716D] select-none capitalize">
            Dismissed
          </span>
        );
    }
  };

  // 1. DISMISS REPORT
  const handleConfirmDismiss = async () => {
    if (!dismissTarget) return;
    const target = dismissTarget;
    setDismissTarget(null);
    setIsActionLoading(true);

    const previous = [...reports];
    const updated = reports.map((r) =>
      r.id === target.id ? { ...r, status: "dismissed" as const } : r
    );
    setReports(updated);
    if (selectedReport?.id === target.id) {
      setSelectedReport({ ...selectedReport, status: "dismissed" });
    }

    try {
      const res = await dismissReportAction(target.id);
      if (!res.success) {
        setReports(previous);
        toast.error("Failed to dismiss report", res.error || "Please try again.");
      } else {
        toast.success("Report dismissed", "The report was dismissed without moderating artwork.");
      }
    } catch {
      setReports(previous);
      toast.error("Network error", "Could not dismiss report.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // 2. HIDE CONTENT
  const handleConfirmHide = async () => {
    if (!hideTarget) return;
    const target = hideTarget;
    setHideTarget(null);
    setIsActionLoading(true);

    const previous = [...reports];
    const updated = reports.map((r) =>
      r.id === target.id
        ? { ...r, status: "resolved" as const, moderationAction: "artwork_hidden" }
        : r
    );
    setReports(updated);
    if (selectedReport?.id === target.id) {
      setSelectedReport({
        ...selectedReport,
        status: "resolved",
        moderationAction: "artwork_hidden",
      });
    }

    try {
      const res = await hideArtworkModerationAction(target.id, target.artworkId);
      if (!res.success) {
        setReports(previous);
        toast.error("Failed to hide artwork", res.error || "Please try again.");
      } else {
        toast.success("Artwork hidden", `"${target.artworkTitle}" is no longer publicly visible.`);
      }
    } catch {
      setReports(previous);
      toast.error("Network error", "Could not hide artwork.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // 3. REMOVE ARTWORK
  const handleConfirmRemove = async () => {
    if (!removeTarget) return;
    const target = removeTarget;
    setRemoveTarget(null);
    setIsActionLoading(true);

    const previous = [...reports];
    const updated = reports.map((r) =>
      r.id === target.id
        ? { ...r, status: "resolved" as const, moderationAction: "artwork_removed" }
        : r
    );
    setReports(updated);
    if (selectedReport?.id === target.id) {
      setSelectedReport({
        ...selectedReport,
        status: "resolved",
        moderationAction: "artwork_removed",
      });
    }

    try {
      const res = await removeArtworkModerationAction(target.id, target.artworkId);
      if (!res.success) {
        setReports(previous);
        toast.error("Failed to remove artwork", res.error || "Please try again.");
      } else {
        toast.success("Artwork removed", `"${target.artworkTitle}" removed from platform catalog.`);
      }
    } catch {
      setReports(previous);
      toast.error("Network error", "Could not remove artwork.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // 4. SUSPEND USER
  const handleConfirmSuspend = async () => {
    if (!suspendTarget || !suspendTarget.artworkOwnerId) return;
    const target = suspendTarget;
    setSuspendTarget(null);
    setIsActionLoading(true);

    const previous = [...reports];
    const updated = reports.map((r) =>
      r.id === target.id
        ? { ...r, status: "resolved" as const, moderationAction: "user_suspended" }
        : r
    );
    setReports(updated);
    if (selectedReport?.id === target.id) {
      setSelectedReport({
        ...selectedReport,
        status: "resolved",
        moderationAction: "user_suspended",
      });
    }

    const ownerId = target.artworkOwnerId;
    if (!ownerId) {
      toast.error("Error", "Artwork owner ID could not be identified.");
      setIsActionLoading(false);
      return;
    }

    try {
      const res = await suspendUserModerationAction(target.id, ownerId);
      if (!res.success) {
        setReports(previous);
        toast.error("Failed to suspend user", res.error || "Please try again.");
      } else {
        toast.success("User suspended", `User ${target.ownerName} has been suspended.`);
      }
    } catch {
      setReports(previous);
      toast.error("Network error", "Could not suspend user.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // 5. MARK RESOLVED
  const handleResolveDirect = async (rep: Report) => {
    setIsActionLoading(true);
    const previous = [...reports];
    const updated = reports.map((r) =>
      r.id === rep.id ? { ...r, status: "resolved" as const } : r
    );
    setReports(updated);
    if (selectedReport?.id === rep.id) {
      setSelectedReport({ ...selectedReport, status: "resolved" });
    }

    try {
      const res = await resolveReportAction(rep.id);
      if (!res.success) {
        setReports(previous);
        toast.error("Failed to resolve report", res.error || "Please try again.");
      } else {
        toast.success("Report marked as resolved", `Report on "${rep.artworkTitle}" is resolved.`);
      }
    } catch {
      setReports(previous);
      toast.error("Network error", "Could not resolve report.");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-150">
      {/* ========================================================================= */}
      {/* 1. PAGE HEADER (ERAS Studio Editorial Style)                              */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 1. PAGE HEADER (ERAS Studio Editorial Style)                              */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#141413] tracking-tight">
            Reports & moderation
          </h1>
          <p className="mt-1 text-sm text-[#6E6E69]">
            Keep the community safe, considered and respectful.
          </p>
        </div>
        <ExportDropdown
          data={filteredReports}
          filename="ERAS-Reports"
          reportTitle="Platform Moderation Reports"
          columns={[
            { header: "Reported Content", key: (row) => row.artworkTitle || "Untitled" },
            { header: "User", key: (row) => row.ownerName || "Unknown" },
            { header: "Reason", key: "reason" },
            { header: "Reporter", key: (row) => row.reporterName || "Community Member" },
            { header: "Date", key: (row) => formatDate(row.createdAt) },
            { header: "Status", key: "status" }
          ]}
        />
      </div>

      {/* ========================================================================= */}
      {/* 3. REPORT FILTER TABS & SEARCH                                            */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(["all", "pending", "resolved", "dismissed"] as const).map((tab) => {
            const isActive = activeTab === tab;
            const count = counts[tab];
            const label = tab.charAt(0).toUpperCase() + tab.slice(1);

            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer select-none whitespace-nowrap ${
                  isActive
                    ? "bg-[#141413] text-white shadow-2xs"
                    : "text-[#6E6E69] hover:text-[#141413] hover:bg-neutral-100"
                }`}
              >
                {label} {count > 0 && <span className="opacity-75">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[#8A8A85] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search reports by content, user, reporter..."
            className="w-full text-xs pl-8 pr-7 py-2 rounded-full border border-[#E8E8E3] bg-white text-[#141413] placeholder:text-[#8A8A85] focus:outline-none focus:border-[#141413] transition-all shadow-2xs"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setDebouncedSearch("");
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8A85] hover:text-[#141413] p-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. REPORTS TABLE (Matching Reference Image)                               */}
      {/* ========================================================================= */}
      {filteredReports.length === 0 ? (
        <EmptyState
          icon={<ShieldAlert className="w-6 h-6 text-[#8A8A85]" />}
          title={
            activeTab === "pending"
              ? "No pending reports"
              : activeTab === "resolved"
              ? "No resolved reports"
              : activeTab === "dismissed"
              ? "No dismissed reports"
              : "No reports found"
          }
          description={
            debouncedSearch
              ? "No reports match your current search. Try adjusting or clearing your query."
              : activeTab === "pending"
              ? "All community submissions are currently in good standing. No moderation action required."
              : "No moderation items are recorded under this category."
          }
          action={
            debouncedSearch ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchInput("");
                  setDebouncedSearch("");
                }}
              >
                Clear Search
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E8E8E3] overflow-visible shadow-2xs min-h-[360px]">
            <Table containerClassName="overflow-visible min-h-[360px] border-none bg-transparent">
              <TableHeader>
                <tr>
                  <TableHead className="py-3.5 pl-6 font-medium text-xs text-[#8A8A85]">
                    Reported content
                  </TableHead>
                  <TableHead className="py-3.5 font-medium text-xs text-[#8A8A85]">User</TableHead>
                  <TableHead className="py-3.5 font-medium text-xs text-[#8A8A85]">Reason</TableHead>
                  <TableHead className="py-3.5 font-medium text-xs text-[#8A8A85]">Reporter</TableHead>
                  <TableHead className="py-3.5 font-medium text-xs text-[#8A8A85]">Date</TableHead>
                  <TableHead className="py-3.5 font-medium text-xs text-[#8A8A85]">Status</TableHead>
                  <TableHead className="py-3.5 pr-6 text-right font-medium text-xs text-[#8A8A85]">
                    Actions
                  </TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {paginatedReports.map((rep) => (
                  <TableRow
                    key={rep.id}
                    onClick={() => handleOpenDetail(rep)}
                    className="cursor-pointer hover:bg-[#FAF9F5] transition-colors"
                  >
                    {/* 1. Reported Content */}
                    <TableCell className="pl-6 py-4 font-normal text-sm text-[#141413]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(rep);
                        }}
                        className="hover:underline text-left cursor-pointer font-normal text-[#141413]"
                      >
                        {rep.artworkTitle || "Untitled Artwork"}
                      </button>
                    </TableCell>

                    {/* 2. User (Creator) */}
                    <TableCell className="py-4 text-sm text-[#141413] whitespace-nowrap">
                      {rep.ownerName || "Unknown Artist"}
                    </TableCell>

                    {/* 3. Reason */}
                    <TableCell className="py-4 text-sm text-[#141413] max-w-xs truncate">
                      {rep.reason}
                    </TableCell>

                    {/* 4. Reporter */}
                    <TableCell className="py-4 text-sm text-[#141413] whitespace-nowrap">
                      {rep.reporterName || "Community Member"}
                    </TableCell>

                    {/* 5. Date */}
                    <TableCell className="py-4 text-sm text-[#141413] whitespace-nowrap">
                      {formatDate(rep.createdAt)}
                    </TableCell>

                    {/* 6. Status */}
                    <TableCell className="py-4 whitespace-nowrap">
                      {renderStatusBadge(rep.status)}
                    </TableCell>

                    {/* 7. Action Dropdown Section */}
                    <TableCell className="py-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={() => setActiveDropdownId(activeDropdownId === rep.id ? null : rep.id)}
                          className="px-3.5 py-1.5 rounded-full border border-[#D5D5D0] text-xs font-normal text-[#141413] bg-white hover:bg-[#F5F5F3] hover:border-[#141413] transition-colors cursor-pointer inline-flex items-center gap-1.5 select-none shadow-2xs"
                          aria-expanded={activeDropdownId === rep.id}
                        >
                          <span>Actions</span>
                          <ChevronDown className={`w-3.5 h-3.5 text-[#6E6E69] transition-transform duration-150 ${activeDropdownId === rep.id ? "rotate-180" : ""}`} />
                        </button>

                        {activeDropdownId === rep.id && (
                          <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white border border-[#E8E8E3] shadow-lg py-1.5 z-50 text-left">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDropdownId(null);
                                handleOpenDetail(rep);
                              }}
                              className="w-full px-3.5 py-2 text-xs text-[#141413] hover:bg-[#F7F6F2] flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#6E6E69]" />
                              <span>View Details</span>
                            </button>

                            {rep.status === "pending" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    handleResolveDirect(rep);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-[#141413] hover:bg-green-50 hover:text-green-700 flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                  <span>Mark Resolved</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    setHideTarget(rep);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-[#141413] hover:bg-neutral-100 flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <EyeOff className="w-3.5 h-3.5 text-[#6E6E69]" />
                                  <span>Hide Content</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    setDismissTarget(rep);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-[#141413] hover:bg-neutral-100 flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <XCircle className="w-3.5 h-3.5 text-[#6E6E69]" />
                                  <span>Dismiss</span>
                                </button>
                              </>
                            )}

                            <div className="border-t border-[#F0F0EB] my-1" />

                            <button
                              type="button"
                              onClick={() => {
                                setActiveDropdownId(null);
                                setRemoveTarget(rep);
                              }}
                              className="w-full px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                              <span>Remove Artwork</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveDropdownId(null);
                                setSuspendTarget(rep);
                              }}
                              className="w-full px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              <UserX className="w-3.5 h-3.5 text-red-600" />
                              <span>Suspend User</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-[#6E6E69]">
              Showing {Math.min((currentPage - 1) * pageSize + 1, filteredReports.length)}–
              {Math.min(currentPage * pageSize, filteredReports.length)} of {filteredReports.length} reports
            </span>
            <Pagination
              currentPage={currentPage}
              totalItems={filteredReports.length}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. REPORT DETAIL DRAWER                                                   */}
      {/* ========================================================================= */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Report Details"
        description="Comprehensive curatorial audit and moderation review"
        maxWidth="lg"
        footer={
          selectedReport && (
            <div className="flex flex-wrap items-center justify-between gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDismissTarget(selectedReport);
                  setIsDrawerOpen(false);
                }}
              >
                Dismiss
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setHideTarget(selectedReport);
                    setIsDrawerOpen(false);
                  }}
                >
                  Hide Content
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setRemoveTarget(selectedReport);
                    setIsDrawerOpen(false);
                  }}
                >
                  Remove Artwork
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    handleResolveDirect(selectedReport);
                    setIsDrawerOpen(false);
                  }}
                >
                  Mark Resolved
                </Button>
              </div>
            </div>
          )
        }
      >
        {selectedReport && (
          <div className="space-y-6">
            {/* Artwork Preview Card */}
            <div className="rounded-xl border border-[#E8E8E3] overflow-hidden bg-[#FAF9F5]">
              <div className="relative aspect-16/9 w-full bg-[#E5E2DC]">
                <Image
                  src={selectedReport.artworkImageUrl || "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800"}
                  alt={selectedReport.artworkTitle || "Artwork"}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[#141413] text-base">
                    {selectedReport.artworkTitle}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#EFEFEF] text-[#4A4A48] capitalize">
                    {selectedReport.artworkStatus || "published"}
                  </span>
                </div>
                <p className="text-xs text-[#6E6E69]">
                  by <span className="font-medium text-[#141413]">{selectedReport.ownerName}</span>
                </p>
                <div className="pt-2 flex items-center gap-4 text-xs text-[#8A8A85]">
                  <span>{selectedReport.artworkMedium}</span>
                  <span>•</span>
                  <span>{selectedReport.artworkDimensions}</span>
                </div>
              </div>
            </div>

            {/* Report Metadata Specs */}
            <div className="rounded-xl border border-[#E8E8E3] p-4 space-y-3 bg-white text-xs">
              <div className="flex justify-between py-1 border-b border-[#F0F0EB]">
                <span className="text-[#8A8A85]">Reported by</span>
                <span className="font-medium text-[#141413]">
                  {selectedReport.reporterName} {selectedReport.reporterEmail && `(${selectedReport.reporterEmail})`}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0F0EB]">
                <span className="text-[#8A8A85]">Artwork Owner</span>
                <span className="font-medium text-[#141413]">
                  {selectedReport.ownerName} {selectedReport.ownerEmail && `(${selectedReport.ownerEmail})`}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0F0EB]">
                <span className="text-[#8A8A85]">Report Date</span>
                <span className="font-medium text-[#141413]">
                  {formatDate(selectedReport.createdAt)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0F0EB]">
                <span className="text-[#8A8A85]">Report Status</span>
                <div>{renderStatusBadge(selectedReport.status)}</div>
              </div>
              {selectedReport.moderationAction && (
                <div className="flex justify-between py-1 border-b border-[#F0F0EB]">
                  <span className="text-[#8A8A85]">Moderation Action</span>
                  <span className="font-medium text-[#28633B]">{selectedReport.moderationAction}</span>
                </div>
              )}
            </div>

            {/* Reason & Additional Details */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#141413] uppercase tracking-wider">
                Reason for report
              </span>
              <div className="p-3 rounded-lg border border-[#ECDDBB] bg-[#FAF5EC] text-xs font-medium text-[#865E16]">
                {selectedReport.reason}
              </div>
            </div>

            {selectedReport.details && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#141413] uppercase tracking-wider">
                  Reporter Message / Details
                </span>
                <div className="p-3.5 rounded-lg border border-[#E8E8E3] bg-[#FAFAF8] text-xs text-[#52524E] leading-relaxed">
                  {selectedReport.details}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* ========================================================================= */}
      {/* 5. MODERATION CONFIRMATION MODALS                                         */}
      {/* ========================================================================= */}

      {/* 1. Dismiss Modal */}
      <Modal
        isOpen={Boolean(dismissTarget)}
        onClose={() => setDismissTarget(null)}
        title="Dismiss report?"
        description="This will mark the report as dismissed without taking moderation action on the artwork."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDismissTarget(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirmDismiss} isLoading={isActionLoading}>
              Dismiss Report
            </Button>
          </>
        }
      >
        <p className="text-xs text-[#6E6E69] leading-relaxed">
          The reported artwork <span className="font-medium text-[#141413]">"{dismissTarget?.artworkTitle}"</span> will remain visible in the public catalog, and the report will be archived as dismissed.
        </p>
      </Modal>

      {/* 2. Hide Content Modal */}
      <Modal
        isOpen={Boolean(hideTarget)}
        onClose={() => setHideTarget(null)}
        title="Hide this artwork?"
        description="The artwork will no longer be publicly visible, but it will remain in the system."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setHideTarget(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirmHide} isLoading={isActionLoading}>
              Hide Artwork
            </Button>
          </>
        }
      >
        <p className="text-xs text-[#6E6E69] leading-relaxed">
          Artwork <span className="font-medium text-[#141413]">"{hideTarget?.artworkTitle}"</span> by <span className="font-medium text-[#141413]">{hideTarget?.ownerName}</span> will be switched to draft status and hidden from public discovery.
        </p>
      </Modal>

      {/* 3. Remove Artwork Modal */}
      <Modal
        isOpen={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        title="Remove artwork?"
        description="This action will remove the artwork from public availability. This action may affect the creator and cannot be easily reversed."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmRemove} isLoading={isActionLoading}>
              Remove Artwork
            </Button>
          </>
        }
      >
        <p className="text-xs text-[#6E6E69] leading-relaxed">
          Are you sure you want to permanently remove <span className="font-medium text-[#141413]">"{removeTarget?.artworkTitle}"</span> from the catalog?
        </p>
      </Modal>

      {/* 4. Suspend User Modal */}
      <Modal
        isOpen={Boolean(suspendTarget)}
        onClose={() => setSuspendTarget(null)}
        title="Suspend user?"
        description="Restrict access for this creator account."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setSuspendTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmSuspend} isLoading={isActionLoading}>
              Suspend User
            </Button>
          </>
        }
      >
        {suspendTarget && (
          <div className="space-y-3 text-xs text-[#6E6E69]">
            <div className="p-3 rounded-lg border border-[#E8E8E3] bg-[#FAFAF8] space-y-1.5">
              <p>
                <span className="font-semibold text-[#141413]">User:</span> {suspendTarget.ownerName}
              </p>
              <p>
                <span className="font-semibold text-[#141413]">Reason:</span> {suspendTarget.reason}
              </p>
              <p>
                <span className="font-semibold text-[#141413]">Reported artwork:</span> {suspendTarget.artworkTitle}
              </p>
            </div>
            <p className="leading-relaxed">
              This will suspend the user's account and restrict them from publishing or managing artworks until reviewed.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
