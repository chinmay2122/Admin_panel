"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  CheckCircle2,
  Ban,
  Shield,
  Layers,
  Calendar,
  Award,
} from "lucide-react";
import { Collector, CollectorStatus } from "@/lib/types";
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
import { ExportDropdown } from "@/components/admin/ExportDropdown";
import { FilterBar, FilterSelectConfig } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui";
import { updateCollectorAction } from "@/app/admin/actions";

interface CollectorsClientProps {
  initialCollectors: Collector[];
  preferences: string[];
}

type SortField = "name" | "preferences" | "status" | "createdAt";
type SortDirection = "asc" | "desc";

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

export function CollectorsClient({
  initialCollectors,
  preferences,
}: CollectorsClientProps) {
  const toast = useToast();
  const searchParams = useSearchParams();
  const initialStatusParam = searchParams.get("status") || "all";

  const [Collectors, setCollectors] = useState<Collector[]>(initialCollectors);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedpreferences, setSelectedpreferences] = useState("all");
  const [selectedPlan, setSelectedPlan] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState(initialStatusParam);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Sorting
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Drawer
  const [selectedCollector, setSelectedCollector] = useState<Collector | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Update status filter if searchParams change
  useEffect(() => {
    const param = searchParams.get("status");
    if (param) {
      setSelectedStatus(param);
    }
  }, [searchParams]);

  // Filtering
  const filteredCollectors = useMemo(() => {
    return Collectors.filter((Collector) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = Collector.name.toLowerCase().includes(q);
        const matchespreferences = Collector.preferences?.toLowerCase().includes(q);
        if (!matchesName && !matchespreferences) return false;
      }

      // preferences filter
      if (
        selectedpreferences !== "all" &&
        Collector.preferences !== selectedpreferences
      ) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "all" && Collector.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [Collectors, searchQuery, selectedpreferences, selectedStatus]);

  // Sorting
  const sortedCollectors = useMemo(() => {
    return [...filteredCollectors].sort((a, b) => {
      const aVal = a[sortField] || "";
      const bVal = b[sortField] || "";

      if (sortField === "createdAt") {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortDirection === "asc" ? timeA - timeB : timeB - timeA;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return 0;
    });
  }, [filteredCollectors, sortField, sortDirection]);

  // Pagination
  const paginatedCollectors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCollectors.slice(start, start + pageSize);
  }, [sortedCollectors, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown className="w-3 h-3 text-[#A0A09B] opacity-0 group-hover:opacity-100 transition-opacity" />
      );
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3 h-3 text-[#B8532F]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#B8532F]" />
    );
  };

  const router = useRouter();

  const handleRowClick = (collector: Collector) => {
    router.push(`/admin/collectors/${collector.id}`);
  };

  // Drawer action: Approve pending Collector (optimistic)
  const handleApproveCollector = async () => {
    if (!selectedCollector) return;
    const CollectorName = selectedCollector.name;
    const previous = { ...selectedCollector };
    const updated = { ...selectedCollector, status: "active" as CollectorStatus };

    setSelectedCollector(updated);
    setCollectors((prev) =>
      prev.map((c) => (c.id === selectedCollector.id ? updated : c))
    );

    setIsUpdating(true);
    try {
      const res = await updateCollectorAction(selectedCollector.id, {
        status: "active",
      });
      if (!res.success) {
        setSelectedCollector(previous);
        setCollectors((prev) =>
          prev.map((c) => (c.id === selectedCollector.id ? previous : c))
        );
        toast.error("Failed to approve Collector", res.error || "Please try again.");
      } else {
        toast.success("Collector approved", `${CollectorName} is now an active Collector.`);
      }
    } catch {
      setSelectedCollector(previous);
      setCollectors((prev) =>
        prev.map((c) => (c.id === selectedCollector.id ? previous : c))
      );
      toast.error("Network error", "Could not complete approval.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Drawer action: Suspend or Reactivate (optimistic)
  const handleToggleSuspend = async () => {
    if (!selectedCollector) return;
    const CollectorName = selectedCollector.name;
    const previous = { ...selectedCollector };
    const nextStatus: CollectorStatus =
      selectedCollector.status === "active" ? "suspended" : "active";
    const updated = { ...selectedCollector, status: nextStatus };

    setSelectedCollector(updated);
    setCollectors((prev) =>
      prev.map((c) => (c.id === selectedCollector.id ? updated : c))
    );

    setIsUpdating(true);
    try {
      const res = await updateCollectorAction(selectedCollector.id, {
        status: nextStatus,
      });
      if (!res.success) {
        setSelectedCollector(previous);
        setCollectors((prev) =>
          prev.map((c) => (c.id === selectedCollector.id ? previous : c))
        );
        toast.error("Failed to update status", res.error || "Please try again.");
      } else {
        toast.success(
          nextStatus === "suspended" ? "Collector suspended" : "Collector reactivated",
          `${CollectorName} is now ${nextStatus}.`
        );
      }
    } catch {
      setSelectedCollector(previous);
      setCollectors((prev) =>
        prev.map((c) => (c.id === selectedCollector.id ? previous : c))
      );
      toast.error("Network error", "Could not update Collector status.");
    } finally {
      setIsUpdating(false);
    }
  };



  // Filter Bar configuration reusing FilterBar component
  const filterConfigs: FilterSelectConfig[] = [
    {
      id: "preferences",
      label: "preferences",
      value: selectedpreferences,
      onChange: (val) => {
        setSelectedpreferences(val);
        setCurrentPage(1);
      },
      options: [
        { label: "All preferences", value: "all" },
        ...preferences.map((d) => ({ label: d, value: d })),
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
        { label: "Active", value: "active" },
        { label: "Pending", value: "pending" },
        { label: "Suspended", value: "suspended" },
      ],
    },
  ];

  const hasActiveFilters =
    Boolean(searchQuery) ||
    selectedpreferences !== "all" ||
    selectedStatus !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedpreferences("all");
    setSelectedStatus("all");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Title & Stats */}
      <div className="border-b border-[#E8E8E3] pb-5 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-medium tracking-tight text-[#141413]">
            Collectors
          </h2>
          <p className="mt-1 text-xs md:text-sm text-[#6E6E69]">
            Curated studio roster, Collector verification, and spotlight profiles.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          <ExportDropdown exportType="collectors" filters={{ query: searchQuery, status: selectedStatus === "all" ? undefined : selectedStatus}} />
          <div className="flex items-center gap-3 text-xs text-[#6E6E69]">
            <span>
              Total: <strong className="text-[#141413]">{Collectors.length}</strong>
            </span>
            <span>•</span>
            <span>
              Pending:{" "}
              <strong className="text-[#B8532F]">
                {Collectors.filter((c) => c.status === "pending").length}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Reusable FilterBar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search Collector or preferences..."
        filters={filterConfigs}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
      >
        <span className="text-xs text-[#71716D]">
          {sortedCollectors.length} {sortedCollectors.length === 1 ? "Collector" : "Collectors"} found
        </span>
      </FilterBar>

      {/* Table Container */}
      {sortedCollectors.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="w-5 h-5 text-[#8A8A85]" />}
          title="No Collectors found"
          description={
            hasActiveFilters
              ? "No Collectors match the current filter criteria. Try resetting your search or filters."
              : "No Collectors registered in the studio roster yet."
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
                <TableHead>
                  <button
                    onClick={() => handleSort("status")}
                    className="group inline-flex items-center gap-1.5 hover:text-[#141413] cursor-pointer"
                  >
                    <span>Status</span>
                    {renderSortIndicator("status")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("createdAt")}
                    className="group inline-flex items-center gap-1.5 hover:text-[#141413] cursor-pointer"
                  >
                    <span>Joined</span>
                    {renderSortIndicator("createdAt")}
                  </button>
                </TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {paginatedCollectors.map((Collector) => (
                <TableRow
                  key={Collector.id}
                  onClick={() => handleRowClick(Collector)}
                  className="cursor-pointer"
                >
                  {/* Collector Name */}
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#EAEAE5] border border-[#DCDCD6] flex items-center justify-center text-xs font-semibold text-[#141413] shrink-0">
                        {Collector.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-[#141413]">
                          {Collector.name}
                        </p>
                        <p className="text-[11px] text-[#71716D]">
                          ID: {Collector.id}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* preferences */}
                  <TableCell className="text-[#52524E]">
                    {Collector.preferences}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge
                      variant={
                        Collector.status === "active"
                          ? "success"
                          : Collector.status === "pending"
                          ? "warning"
                          : "danger"
                      }
                      size="sm"
                      dot
                    >
                      {Collector.status}
                    </Badge>
                  </TableCell>

                  {/* Joined Date */}
                  <TableCell className="text-xs text-[#6E6E69]">
                    {formatDate(Collector.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Reusable Pagination */}
          <Pagination
            currentPage={currentPage}
            totalItems={sortedCollectors.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      {/* Side Drawer: Reusing Drawer component for Collector details & actions */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedCollector?.name || "Collector Profile"}
        description="Curatorial review and studio permissions"
        footer={
          selectedCollector && (
            <div className="flex items-center justify-between w-full">
              {selectedCollector.status === "pending" ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApproveCollector}
                  isLoading={isUpdating}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Approve Collector
                </Button>
              ) : (
                <Button
                  variant={
                    selectedCollector.status === "active" ? "outline" : "primary"
                  }
                  size="sm"
                  onClick={handleToggleSuspend}
                  isLoading={isUpdating}
                  leftIcon={
                    selectedCollector.status === "active" ? (
                      <Ban className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {selectedCollector.status === "active"
                    ? "Suspend Collector"
                    : "Reactivate Collector"}
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDrawerOpen(false)}
              >
                Done
              </Button>
            </div>
          )
        }
      >
        {selectedCollector && (
          <div className="space-y-6">
            {/* Header in Drawer */}
            <div className="flex items-center gap-3.5 pb-5 border-b border-[#E8E8E3]">
              {selectedCollector.profilePicUrl ? (
                <img src={selectedCollector.profilePicUrl} alt={selectedCollector.name} className="w-12 h-12 rounded-full object-cover border border-[#DCDCD6]" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#EAEAE5] border border-[#DCDCD6] flex items-center justify-center text-base font-semibold text-[#141413]">
                  {selectedCollector.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-[#141413] truncate">
                  {selectedCollector.name}
                </h4>
                <p className="text-xs text-[#6E6E69] truncate">
                  {selectedCollector.preferences}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Badge
                    variant={
                      selectedCollector.status === "active"
                        ? "success"
                        : selectedCollector.status === "pending"
                        ? "warning"
                        : "danger"
                    }
                    size="sm"
                    dot
                  >
                    {selectedCollector.status}
                  </Badge>
                </div>
              </div>
            </div>


            {/* Collector Metadata */}
            <div className="space-y-3 text-xs">
              <h5 className="font-medium text-[#141413] uppercase tracking-wider text-[11px] text-[#8A8A85]">
                Collector Dossier
              </h5>

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Collector ID</span>
                <span className="font-mono text-[11px] text-[#141413] bg-[#F5F5F0] px-1.5 py-0.5 rounded">
                  {selectedCollector.id}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Linked User ID</span>
                <span className="font-mono text-[11px] text-[#141413] bg-[#F5F5F0] px-1.5 py-0.5 rounded">
                  {selectedCollector.userId}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Preferences</span>
                <span className="font-medium text-[#141413]">
                  {selectedCollector.preferences || "Various"}
                </span>
              </div>

              {selectedCollector.email && (
                <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                  <span className="text-[#6E6E69]">Email</span>
                  <span className="font-medium text-[#141413]">
                    {selectedCollector.email}
                  </span>
                </div>
              )}

              {selectedCollector.phoneNumber && (
                <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                  <span className="text-[#6E6E69]">Phone</span>
                  <span className="font-medium text-[#141413]">
                    {selectedCollector.phoneNumber}
                  </span>
                </div>
              )}

              {selectedCollector.location && (
                <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                  <span className="text-[#6E6E69]">Location</span>
                  <span className="font-medium text-[#141413]">
                    {selectedCollector.location}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Registered Date</span>
                <span className="font-medium text-[#141413]">
                  {formatDate(selectedCollector.createdAt)}
                </span>
              </div>
            </div>

            {/* Pending Notice if Pending */}
            {selectedCollector.status === "pending" && (
              <div className="p-3.5 rounded-lg bg-[#FAF5EC] border border-[#ECDDBB] text-xs text-[#865E16] space-y-1">
                <p className="font-medium">Curatorial Review Required</p>
                <p className="text-[11px] leading-relaxed">
                  This Collector’s portfolio is in the onboarding queue. Approving
                  them will unlock public showcase permissions and exhibition
                  eligibility.
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
