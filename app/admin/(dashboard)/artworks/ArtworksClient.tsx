"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  LayoutGrid,
  List,
  Check,
  X,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  Archive,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Palette,
  CheckSquare,
  Square,
  MinusSquare,
  Layers,
  Sparkles,
} from "lucide-react";
import { Artwork, ArtworkStatus } from "@/lib/types";
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
import { Modal } from "@/components/ui/Modal";
import { FilterBar, FilterSelectConfig } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui";
import {
  updateArtworkAction,
  bulkUpdateArtworksAction,
  deleteArtworkAction,
} from "@/app/admin/actions";

interface ArtworksClientProps {
  initialArtworks: Artwork[];
  distinctCreators: string[];
  distinctMedia: string[];
}

type ViewMode = "grid" | "table";
type SortField = "title" | "creatorName" | "price" | "status" | "createdAt";
type SortDirection = "asc" | "desc";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
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

export function ArtworksClient({
  initialArtworks,
  distinctCreators,
  distinctMedia,
}: ArtworksClientProps) {
  const toast = useToast();
  const searchParams = useSearchParams();
  const initialStatusParam = searchParams.get("status") || "all";

  const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatusParam);
  const [creatorFilter, setCreatorFilter] = useState("all");
  const [mediumFilter, setMediumFilter] = useState("all");

  // Sorting & Pagination
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Detail Drawer state
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Reject with reason state
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Edit price/title state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // URL param update sync
  useEffect(() => {
    const param = searchParams.get("status");
    if (param) {
      setStatusFilter(param);
    }
  }, [searchParams]);

  // Sync edit form with selected artwork
  useEffect(() => {
    if (selectedArtwork) {
      setEditTitle(selectedArtwork.title);
      setEditPrice(String(selectedArtwork.price));
      setShowRejectForm(false);
      setRejectReason("");
      setIsEditing(false);
    }
  }, [selectedArtwork]);

  // Filtering
  const filteredArtworks = useMemo(() => {
    return artworks.filter((art) => {
      // Search by title
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        if (
          !art.title.toLowerCase().includes(q) &&
          !art.creatorName.toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      // Status
      if (statusFilter !== "all" && art.status !== statusFilter) {
        return false;
      }

      // Creator
      if (creatorFilter !== "all" && art.creatorName !== creatorFilter) {
        return false;
      }

      // Medium
      if (
        mediumFilter !== "all" &&
        !art.medium.toLowerCase().includes(mediumFilter.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [artworks, searchQuery, statusFilter, creatorFilter, mediumFilter]);

  // Sorting
  const sortedArtworks = useMemo(() => {
    return [...filteredArtworks].sort((a, b) => {
      if (sortField === "price") {
        return sortDirection === "asc" ? a.price - b.price : b.price - a.price;
      }

      if (sortField === "createdAt") {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortDirection === "asc" ? timeA - timeB : timeB - timeA;
      }

      const aVal = a[sortField] || "";
      const bVal = b[sortField] || "";
      return sortDirection === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredArtworks, sortField, sortDirection]);

  // Pagination
  const paginatedArtworks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedArtworks.slice(start, start + pageSize);
  }, [sortedArtworks, currentPage, pageSize]);

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

  const openDetailDrawer = (art: Artwork) => {
    setSelectedArtwork(art);
    setIsDrawerOpen(true);
  };

  // Status Badge Component adhering to consistent app styling
  const renderStatusBadge = (status: ArtworkStatus) => {
    switch (status) {
      case "published":
        return (
          <Badge variant="success" size="sm" dot>
            Published
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="warning" size="sm" dot>
            Pending
          </Badge>
        );
      case "draft":
        return (
          <Badge variant="default" size="sm" dot>
            Draft
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

  // Single artwork status change (optimistic)
  const handleUpdateStatus = async (nextStatus: ArtworkStatus) => {
    if (!selectedArtwork) return;
    const artTitle = selectedArtwork.title;
    const previous = { ...selectedArtwork };
    const updated = { ...selectedArtwork, status: nextStatus };

    setSelectedArtwork(updated);
    setArtworks((prev) =>
      prev.map((a) => (a.id === selectedArtwork.id ? updated : a))
    );
    setShowRejectForm(false);

    setIsActionLoading(true);
    try {
      const res = await updateArtworkAction(selectedArtwork.id, {
        status: nextStatus,
      });
      if (!res.success) {
        setSelectedArtwork(previous);
        setArtworks((prev) =>
          prev.map((a) => (a.id === selectedArtwork.id ? previous : a))
        );
        toast.error("Failed to update status", res.error || "Please try again.");
      } else {
        toast.success(
          "Artwork status updated",
          `"${artTitle}" marked as ${nextStatus}.`
        );
      }
    } catch {
      setSelectedArtwork(previous);
      setArtworks((prev) =>
        prev.map((a) => (a.id === selectedArtwork.id ? previous : a))
      );
      toast.error("Network error", "Could not update artwork status.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Save Title / Price edits (optimistic)
  const handleSaveEdits = async () => {
    if (!selectedArtwork) return;
    const parsedPrice = parseFloat(editPrice) || selectedArtwork.price;
    const previous = { ...selectedArtwork };
    const updated = {
      ...selectedArtwork,
      title: editTitle.trim() || selectedArtwork.title,
      price: parsedPrice,
    };

    setSelectedArtwork(updated);
    setArtworks((prev) =>
      prev.map((a) => (a.id === selectedArtwork.id ? updated : a))
    );
    setIsEditing(false);

    setIsActionLoading(true);
    try {
      const res = await updateArtworkAction(selectedArtwork.id, {
        title: updated.title,
        price: updated.price,
      });
      if (!res.success) {
        setSelectedArtwork(previous);
        setArtworks((prev) =>
          prev.map((a) => (a.id === selectedArtwork.id ? previous : a))
        );
        toast.error("Failed to save changes", res.error || "Please try again.");
      } else {
        toast.success("Artwork updated", "Title and price updated successfully.");
      }
    } catch {
      setSelectedArtwork(previous);
      setArtworks((prev) =>
        prev.map((a) => (a.id === selectedArtwork.id ? previous : a))
      );
      toast.error("Network error", "Could not save artwork changes.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Delete single artwork (optimistic)
  const handleConfirmDelete = async () => {
    if (!selectedArtwork) return;
    const targetId = selectedArtwork.id;
    const artTitle = selectedArtwork.title;
    const previous = [...artworks];

    setArtworks((prev) => prev.filter((a) => a.id !== targetId));
    setIsDeleteModalOpen(false);
    setIsDrawerOpen(false);
    setSelectedArtwork(null);

    setIsDeleting(true);
    try {
      const res = await deleteArtworkAction(targetId);
      if (!res.success) {
        setArtworks(previous);
        toast.error("Failed to delete artwork", res.error || "Please try again.");
      } else {
        toast.success("Artwork deleted", `"${artTitle}" was removed permanently.`);
      }
    } catch {
      setArtworks(previous);
      toast.error("Network error", "Could not delete artwork.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk Selection Handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.size === paginatedArtworks.length && paginatedArtworks.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedArtworks.map((a) => a.id)));
    }
  };

  const handleToggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Bulk actions: Approve or Reject selected artworks (optimistic)
  const handleBulkUpdateStatus = async (status: "published" | "rejected") => {
    if (selectedIds.size === 0) return;
    const targetIds = Array.from(selectedIds);
    const count = targetIds.length;
    const previous = [...artworks];

    // Optimistically update
    setArtworks((prev) =>
      prev.map((a) => (selectedIds.has(a.id) ? { ...a, status } : a))
    );
    setSelectedIds(new Set());

    try {
      const res = await bulkUpdateArtworksAction(targetIds, { status });
      if (!res.success) {
        setArtworks(previous);
        toast.error("Bulk action failed", res.error || "Could not complete bulk update.");
      } else {
        toast.success(
          "Bulk update complete",
          `${count} artworks updated to ${status}.`
        );
      }
    } catch {
      setArtworks(previous);
      toast.error("Network error", "Could not complete bulk update.");
    }
  };

  // Filter Bar Options
  const filterConfigs: FilterSelectConfig[] = [
    {
      id: "status",
      label: "Status",
      value: statusFilter,
      onChange: (val) => {
        setStatusFilter(val);
        setCurrentPage(1);
      },
      options: [
        { label: "All Statuses", value: "all" },
        { label: "Published", value: "published" },
        { label: "Pending", value: "pending" },
        { label: "Draft", value: "draft" },
        { label: "Rejected", value: "rejected" },
      ],
    },
    {
      id: "creator",
      label: "Creator",
      value: creatorFilter,
      onChange: (val) => {
        setCreatorFilter(val);
        setCurrentPage(1);
      },
      options: [
        { label: "All Creators", value: "all" },
        ...distinctCreators.map((c) => ({ label: c, value: c })),
      ],
    },
    {
      id: "medium",
      label: "Medium",
      value: mediumFilter,
      onChange: (val) => {
        setMediumFilter(val);
        setCurrentPage(1);
      },
      options: [
        { label: "All Media", value: "all" },
        ...distinctMedia.map((m) => ({ label: m, value: m })),
      ],
    },
  ];

  const hasActiveFilters =
    Boolean(searchQuery) ||
    statusFilter !== "all" ||
    creatorFilter !== "all" ||
    mediumFilter !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCreatorFilter("all");
    setMediumFilter("all");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Title & View Mode Toggle */}
      <div className="border-b border-[#E8E8E3] pb-5 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-medium tracking-tight text-[#141413]">
            Artworks
          </h2>
          <p className="mt-1 text-xs md:text-sm text-[#6E6E69]">
            Catalog of community submissions, editorial features, and media moderation.
          </p>
        </div>

        {/* View Switcher: Grid vs Table */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center p-1 rounded-lg border border-[#E8E8E3] bg-white">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              className={`p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B8532F] ${
                viewMode === "grid"
                  ? "bg-[#141413] text-white"
                  : "text-[#6E6E69] hover:text-[#141413]"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              aria-label="Table view"
              className={`p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B8532F] ${
                viewMode === "table"
                  ? "bg-[#141413] text-white"
                  : "text-[#6E6E69] hover:text-[#141413]"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
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
        searchPlaceholder="Search artworks by title..."
        filters={filterConfigs}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
      >
        <span className="text-xs text-[#71716D]">
          {sortedArtworks.length} {sortedArtworks.length === 1 ? "work" : "works"}
        </span>
      </FilterBar>

      {/* Bulk Action Bar in Table View */}
      {viewMode === "table" && selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3 px-4 bg-[#FAFAF8] border border-[#B8532F]/40 rounded-lg animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-medium text-[#141413]">
            <CheckSquare className="w-4 h-4 text-[#B8532F]" />
            <span>
              {selectedIds.size}{" "}
              {selectedIds.size === 1 ? "artwork" : "artworks"} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Deselect All
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleBulkUpdateStatus("published")}
              leftIcon={<Check className="w-3.5 h-3.5" />}
            >
              Approve All
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleBulkUpdateStatus("rejected")}
              leftIcon={<X className="w-3.5 h-3.5" />}
            >
              Reject All
            </Button>
          </div>
        </div>
      )}

      {/* Content Rendering: EmptyState, GridView, or TableView */}
      {sortedArtworks.length === 0 ? (
        <EmptyState
          icon={<Palette className="w-5 h-5 text-[#8A8A85]" />}
          title="No artworks found"
          description={
            hasActiveFilters
              ? "No artwork matches your active filter criteria. Try adjusting or resetting filters."
              : "No artwork has been submitted yet."
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Reset Filters
              </Button>
            ) : null
          }
        />
      ) : viewMode === "grid" ? (
        /* GRID VIEW (Image Cards with lazy loading) */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedArtworks.map((art) => (
              <div
                key={art.id}
                onClick={() => openDetailDrawer(art)}
                className="group bg-white border border-[#E8E8E3] hover:border-[#D0D0CA] rounded-lg overflow-hidden flex flex-col cursor-pointer transition-all duration-150"
              >
                {/* Image Container with Next.js Image lazy load */}
                <div className="relative aspect-4/3 w-full bg-[#ECECE7] overflow-hidden">
                  <Image
                    src={art.imageUrl}
                    alt={art.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    loading="lazy"
                    className="object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 right-2.5">
                    {renderStatusBadge(art.status)}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h4 className="text-xs font-medium text-[#141413] group-hover:text-[#B8532F] transition-colors truncate">
                      {art.title}
                    </h4>
                    <p className="text-[11px] text-[#6E6E69] truncate mt-0.5">
                      {art.creatorName}
                    </p>
                    <p className="text-[11px] text-[#8A8A85] truncate mt-0.5">
                      {art.medium}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#F0F0EB] flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#141413]">
                      {formatCurrency(art.price)}
                    </span>
                    <span className="text-[10px] text-[#8A8A85]">
                      {art.dimensions}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={sortedArtworks.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      ) : (
        /* TABLE VIEW (with bulk selection) */
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <tr>
                <TableHead className="w-10">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-[#6E6E69] hover:text-[#141413] cursor-pointer"
                    aria-label="Select all on this page"
                  >
                    {selectedIds.size === paginatedArtworks.length && paginatedArtworks.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-[#B8532F]" />
                    ) : selectedIds.size > 0 ? (
                      <MinusSquare className="w-4 h-4 text-[#B8532F]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("title")}
                    className="group inline-flex items-center gap-1.5 hover:text-[#141413] cursor-pointer"
                  >
                    <span>Artwork</span>
                    {renderSortIndicator("title")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("creatorName")}
                    className="group inline-flex items-center gap-1.5 hover:text-[#141413] cursor-pointer"
                  >
                    <span>Creator</span>
                    {renderSortIndicator("creatorName")}
                  </button>
                </TableHead>
                <TableHead>Medium</TableHead>
                <TableHead>Dimensions</TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("price")}
                    className="group inline-flex items-center gap-1.5 hover:text-[#141413] cursor-pointer"
                  >
                    <span>Price</span>
                    {renderSortIndicator("price")}
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
                    <span>Created</span>
                    {renderSortIndicator("createdAt")}
                  </button>
                </TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {paginatedArtworks.map((art) => {
                const isSelected = selectedIds.has(art.id);
                return (
                  <TableRow
                    key={art.id}
                    onClick={() => openDetailDrawer(art)}
                    className="cursor-pointer"
                  >
                    {/* Checkbox */}
                    <TableCell onClick={(e) => handleToggleSelectRow(art.id, e)}>
                      <button
                        type="button"
                        className="text-[#6E6E69] hover:text-[#141413] cursor-pointer flex items-center"
                        aria-label={`Select ${art.title}`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#B8532F]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </TableCell>

                    {/* Artwork with Thumbnail */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-md bg-[#ECECE7] overflow-hidden shrink-0">
                          <Image
                            src={art.imageUrl}
                            alt={art.title}
                            fill
                            sizes="40px"
                            loading="lazy"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 max-w-[200px]">
                          <p className="font-medium text-[#141413] truncate">
                            {art.title}
                          </p>
                          <p className="text-[11px] text-[#71716D] truncate">
                            ID: {art.id}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Creator */}
                    <TableCell className="text-[#52524E]">
                      {art.creatorName}
                    </TableCell>

                    {/* Medium */}
                    <TableCell className="text-[#6E6E69] text-xs max-w-[160px] truncate">
                      {art.medium}
                    </TableCell>

                    {/* Dimensions */}
                    <TableCell className="text-[#6E6E69] text-xs whitespace-nowrap">
                      {art.dimensions}
                    </TableCell>

                    {/* Price */}
                    <TableCell className="font-semibold text-[#141413]">
                      {formatCurrency(art.price)}
                    </TableCell>

                    {/* Status */}
                    <TableCell>{renderStatusBadge(art.status)}</TableCell>

                    {/* Created Date */}
                    <TableCell className="text-xs text-[#6E6E69] whitespace-nowrap">
                      {formatDate(art.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Pagination
            currentPage={currentPage}
            totalItems={sortedArtworks.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      {/* DETAIL DRAWER */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedArtwork?.title || "Artwork Detail"}
        description="Curatorial review, valuation, and publication status"
        maxWidth="lg"
        footer={
          selectedArtwork && (
            <div className="flex items-center justify-between w-full">
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete
              </Button>

              <div className="flex items-center gap-2">
                {selectedArtwork.status === "published" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus("draft")}
                    isLoading={isActionLoading}
                    leftIcon={<Archive className="w-3.5 h-3.5" />}
                  >
                    Unpublish
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleUpdateStatus("published")}
                    isLoading={isActionLoading}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Approve / Publish
                  </Button>
                )}

                {selectedArtwork.status !== "rejected" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRejectForm((prev) => !prev)}
                    leftIcon={<XCircle className="w-3.5 h-3.5" />}
                  >
                    Reject
                  </Button>
                )}
              </div>
            </div>
          )
        }
      >
        {selectedArtwork && (
          <div className="space-y-6">
            {/* Large Image with Next.js Image */}
            <div className="relative aspect-16/10 w-full rounded-lg bg-[#ECECE7] overflow-hidden border border-[#E8E8E3]">
              <Image
                src={selectedArtwork.imageUrl}
                alt={selectedArtwork.title}
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                className="object-cover"
                priority
              />
              <div className="absolute top-3 right-3">
                {renderStatusBadge(selectedArtwork.status)}
              </div>
            </div>

            {/* Quick Title & Price Banner with Edit Trigger */}
            <div className="p-4 bg-[#FAFAF8] border border-[#E8E8E3] rounded-lg space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-base font-semibold text-[#141413]">
                    {selectedArtwork.title}
                  </h4>
                  <p className="text-xs text-[#6E6E69] mt-0.5">
                    by <span className="font-medium text-[#141413]">{selectedArtwork.creatorName}</span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-base font-semibold text-[#141413]">
                    {formatCurrency(selectedArtwork.price)}
                  </span>
                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditing((prev) => !prev)}
                      className="inline-flex items-center gap-1 text-[11px] text-[#B8532F] hover:text-[#9E4323] cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isEditing ? "Close Edit" : "Edit Title/Price"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Inline Edit Form */}
              {isEditing && (
                <div className="pt-3 border-t border-[#E8E8E3] space-y-3 animate-in fade-in duration-150">
                  <Input
                    label="Artwork Title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <Input
                    label="Price (USD)"
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                  />
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveEdits}
                      isLoading={isActionLoading}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Reject Form with Reason Field */}
            {showRejectForm && (
              <div className="p-4 rounded-lg bg-[#FDF2F2] border border-[#F2C6C6] space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#9E3333] flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-[#B83838]" />
                    <span>Reject Submission</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowRejectForm(false)}
                    className="text-[#9E3333] hover:text-[#141413] text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-[11px] text-[#9E3333]/90 leading-relaxed">
                  Provide curatorial feedback explaining why this submission does not meet studio standards.
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Dimensions not adhering to gallery specifications / low resolution imagery..."
                  rows={2}
                  className="w-full text-xs p-2.5 bg-white border border-[#F2C6C6] rounded-lg focus:outline-none focus:border-[#B83838] focus:ring-1 focus:ring-[#B83838]"
                />
                <div className="flex justify-end">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleUpdateStatus("rejected")}
                    isLoading={isActionLoading}
                  >
                    Confirm Rejection
                  </Button>
                </div>
              </div>
            )}

            {/* Metadata Attributes */}
            <div className="space-y-3 text-xs">
              <h5 className="font-medium text-[#141413] uppercase tracking-wider text-[11px] text-[#8A8A85]">
                Specifications
              </h5>

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Artwork ID</span>
                <span className="font-mono text-[11px] text-[#141413] bg-[#F5F5F0] px-1.5 py-0.5 rounded">
                  {selectedArtwork.id}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Creator ID</span>
                <span className="font-mono text-[11px] text-[#141413] bg-[#F5F5F0] px-1.5 py-0.5 rounded">
                  {selectedArtwork.creatorId}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Medium</span>
                <span className="font-medium text-[#141413]">
                  {selectedArtwork.medium}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Physical Dimensions</span>
                <span className="font-medium text-[#141413]">
                  {selectedArtwork.dimensions}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Submitted Date</span>
                <span className="font-medium text-[#141413]">
                  {formatDate(selectedArtwork.createdAt)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Artwork Deletion"
        description="Permanently delete this piece from the catalog."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete Artwork
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-[#52524E]">
          <p>
            Are you sure you want to permanently delete{" "}
            <span className="font-semibold text-[#141413]">
              "{selectedArtwork?.title}"
            </span>{" "}
            by {selectedArtwork?.creatorName}?
          </p>
          <p className="text-[11px] text-[#71716D]">
            This will remove the artwork from all exhibitions, collector bookmarks,
            and catalog archives immediately.
          </p>
        </div>
      </Modal>
    </div>
  );
}
