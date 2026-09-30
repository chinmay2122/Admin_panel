"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Inbox,
  User,
  Briefcase,
  Calendar,
  CheckCircle,
  XCircle,
  Star,
  ExternalLink,
  Shield,
  RotateCcw,
} from "lucide-react";
import { Application, ApplicationStatus, Job } from "@/lib/types";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { FilterBar, FilterSelectConfig } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui";
import { updateApplicationAction } from "@/app/admin/actions";

interface ApplicationsClientProps {
  initialApplications: Application[];
  availableJobs: Job[];
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

export function ApplicationsClient({
  initialApplications,
  availableJobs,
}: ApplicationsClientProps) {
  const toast = useToast();
  const searchParams = useSearchParams();
  const initialJobId = searchParams.get("jobId") || "all";
  const initialStatus = searchParams.get("status") || "all";

  const [applications, setApplications] =
    useState<Application[]>(initialApplications);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Drawer state
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Sync state if searchParams change
  useEffect(() => {
    const jobParam = searchParams.get("jobId");
    if (jobParam) {
      setSelectedJobId(jobParam);
    }
    const statusParam = searchParams.get("status");
    if (statusParam) {
      setSelectedStatus(statusParam);
    }
  }, [searchParams]);

  // Filtering
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        if (
          !app.creatorName.toLowerCase().includes(q) &&
          !app.jobTitle.toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      if (selectedJobId !== "all" && app.jobId !== selectedJobId) {
        return false;
      }

      if (selectedStatus !== "all" && app.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [applications, searchQuery, selectedJobId, selectedStatus]);

  // Pagination
  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredApplications.slice(start, start + pageSize);
  }, [filteredApplications, currentPage, pageSize]);

  // Status Badge Component
  const renderStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case "accepted":
        return (
          <Badge variant="success" size="sm" dot>
            Accepted
          </Badge>
        );
      case "shortlisted":
        return (
          <Badge variant="accent" size="sm" dot>
            Shortlisted
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="warning" size="sm" dot>
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="danger" size="sm" dot>
            Rejected
          </Badge>
        );
    }
  };

  // Open Drawer
  const handleRowClick = (app: Application) => {
    setSelectedApplication(app);
    setIsDrawerOpen(true);
  };

  // Update Status Action (optimistic)
  const handleUpdateStatus = async (newStatus: ApplicationStatus) => {
    if (!selectedApplication) return;
    const applicantName = selectedApplication.creatorName;
    const previous = { ...selectedApplication };
    const updated = { ...selectedApplication, status: newStatus };

    setSelectedApplication(updated);
    setApplications((prev) =>
      prev.map((a) => (a.id === selectedApplication.id ? updated : a))
    );

    setIsUpdatingStatus(true);
    try {
      const res = await updateApplicationAction(selectedApplication.id, {
        status: newStatus,
      });
      if (!res.success) {
        setSelectedApplication(previous);
        setApplications((prev) =>
          prev.map((a) => (a.id === selectedApplication.id ? previous : a))
        );
        toast.error("Failed to update status", res.error || "Please try again.");
      } else {
        toast.success(
          "Application updated",
          `${applicantName}'s application marked as ${newStatus}.`
        );
      }
    } catch {
      setSelectedApplication(previous);
      setApplications((prev) =>
        prev.map((a) => (a.id === selectedApplication.id ? previous : a))
      );
      toast.error("Network error", "Could not update application status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // FilterBar configuration
  const filterConfigs: FilterSelectConfig[] = [
    {
      id: "job",
      label: "Opportunity",
      value: selectedJobId,
      onChange: (val) => {
        setSelectedJobId(val);
        setCurrentPage(1);
      },
      options: [
        { label: "All Opportunities", value: "all" },
        ...availableJobs.map((j) => ({ label: j.title, value: j.id })),
      ],
    },
    {
      id: "status",
      label: "Status",
      value: selectedStatus,
      onChange: (val) => {
        setSelectedStatus(val);
        setCurrentPage(1);
      },
      options: [
        { label: "All Statuses", value: "all" },
        { label: "Pending", value: "pending" },
        { label: "Shortlisted", value: "shortlisted" },
        { label: "Accepted", value: "accepted" },
        { label: "Rejected", value: "rejected" },
      ],
    },
  ];

  const hasActiveFilters =
    Boolean(searchQuery) || selectedJobId !== "all" || selectedStatus !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedJobId("all");
    setSelectedStatus("all");
    setCurrentPage(1);
  };

  const selectedJobObject = availableJobs.find((j) => j.id === selectedJobId);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Title */}
      <div className="border-b border-[#E8E8E3] pb-5 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-medium tracking-tight text-[#141413]">
            Applications
          </h2>
          <p className="mt-1 text-xs md:text-sm text-[#6E6E69]">
            Review candidate portfolios, open call submissions, and curatorial approvals.
          </p>
        </div>

        {selectedJobObject && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FAF5EC] border border-[#ECDDBB] text-xs text-[#865E16]">
            <span>Filtered to:</span>
            <strong className="text-[#141413]">{selectedJobObject.title}</strong>
            <button
              onClick={() => setSelectedJobId("all")}
              className="text-[#865E16] hover:text-[#141413] ml-1"
              title="Remove filter"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* FilterBar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search applicant or opportunity..."
        filters={filterConfigs}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
      >
        <span className="text-xs text-[#71716D]">
          {filteredApplications.length}{" "}
          {filteredApplications.length === 1 ? "application" : "applications"}
        </span>
      </FilterBar>

      {/* Applications Table */}
      {filteredApplications.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-5 h-5 text-[#8A8A85]" />}
          title="No applications found"
          description={
            hasActiveFilters
              ? "No candidate applications match the selected criteria."
              : "No submissions have been received for studio listings yet."
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Reset Filters
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Applicant</TableHead>
                <TableHead>Opportunity / Listing</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied Date</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {paginatedApplications.map((app) => (
                <TableRow
                  key={app.id}
                  onClick={() => handleRowClick(app)}
                  className="cursor-pointer"
                >
                  {/* Applicant */}
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#EAEAE5] border border-[#DCDCD6] flex items-center justify-center text-xs font-semibold text-[#141413] shrink-0">
                        {app.creatorName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-[#141413]">
                          {app.creatorName}
                        </p>
                        <p className="text-[11px] text-[#71716D]">
                          ID: {app.creatorId}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Job */}
                  <TableCell className="text-[#52524E]">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#8A8A85] shrink-0" />
                      <span className="font-medium text-[#141413]">
                        {app.jobTitle}
                      </span>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>{renderStatusBadge(app.status)}</TableCell>

                  {/* Applied Date */}
                  <TableCell className="text-xs text-[#6E6E69]">
                    {formatDate(app.appliedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredApplications.length}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      )}

      {/* APPLICANT DETAIL DRAWER */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedApplication?.creatorName || "Candidate Dossier"}
        description="Curatorial review and admission decision"
        footer={
          selectedApplication && (
            <div className="flex items-center justify-between w-full">
              <Button
                variant={selectedApplication.status === "rejected" ? "outline" : "danger"}
                size="sm"
                onClick={() => handleUpdateStatus("rejected")}
                isLoading={isUpdatingStatus}
                leftIcon={<XCircle className="w-3.5 h-3.5" />}
              >
                Reject
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateStatus("shortlisted")}
                  isLoading={isUpdatingStatus}
                  leftIcon={<Star className="w-3.5 h-3.5 text-[#B8532F]" />}
                >
                  Shortlist
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleUpdateStatus("accepted")}
                  isLoading={isUpdatingStatus}
                  leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                >
                  Accept
                </Button>
              </div>
            </div>
          )
        }
      >
        {selectedApplication && (
          <div className="space-y-6">
            {/* Candidate Header in Drawer */}
            <div className="flex items-center gap-3.5 pb-5 border-b border-[#E8E8E3]">
              <div className="w-12 h-12 rounded-full bg-[#EAEAE5] border border-[#DCDCD6] flex items-center justify-center text-base font-semibold text-[#141413]">
                {selectedApplication.creatorName.charAt(0)}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-[#141413] truncate">
                  {selectedApplication.creatorName}
                </h4>
                <p className="text-xs text-[#6E6E69] truncate">
                  Applying for {selectedApplication.jobTitle}
                </p>
                <div className="mt-1.5">
                  {renderStatusBadge(selectedApplication.status)}
                </div>
              </div>
            </div>

            {/* Candidate Statement / Dossier Card */}
            <div className="p-4 bg-[#FAFAF8] border border-[#E8E8E3] rounded-lg space-y-2">
              <h5 className="text-xs font-medium text-[#141413]">
                Candidate Statement
              </h5>
              <p className="text-xs text-[#52524E] leading-relaxed">
                "My practice bridges spatial physical installations with acoustic
                membrane sculptures. I am interested in investigating vernacular
                pigments and architectural terracotta forms in collaboration with
                the iRAS Studio collective."
              </p>
              <div className="pt-2 flex items-center justify-between text-[11px] text-[#71716D]">
                <span>Portfolio Verification: Verified</span>
                <span className="text-[#B8532F] font-medium">Rating: 4.8 / 5.0</span>
              </div>
            </div>

            {/* Application Specifications */}
            <div className="space-y-3 text-xs">
              <h5 className="font-medium text-[#141413] uppercase tracking-wider text-[11px] text-[#8A8A85]">
                Submission Details
              </h5>

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Application ID</span>
                <span className="font-mono text-[11px] text-[#141413] bg-[#F5F5F0] px-1.5 py-0.5 rounded">
                  {selectedApplication.id}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Creator ID</span>
                <span className="font-mono text-[11px] text-[#141413] bg-[#F5F5F0] px-1.5 py-0.5 rounded">
                  {selectedApplication.creatorId}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Target Opportunity</span>
                <span className="font-medium text-[#141413]">
                  {selectedApplication.jobTitle}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Submission Timestamp</span>
                <span className="font-medium text-[#141413]">
                  {formatDate(selectedApplication.appliedAt)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
