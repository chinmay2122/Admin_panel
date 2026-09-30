"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
import { Creator, CreatorStatus, UserPlan } from "@/lib/types";
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
import { updateCreatorAction } from "@/app/admin/actions";

interface CreatorsClientProps {
  initialCreators: Creator[];
  disciplines: string[];
}

type SortField = "name" | "discipline" | "plan" | "status" | "createdAt";
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

export function CreatorsClient({
  initialCreators,
  disciplines,
}: CreatorsClientProps) {
  const toast = useToast();
  const searchParams = useSearchParams();
  const initialStatusParam = searchParams.get("status") || "all";

  const [creators, setCreators] = useState<Creator[]>(initialCreators);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState("all");
  const [selectedPlan, setSelectedPlan] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState(initialStatusParam);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Sorting
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Drawer
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
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
  const filteredCreators = useMemo(() => {
    return creators.filter((creator) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = creator.name.toLowerCase().includes(q);
        const matchesDiscipline = creator.discipline.toLowerCase().includes(q);
        if (!matchesName && !matchesDiscipline) return false;
      }

      // Discipline filter
      if (
        selectedDiscipline !== "all" &&
        creator.discipline !== selectedDiscipline
      ) {
        return false;
      }

      // Plan filter
      if (selectedPlan !== "all" && creator.plan !== selectedPlan) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "all" && creator.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [creators, searchQuery, selectedDiscipline, selectedPlan, selectedStatus]);

  // Sorting
  const sortedCreators = useMemo(() => {
    return [...filteredCreators].sort((a, b) => {
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
  }, [filteredCreators, sortField, sortDirection]);

  // Pagination
  const paginatedCreators = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCreators.slice(start, start + pageSize);
  }, [sortedCreators, currentPage, pageSize]);

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

  const handleRowClick = (creator: Creator) => {
    setSelectedCreator(creator);
    setIsDrawerOpen(true);
  };

  // Drawer action: Approve pending creator (optimistic)
  const handleApproveCreator = async () => {
    if (!selectedCreator) return;
    const creatorName = selectedCreator.name;
    const previous = { ...selectedCreator };
    const updated = { ...selectedCreator, status: "active" as CreatorStatus };

    setSelectedCreator(updated);
    setCreators((prev) =>
      prev.map((c) => (c.id === selectedCreator.id ? updated : c))
    );

    setIsUpdating(true);
    try {
      const res = await updateCreatorAction(selectedCreator.id, {
        status: "active",
      });
      if (!res.success) {
        setSelectedCreator(previous);
        setCreators((prev) =>
          prev.map((c) => (c.id === selectedCreator.id ? previous : c))
        );
        toast.error("Failed to approve creator", res.error || "Please try again.");
      } else {
        toast.success("Creator approved", `${creatorName} is now an active creator.`);
      }
    } catch {
      setSelectedCreator(previous);
      setCreators((prev) =>
        prev.map((c) => (c.id === selectedCreator.id ? previous : c))
      );
      toast.error("Network error", "Could not complete approval.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Drawer action: Suspend or Reactivate (optimistic)
  const handleToggleSuspend = async () => {
    if (!selectedCreator) return;
    const creatorName = selectedCreator.name;
    const previous = { ...selectedCreator };
    const nextStatus: CreatorStatus =
      selectedCreator.status === "active" ? "suspended" : "active";
    const updated = { ...selectedCreator, status: nextStatus };

    setSelectedCreator(updated);
    setCreators((prev) =>
      prev.map((c) => (c.id === selectedCreator.id ? updated : c))
    );

    setIsUpdating(true);
    try {
      const res = await updateCreatorAction(selectedCreator.id, {
        status: nextStatus,
      });
      if (!res.success) {
        setSelectedCreator(previous);
        setCreators((prev) =>
          prev.map((c) => (c.id === selectedCreator.id ? previous : c))
        );
        toast.error("Failed to update status", res.error || "Please try again.");
      } else {
        toast.success(
          nextStatus === "suspended" ? "Creator suspended" : "Creator reactivated",
          `${creatorName} is now ${nextStatus}.`
        );
      }
    } catch {
      setSelectedCreator(previous);
      setCreators((prev) =>
        prev.map((c) => (c.id === selectedCreator.id ? previous : c))
      );
      toast.error("Network error", "Could not update creator status.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Drawer action: Change plan (optimistic)
  const handleChangePlan = async (newPlan: UserPlan) => {
    if (!selectedCreator || selectedCreator.plan === newPlan) return;
    const creatorName = selectedCreator.name;
    const previous = { ...selectedCreator };
    const updated = { ...selectedCreator, plan: newPlan };

    setSelectedCreator(updated);
    setCreators((prev) =>
      prev.map((c) => (c.id === selectedCreator.id ? updated : c))
    );

    setIsUpdating(true);
    try {
      const res = await updateCreatorAction(selectedCreator.id, {
        plan: newPlan,
      });
      if (!res.success) {
        setSelectedCreator(previous);
        setCreators((prev) =>
          prev.map((c) => (c.id === selectedCreator.id ? previous : c))
        );
        toast.error("Failed to update plan", res.error || "Please try again.");
      } else {
        toast.success("Plan updated", `${creatorName} is now on the ${newPlan?.toUpperCase()} plan.`);
      }
    } catch {
      setSelectedCreator(previous);
      setCreators((prev) =>
        prev.map((c) => (c.id === selectedCreator.id ? previous : c))
      );
      toast.error("Network error", "Could not update plan.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter Bar configuration reusing FilterBar component
  const filterConfigs: FilterSelectConfig[] = [
    {
      id: "discipline",
      label: "Discipline",
      value: selectedDiscipline,
      onChange: (val) => {
        setSelectedDiscipline(val);
        setCurrentPage(1);
      },
      options: [
        { label: "All Disciplines", value: "all" },
        ...disciplines.map((d) => ({ label: d, value: d })),
      ],
    },
    {
      id: "plan",
      label: "Plan",
      value: selectedPlan,
      onChange: (val) => {
        setSelectedPlan(val);
        setCurrentPage(1);
      },
      options: [
        { label: "All Plans", value: "all" },
        { label: "Free", value: "free" },
        { label: "Elite", value: "elite" },
        { label: "Pro", value: "pro" },
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
    selectedDiscipline !== "all" ||
    selectedPlan !== "all" ||
    selectedStatus !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedDiscipline("all");
    setSelectedPlan("all");
    setSelectedStatus("all");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Title & Stats */}
      <div className="border-b border-[#E8E8E3] pb-5 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-medium tracking-tight text-[#141413]">
            Creators
          </h2>
          <p className="mt-1 text-xs md:text-sm text-[#6E6E69]">
            Curated studio roster, creator verification, and spotlight profiles.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#6E6E69]">
          <span>
            Total: <strong className="text-[#141413]">{creators.length}</strong>
          </span>
          <span>•</span>
          <span>
            Pending:{" "}
            <strong className="text-[#B8532F]">
              {creators.filter((c) => c.status === "pending").length}
            </strong>
          </span>
        </div>
      </div>

      {/* Reusable FilterBar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search creator or discipline..."
        filters={filterConfigs}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
      >
        <span className="text-xs text-[#71716D]">
          {sortedCreators.length} {sortedCreators.length === 1 ? "creator" : "creators"} found
        </span>
      </FilterBar>

      {/* Table Container */}
      {sortedCreators.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="w-5 h-5 text-[#8A8A85]" />}
          title="No creators found"
          description={
            hasActiveFilters
              ? "No creators match the current filter criteria. Try resetting your search or filters."
              : "No creators registered in the studio roster yet."
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
                    onClick={() => handleSort("name")}
                    className="group inline-flex items-center gap-1.5 hover:text-[#141413] cursor-pointer"
                  >
                    <span>Creator</span>
                    {renderSortIndicator("name")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("discipline")}
                    className="group inline-flex items-center gap-1.5 hover:text-[#141413] cursor-pointer"
                  >
                    <span>Discipline</span>
                    {renderSortIndicator("discipline")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("plan")}
                    className="group inline-flex items-center gap-1.5 hover:text-[#141413] cursor-pointer"
                  >
                    <span>Plan</span>
                    {renderSortIndicator("plan")}
                  </button>
                </TableHead>
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
              {paginatedCreators.map((creator) => (
                <TableRow
                  key={creator.id}
                  onClick={() => handleRowClick(creator)}
                  className="cursor-pointer"
                >
                  {/* Creator Name */}
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#EAEAE5] border border-[#DCDCD6] flex items-center justify-center text-xs font-semibold text-[#141413] shrink-0">
                        {creator.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-[#141413]">
                          {creator.name}
                        </p>
                        <p className="text-[11px] text-[#71716D]">
                          ID: {creator.id}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Discipline */}
                  <TableCell className="text-[#52524E]">
                    {creator.discipline}
                  </TableCell>

                  {/* Plan */}
                  <TableCell>
                    {creator.plan ? (
                      <Badge
                        variant={
                          creator.plan === "elite"
                            ? "warning"
                            : creator.plan === "pro"
                            ? "accent"
                            : "default"
                        }
                        size="sm"
                      >
                        {creator.plan}
                      </Badge>
                    ) : (
                      <span className="text-xs text-[#8A8A85]">—</span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge
                      variant={
                        creator.status === "active"
                          ? "success"
                          : creator.status === "pending"
                          ? "warning"
                          : "danger"
                      }
                      size="sm"
                      dot
                    >
                      {creator.status}
                    </Badge>
                  </TableCell>

                  {/* Joined Date */}
                  <TableCell className="text-xs text-[#6E6E69]">
                    {formatDate(creator.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Reusable Pagination */}
          <Pagination
            currentPage={currentPage}
            totalItems={sortedCreators.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      {/* Side Drawer: Reusing Drawer component for Creator details & actions */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedCreator?.name || "Creator Profile"}
        description="Curatorial review, plan tier, and studio permissions"
        footer={
          selectedCreator && (
            <div className="flex items-center justify-between w-full">
              {selectedCreator.status === "pending" ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApproveCreator}
                  isLoading={isUpdating}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Approve Creator
                </Button>
              ) : (
                <Button
                  variant={
                    selectedCreator.status === "active" ? "outline" : "primary"
                  }
                  size="sm"
                  onClick={handleToggleSuspend}
                  isLoading={isUpdating}
                  leftIcon={
                    selectedCreator.status === "active" ? (
                      <Ban className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {selectedCreator.status === "active"
                    ? "Suspend Creator"
                    : "Reactivate Creator"}
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
        {selectedCreator && (
          <div className="space-y-6">
            {/* Header in Drawer */}
            <div className="flex items-center gap-3.5 pb-5 border-b border-[#E8E8E3]">
              <div className="w-12 h-12 rounded-full bg-[#EAEAE5] border border-[#DCDCD6] flex items-center justify-center text-base font-semibold text-[#141413]">
                {selectedCreator.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-[#141413] truncate">
                  {selectedCreator.name}
                </h4>
                <p className="text-xs text-[#6E6E69] truncate">
                  {selectedCreator.discipline}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Badge
                    variant={
                      selectedCreator.status === "active"
                        ? "success"
                        : selectedCreator.status === "pending"
                        ? "warning"
                        : "danger"
                    }
                    size="sm"
                    dot
                  >
                    {selectedCreator.status}
                  </Badge>
                  {selectedCreator.plan && (
                    <Badge variant="accent" size="sm">
                      {selectedCreator.plan.toUpperCase()} Plan
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Action: Change Plan (Free / Elite / Pro) */}
            <div className="space-y-2.5 p-4 rounded-lg bg-[#FAFAF8] border border-[#E8E8E3]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#141413] flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#B8532F]" />
                  <span>Subscription Plan</span>
                </label>
                <span className="text-[11px] text-[#71716D]">
                  Current:{" "}
                  <strong className="capitalize text-[#141413]">
                    {selectedCreator.plan || "Free"}
                  </strong>
                </span>
              </div>
              <p className="text-[11px] text-[#6E6E69]">
                Assign creator tier to adjust commission allowances and featured
                curation placement.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {(["free", "elite", "pro"] as UserPlan[]).map((plan) => {
                  const isSelected = selectedCreator.plan === plan;
                  return (
                    <button
                      key={plan}
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleChangePlan(plan)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#141413] text-white border-[#141413]"
                          : "bg-white text-[#52524E] border-[#E8E8E3] hover:bg-[#F5F5F0]"
                      }`}
                    >
                      {plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Creator Metadata */}
            <div className="space-y-3 text-xs">
              <h5 className="font-medium text-[#141413] uppercase tracking-wider text-[11px] text-[#8A8A85]">
                Creator Dossier
              </h5>

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Creator ID</span>
                <span className="font-mono text-[11px] text-[#141413] bg-[#F5F5F0] px-1.5 py-0.5 rounded">
                  {selectedCreator.id}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Linked User ID</span>
                <span className="font-mono text-[11px] text-[#141413] bg-[#F5F5F0] px-1.5 py-0.5 rounded">
                  {selectedCreator.userId}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Discipline</span>
                <span className="font-medium text-[#141413]">
                  {selectedCreator.discipline}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Registered Date</span>
                <span className="font-medium text-[#141413]">
                  {formatDate(selectedCreator.createdAt)}
                </span>
              </div>
            </div>

            {/* Pending Notice if Pending */}
            {selectedCreator.status === "pending" && (
              <div className="p-3.5 rounded-lg bg-[#FAF5EC] border border-[#ECDDBB] text-xs text-[#865E16] space-y-1">
                <p className="font-medium">Curatorial Review Required</p>
                <p className="text-[11px] leading-relaxed">
                  This creator’s portfolio is in the onboarding queue. Approving
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
