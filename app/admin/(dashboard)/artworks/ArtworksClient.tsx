"use client";

import React, { useState, useMemo, useEffect, useTransition } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  X,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  Archive,
  Palette,
  Eye,
  Check,
  Loader2,
  ExternalLink,
  Tag,
  Maximize2,
  LayoutGrid,
  List,
  CheckSquare,
  Square,
  MinusSquare,
  Sparkles,
  Flag,
} from "lucide-react";
import { TriangleAlertIcon, SaveIcon } from "@/components/ui/icons";
import { Artwork, ArtworkStatus } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui";
import {
  updateArtworkAction,
  bulkUpdateArtworksAction,
  deleteArtworkAction,
  createArtworkAction,
  createReportAction,
} from "@/app/admin/actions";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";

interface ArtworksClientProps {
  initialArtworks: Artwork[];
  distinctCreators: string[];
  distinctMedia: string[];
}

type ViewMode = "grid" | "table";

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
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function getInitials(name: string): string {
  if (!name) return "A";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [viewingArtwork, setViewingArtwork] = useState<Artwork | null>(null);

  // Sync direct URL view parameter if present
  useEffect(() => {
    const viewId = searchParams.get("view");
    if (viewId) {
      const match = artworks.find((a) => a.id === viewId);
      if (match) setViewingArtwork(match);
    }
  }, [searchParams, artworks]);

  // Search & Filters
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatusParam);
  const [creatorFilter, setCreatorFilter] = useState("all");
  const [mediumFilter, setMediumFilter] = useState("all");

  // Sorting & Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Detail Drawer state
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Reject with reason state
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Edit inline state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editMedium, setEditMedium] = useState("");
  const [editDimensions, setEditDimensions] = useState("");

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add Artwork modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    title: "",
    creatorName: "",
    creatorId: "",
    medium: "",
    dimensions: "",
    price: "",
    imageUrl: "",
    status: "published" as ArtworkStatus,
  });

  // Report Artwork Modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Possible copyright infringement");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingArtwork) return;
    setIsSubmittingReport(true);
    try {
      const res = await createReportAction({
        artworkId: viewingArtwork.id,
        reason: reportReason,
        details: reportDetails,
        reporterName: "You (Community Member)",
      });
      if (res.success) {
        toast.success(
          "Report submitted",
          `Thank you. Your report regarding "${viewingArtwork.title}" has been submitted for moderation.`
        );
        setIsReportModalOpen(false);
        setReportDetails("");
      } else {
        toast.error("Failed to submit report", res.error || "Please try again.");
      }
    } catch {
      toast.error("Network error", "Could not submit report.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Debounce search query (250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sync URL search params
  useEffect(() => {
    const param = searchParams.get("status");
    if (param) {
      setStatusFilter(param);
    }
  }, [searchParams]);

  // Sync drawer edit form
  useEffect(() => {
    if (selectedArtwork) {
      setEditTitle(selectedArtwork.title);
      setEditPrice(String(selectedArtwork.price || 0));
      setEditMedium(selectedArtwork.medium || "");
      setEditDimensions(selectedArtwork.dimensions || "");
      setShowRejectForm(false);
      setRejectReason("");
      setIsEditing(false);
    }
  }, [selectedArtwork]);

  // Client-side Filtering
  const filteredArtworks = useMemo(() => {
    return artworks.filter((art) => {
      // Search by title, creator, or medium
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        const matchesTitle = art.title.toLowerCase().includes(q);
        const matchesCreator = art.creatorName.toLowerCase().includes(q);
        const matchesMedium = art.medium.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCreator && !matchesMedium) {
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
  }, [artworks, debouncedSearch, statusFilter, creatorFilter, mediumFilter]);

  // Pagination slice
  const totalPages = Math.ceil(filteredArtworks.length / pageSize) || 1;
  const paginatedArtworks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredArtworks.slice(start, start + pageSize);
  }, [filteredArtworks, currentPage, pageSize]);

  // Status Badge Component
  const renderStatusBadge = (status: ArtworkStatus) => {
    switch (status) {
      case "published":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#EAF2EC] text-[#28633B] border border-[#D4E6D8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#28633B]" />
            Published
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FAF5EC] text-[#865E16] border border-[#ECDDBB]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#865E16]" />
            Pending
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F3F3EF] text-[#71716D] border border-[#E5E5DF]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#71716D]" />
            Draft
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FDF3F2] text-[#B83838] border border-[#F4CDCD]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B83838]" />
            Rejected
          </span>
        );
    }
  };

  // Open Drawer Handler
  const openDetailDrawer = (art: Artwork) => {
    setSelectedArtwork(art);
    setIsDrawerOpen(true);
  };

  // Status Change (Optimistic)
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
          "Status updated",
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

  // Save Edits
  const handleSaveEdits = async () => {
    if (!selectedArtwork) return;
    const parsedPrice = parseFloat(editPrice) || selectedArtwork.price;
    const previous = { ...selectedArtwork };
    const updated: Artwork = {
      ...selectedArtwork,
      title: editTitle.trim() || selectedArtwork.title,
      price: parsedPrice,
      medium: editMedium.trim() || selectedArtwork.medium,
      dimensions: editDimensions.trim() || selectedArtwork.dimensions,
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
        medium: updated.medium,
        dimensions: updated.dimensions,
      });
      if (!res.success) {
        setSelectedArtwork(previous);
        setArtworks((prev) =>
          prev.map((a) => (a.id === selectedArtwork.id ? previous : a))
        );
        toast.error("Failed to save changes", res.error || "Please try again.");
      } else {
        toast.success("Artwork updated", "Changes saved successfully.");
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

  // Delete Artwork
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
        toast.success("Artwork deleted", `"${artTitle}" removed permanently.`);
      }
    } catch {
      setArtworks(previous);
      toast.error("Network error", "Could not delete artwork.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle Featured status
  const handleToggleFeature = async (art: Artwork) => {
    const nextVal = !art.isFeatured;
    setArtworks((prev) =>
      prev.map((a) => (a.id === art.id ? { ...a, isFeatured: nextVal } : a))
    );
    try {
      await updateArtworkAction(art.id, { isFeatured: nextVal } as any);
      toast.success(
        nextVal ? "Artwork featured" : "Artwork unfeatured",
        `"${art.title}" ${nextVal ? "featured on platform" : "unfeatured"}.`
      );
    } catch {
      toast.error("Error", "Could not update featured status.");
    }
  };

  // Toggle Visibility (Published / Draft)
  const handleToggleHide = async (art: Artwork) => {
    const nextStatus: ArtworkStatus = art.status === "published" ? "draft" : "published";
    setArtworks((prev) =>
      prev.map((a) => (a.id === art.id ? { ...a, status: nextStatus } : a))
    );
    try {
      await updateArtworkAction(art.id, { status: nextStatus });
      toast.success(
        nextStatus === "draft" ? "Artwork hidden" : "Artwork published",
        `"${art.title}" is now ${nextStatus === "draft" ? "hidden (draft)" : "published"}.`
      );
    } catch {
      toast.error("Error", "Could not update artwork visibility.");
    }
  };

  // Toggle Flagged status
  const handleToggleFlag = async (art: Artwork) => {
    const nextVal = !art.isFlagged;
    setArtworks((prev) =>
      prev.map((a) => (a.id === art.id ? { ...a, isFlagged: nextVal } : a))
    );
    try {
      await updateArtworkAction(art.id, { isFlagged: nextVal } as any);
      toast.info(
        nextVal ? "Artwork flagged" : "Flag cleared",
        `"${art.title}" ${nextVal ? "flagged for review" : "unflagged"}.`
      );
    } catch {
      toast.error("Error", "Could not update flagged status.");
    }
  };

  // Add Artwork Handler
  const handleAddArtwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.title.trim()) {
      toast.error("Title required", "Please enter an artwork title.");
      return;
    }
    if (!addForm.creatorName.trim()) {
      toast.error("Creator required", "Please enter a creator name.");
      return;
    }

    setIsAdding(true);
    try {
      const payload = {
        title: addForm.title.trim(),
        creatorName: addForm.creatorName.trim(),
        creatorId: addForm.creatorId.trim() || undefined,
        medium: addForm.medium.trim() || "Mixed Media",
        dimensions: addForm.dimensions.trim() || "Dimensions on request",
        price: parseFloat(addForm.price) || 0,
        imageUrl:
          addForm.imageUrl.trim() ||
          "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800",
        status: addForm.status,
      };

      const res = await createArtworkAction(payload);
      if (!res.success || !res.artwork) {
        toast.error("Failed to create artwork", res.error || "Please try again.");
      } else {
        setArtworks((prev) => [res.artwork!, ...prev]);
        toast.success("Artwork added", `"${res.artwork.title}" added to catalog.`);
        setIsAddModalOpen(false);
        setAddForm({
          title: "",
          creatorName: "",
          creatorId: "",
          medium: "",
          dimensions: "",
          price: "",
          imageUrl: "",
          status: "published",
        });
      }
    } catch (err: any) {
      toast.error("Creation error", err.message || "Could not create artwork.");
    } finally {
      setIsAdding(false);
    }
  };

  // Bulk Actions
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
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkUpdateStatus = async (status: "published" | "rejected") => {
    if (selectedIds.size === 0) return;
    const targetIds = Array.from(selectedIds);
    const count = targetIds.length;
    const previous = [...artworks];

    setArtworks((prev) =>
      prev.map((a) => (selectedIds.has(a.id) ? { ...a, status } : a))
    );
    setSelectedIds(new Set());

    try {
      const res = await bulkUpdateArtworksAction(targetIds, { status });
      if (!res.success) {
        setArtworks(previous);
        toast.error("Bulk action failed", res.error || "Could not complete update.");
      } else {
        toast.success("Bulk update complete", `${count} artworks updated to ${status}.`);
      }
    } catch {
      setArtworks(previous);
      toast.error("Network error", "Could not complete bulk update.");
    }
  };

  const hasActiveFilters =
    Boolean(debouncedSearch) ||
    statusFilter !== "all" ||
    creatorFilter !== "all" ||
    mediumFilter !== "all";

  const handleResetFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setCreatorFilter("all");
    setMediumFilter("all");
    setCurrentPage(1);
  };

  const statusPills: { label: string; value: string }[] = [
    { label: "All", value: "all" },
    { label: "Published", value: "published" },
    { label: "Pending", value: "pending" },
    { label: "Draft", value: "draft" },
    { label: "Rejected", value: "rejected" },
  ];

  // If viewing an artwork detail (Discovery view matching Screenshot 2)
  if (viewingArtwork) {
    return (
      <div className="space-y-6 pb-16 animate-in fade-in duration-150">
        {/* Top-left: Back to discovery button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setViewingArtwork(null)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#D5D3CE] bg-white text-xs font-medium text-[#141413] hover:bg-[#F7F6F2] transition-colors shadow-2xs cursor-pointer select-none"
          >
            <span>←</span>
            <span>Back to discovery</span>
          </button>
        </div>

        {/* 2-Column Discovery Detail Layout matching Screenshot 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start max-w-6xl mx-auto pt-2">
          {/* Left Column: Artwork Image framed in soft sand/beige container */}
          <div className="lg:col-span-6 bg-[#EFECE6] p-6 sm:p-10 md:p-12 rounded-2xl sm:rounded-3xl flex items-center justify-center">
            <div className="relative w-full aspect-4/5 max-w-md rounded-xl sm:rounded-2xl overflow-hidden shadow-sm bg-neutral-100">
              <Image
                src={viewingArtwork.imageUrl}
                alt={viewingArtwork.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>

          {/* Right Column: Metadata, Specifications & Actions */}
          <div className="lg:col-span-6 space-y-5 pt-1">
            {/* Category / Year */}
            <p className="text-xs uppercase tracking-wider text-[#73736C] font-medium">
              {viewingArtwork.medium} / {viewingArtwork.year || "2026"}
            </p>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#141413] tracking-tight leading-tight">
              {viewingArtwork.title}
            </h1>

            {/* Creator Byline */}
            <div className="flex items-center gap-2.5 pt-1">
              <div className="w-8 h-8 rounded-full bg-[#E5E3DE] text-[#4A4A45] font-semibold text-xs flex items-center justify-center">
                {getInitials(viewingArtwork.creatorName)}
              </div>
              <button
                type="button"
                onClick={() => {
                  setCreatorFilter(viewingArtwork.creatorName);
                  setViewingArtwork(null);
                  toast.info(
                    "Creator Filter",
                    `Filtering artworks by ${viewingArtwork.creatorName}`
                  );
                }}
                className="text-sm font-medium text-[#141413] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{viewingArtwork.creatorName}</span>
                <span className="text-[#8A8A85] text-xs">↗</span>
              </button>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-[#5A5A55] leading-relaxed max-w-xl font-normal pt-1">
              {viewingArtwork.description ||
                "A study of changing light across urban landscapes. Layered forms reveal fragments of memory and a quieter way of seeing."}
            </p>

            {/* Specifications Table */}
            <div className="border-t border-b border-[#E8E6E1] divide-y divide-[#E8E6E1] text-xs sm:text-sm my-6">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#73736C]">Medium</span>
                <span className="text-[#141413] font-medium">{viewingArtwork.medium}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#73736C]">Dimensions</span>
                <span className="text-[#141413] font-medium">{viewingArtwork.dimensions}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#73736C]">Year</span>
                <span className="text-[#141413] font-medium">{viewingArtwork.year || "2026"}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#73736C]">Location</span>
                <span className="text-[#141413] font-medium">{viewingArtwork.location || "Mumbai"}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#73736C]">Collection</span>
                <span className="text-[#141413] font-medium">
                  {viewingArtwork.collection || "Monsoon Studies"}
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#73736C]">Availability</span>
                <span className="text-[#141413] font-medium">
                  {viewingArtwork.availability ||
                    (viewingArtwork.status === "published" ? "Available" : "Not for sale")}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="pt-1">
              <p className="text-sm font-semibold text-[#141413]">
                {viewingArtwork.price > 0
                  ? formatCurrency(viewingArtwork.price)
                  : "Price on request"}
              </p>
            </div>

            {/* Actions Row */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  toast.success(
                    "Interest Expressed",
                    `Your curatorial interest in "${viewingArtwork.title}" has been registered.`
                  );
                }}
                className="px-5 py-2.5 rounded-full bg-[#141413] text-white text-xs sm:text-sm font-medium hover:bg-[#2A2A28] active:bg-black transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Express Interest</span>
                <span>→</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreatorFilter(viewingArtwork.creatorName);
                  setViewingArtwork(null);
                  toast.info(
                    "Viewing Creator",
                    `Navigated to artworks by ${viewingArtwork.creatorName}`
                  );
                }}
                className="px-5 py-2.5 rounded-full bg-white border border-[#D5D3CE] text-xs sm:text-sm font-medium text-[#141413] hover:bg-[#F7F6F2] transition-colors cursor-pointer"
              >
                Creator
              </button>
              <button
                type="button"
                onClick={() => {
                  toast.success(
                    "Saved",
                    `"${viewingArtwork.title}" has been saved to your curatorial list.`
                  );
                }}
                className="w-10 h-10 rounded-full bg-white border border-[#D5D3CE] text-[#141413] hover:bg-[#F7F6F2] hover:border-[#141413] transition-colors cursor-pointer flex items-center justify-center shrink-0"
                title="Save artwork"
                aria-label="Save artwork"
              >
                <SaveIcon size={16} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="group w-10 h-10 rounded-full bg-white border border-[#E8E8E3] text-[#6E6E69] hover:text-red-600 hover:border-red-200 hover:bg-red-50/50 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                title="Report artwork"
                aria-label="Report artwork"
              >
                <TriangleAlertIcon size={16} strokeWidth={2} className="text-[#8A8A85] group-hover:text-red-600 transition-colors" />
              </button>
            </div>

            {/* Subtext */}
            <p className="text-xs text-[#7A7A75] leading-normal pt-3 max-w-lg">
              A direct connection, not a checkout. Pricing and any acquisition are discussed privately with the creator.
            </p>
          </div>
        </div>

        {/* User-side Report Artwork Modal */}
        <Modal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <TriangleAlertIcon size={20} strokeWidth={2} className="text-amber-500" />
              <span>Report Artwork</span>
            </div>
          }
          description="Help keep the ErasStudio creative community safe, authentic, and respectful."
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReportModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitReport}
                isLoading={isSubmittingReport}
              >
                Submit Report
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmitReport} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                Reason for report *
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-[#E8E8E3] bg-white text-[#141413] focus:outline-none focus:border-[#141413]"
              >
                <option value="Possible copyright infringement">Possible copyright infringement</option>
                <option value="Inappropriate content">Inappropriate content</option>
                <option value="Incorrect artwork information">Incorrect artwork information</option>
                <option value="Harassment or offensive content">Harassment or offensive content</option>
                <option value="Spam or misleading content">Spam or misleading content</option>
                <option value="Fraud or scam">Fraud or scam</option>
                <option value="Stolen artwork">Stolen artwork</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                Additional details (optional)
              </label>
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Provide any relevant context, links, or evidence to assist our moderation team..."
                rows={3}
                className="w-full text-xs p-3 rounded-lg border border-[#E8E8E3] bg-white text-[#141413] placeholder:text-[#8A8A85] focus:outline-none focus:border-[#141413]"
              />
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* ========================================================================= */}
      {/* 1. MAIN HEADER & ADD ARTWORK ACTION */}
      {/* ========================================================================= */}
      <div className="border-b border-[#E8E8E3] pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-[#8A8A85] mb-1">
              Workspace / Artworks
            </div>
            <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-[#141413]">
              Artworks
            </h2>
            <p className="mt-1 text-xs md:text-sm text-[#6E6E69]">
              Catalog of community submissions, editorial features, and media moderation.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {/* View Mode Switcher */}
            <div className="inline-flex items-center p-1 rounded-lg border border-[#E8E8E3] bg-white">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                className={`p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-[#141413] text-white"
                    : "text-[#6E6E69] hover:text-[#141413]"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                aria-label="Table view"
                className={`p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === "table"
                    ? "bg-[#141413] text-white"
                    : "text-[#6E6E69] hover:text-[#141413]"
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* + Add Artwork Button */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#141413] text-white text-xs font-medium hover:bg-[#2A2A28] active:bg-[#000000] transition-colors shadow-xs cursor-pointer select-none"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Artwork</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SEARCH & FILTER BAR (iRAS Studio Prototype Style) */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#8A8A85] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search artworks by title, creator, or medium..."
            className="w-full text-xs md:text-sm pl-10 pr-9 py-2.5 rounded-lg border border-[#E8E8E3] bg-white text-[#141413] placeholder:text-[#8A8A85] focus:outline-none focus:border-[#B8532F] focus:ring-1 focus:ring-[#B8532F] transition-all shadow-2xs"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setDebouncedSearch("");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A85] hover:text-[#141413] p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters Row: Status Pills + Dropdowns */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {statusPills.map((pill) => {
              const isActive = statusFilter === pill.value;
              return (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => {
                    setStatusFilter(pill.value);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer select-none ${
                    isActive
                      ? "bg-[#141413] text-white shadow-2xs"
                      : "bg-white text-[#6E6E69] border border-[#E8E8E3] hover:text-[#141413] hover:border-[#D0D0CA]"
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          {/* Creators & Media Dropdowns */}
          <div className="flex items-center gap-2">
            {/* Creator Dropdown */}
            <select
              value={creatorFilter}
              onChange={(e) => {
                setCreatorFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by creator"
              className="text-xs px-2.5 py-1.5 rounded-lg border border-[#E8E8E3] bg-white text-[#141413] focus:outline-none focus:border-[#B8532F] cursor-pointer"
            >
              <option value="all">All Creators</option>
              {distinctCreators.map((creator) => (
                <option key={creator} value={creator}>
                  {creator}
                </option>
              ))}
            </select>

            {/* Medium Dropdown */}
            <select
              value={mediumFilter}
              onChange={(e) => {
                setMediumFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by medium"
              className="text-xs px-2.5 py-1.5 rounded-lg border border-[#E8E8E3] bg-white text-[#141413] focus:outline-none focus:border-[#B8532F] cursor-pointer"
            >
              <option value="all">All Media</option>
              {distinctMedia.map((medium) => (
                <option key={medium} value={medium}>
                  {medium}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-[#B8532F] hover:text-[#9E4323] font-medium px-2 py-1 cursor-pointer"
              >
                Reset
              </button>
            )}

            <span className="text-xs text-[#8A8A85] pl-2 border-l border-[#E8E8E3] hidden sm:inline">
              {filteredArtworks.length} {filteredArtworks.length === 1 ? "artwork" : "artworks"}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BULK ACTION BAR (Table mode) */}
      {/* ========================================================================= */}
      {viewMode === "table" && selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3 px-4 bg-[#FAFAF8] border border-[#B8532F]/40 rounded-lg animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-medium text-[#141413]">
            <CheckSquare className="w-4 h-4 text-[#B8532F]" />
            <span>
              {selectedIds.size} {selectedIds.size === 1 ? "artwork" : "artworks"} selected
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

      {/* ========================================================================= */}
      {/* 4. CONTENT RENDERING: EMPTY STATE, GRID OR TABLE */}
      {/* ========================================================================= */}
      {filteredArtworks.length === 0 ? (
        <EmptyState
          icon={<Palette className="w-6 h-6 text-[#8A8A85]" />}
          title="No artworks found"
          description={
            hasActiveFilters
              ? "No artwork matches your active search or filter criteria. Try adjusting or clearing your filters."
              : "No artwork has been submitted to the catalog yet."
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Reset Filters
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add First Artwork
              </Button>
            )
          }
        />
      ) : viewMode === "grid" ? (
        /* ===================================================================== */
        /* GRID VIEW: Clean, Compact iRAS Studio Artwork Cards                   */
        /* ===================================================================== */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedArtworks.map((art) => (
              <div
                key={art.id}
                onClick={() => setViewingArtwork(art)}
                className="group bg-white border border-[#E8E8E3] hover:border-[#141413] rounded-lg overflow-hidden flex flex-col cursor-pointer transition-all duration-150 shadow-2xs hover:shadow-xs"
              >
                {/* Fixed Dimension Image Container with Next.js Optimization */}
                <div className="relative aspect-4/3 w-full bg-[#ECECE7] overflow-hidden">
                  <Image
                    src={art.imageUrl}
                    alt={art.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    loading="lazy"
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-200"
                  />
                  {/* Subtle Status Pill */}
                  <div className="absolute top-2.5 right-2.5">
                    {renderStatusBadge(art.status)}
                  </div>

                  {/* Subtle Hover Action Pill */}
                  <div className="absolute inset-0 bg-[#141413]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-[#141413] text-[11px] font-medium shadow-sm backdrop-blur-xs">
                      <Eye className="w-3 h-3 text-[#B8532F]" />
                      <span>View Specs</span>
                    </span>
                  </div>
                </div>

                {/* Card Text Content */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                  <div>
                    <h4 className="text-xs font-semibold text-[#141413] group-hover:text-[#B8532F] transition-colors truncate">
                      {art.title}
                    </h4>
                    <p className="text-[11px] text-[#6E6E69] truncate mt-0.5">
                      by <span className="font-medium text-[#141413]">{art.creatorName}</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#F0F0EB] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#8A8A85] truncate max-w-[120px]">
                      {art.medium}
                    </span>
                    <span className="font-semibold text-[#141413]">
                      {art.price ? formatCurrency(art.price) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E8E8E3]">
            <span className="text-xs text-[#6E6E69]">
              Showing {Math.min((currentPage - 1) * pageSize + 1, filteredArtworks.length)}–
              {Math.min(currentPage * pageSize, filteredArtworks.length)} of {filteredArtworks.length} artworks
            </span>
            <Pagination
              currentPage={currentPage}
              totalItems={filteredArtworks.length}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      ) : (
        /* ===================================================================== */
        /* TABLE VIEW (Alternative view mode)                                    */
        /* ===================================================================== */
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
                <TableHead>Artwork</TableHead>
                <TableHead>Artist</TableHead>
                <TableHead>Medium</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {paginatedArtworks.map((art) => {
                const isSelected = selectedIds.has(art.id);
                return (
                  <TableRow
                    key={art.id}
                    onClick={() => setViewingArtwork(art)}
                    className="cursor-pointer hover:bg-[#FAF9F5] transition-colors"
                  >
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

                    <TableCell>
                      <div className="flex items-center gap-3.5">
                        <div className="relative w-12 h-12 rounded-lg bg-[#ECECE7] overflow-hidden shrink-0">
                          <Image
                            src={art.imageUrl}
                            alt={art.title}
                            fill
                            sizes="48px"
                            loading="lazy"
                            className="object-cover"
                          />
                        </div>
                        <span className="font-semibold text-sm text-[#141413] whitespace-nowrap">
                          {art.title}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-sm text-[#141413] whitespace-nowrap">
                      {art.creatorName}
                    </TableCell>

                    <TableCell className="text-sm text-[#141413] whitespace-nowrap">
                      {art.medium}
                    </TableCell>

                    <TableCell className="text-sm text-[#141413] whitespace-nowrap">
                      {art.availability || (art.status === "published" ? "Available" : "Not for sale")}
                    </TableCell>

                    <TableCell className="text-sm text-[#141413] whitespace-nowrap">
                      {formatDate(art.createdAt)}
                    </TableCell>

                    <TableCell>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#EFEFEF] text-[#4A4A48] select-none capitalize">
                        {art.status === "published" ? "Published" : art.status}
                      </span>
                    </TableCell>

                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingArtwork(art)}
                          className="px-3.5 py-1 rounded-full border border-[#D5D5D0] text-xs font-normal text-[#141413] bg-white hover:bg-[#F5F5F3] transition-colors cursor-pointer select-none"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleFeature(art)}
                          className="px-3.5 py-1 rounded-full border border-[#D5D5D0] text-xs font-normal text-[#141413] bg-white hover:bg-[#F5F5F3] transition-colors cursor-pointer select-none"
                        >
                          {art.isFeatured ? "Unfeature" : "Feature"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleHide(art)}
                          className="px-3.5 py-1 rounded-full border border-[#D5D5D0] text-xs font-normal text-[#141413] bg-white hover:bg-[#F5F5F3] transition-colors cursor-pointer select-none"
                        >
                          {art.status === "published" ? "Hide" : "Show"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedArtwork(art);
                            setIsDeleteModalOpen(true);
                          }}
                          className="px-3.5 py-1 rounded-full border border-[#D5D5D0] text-xs font-normal text-[#141413] bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer select-none"
                        >
                          Remove
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleFlag(art)}
                          className={`px-3.5 py-1 rounded-full border text-xs font-normal transition-colors cursor-pointer select-none ${
                            art.isFlagged
                              ? "bg-amber-50 text-amber-700 border-amber-300"
                              : "border-[#D5D5D0] text-[#141413] bg-white hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
                          }`}
                        >
                          {art.isFlagged ? "Flagged" : "Flag"}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E8E8E3]">
            <span className="text-xs text-[#6E6E69]">
              Showing {Math.min((currentPage - 1) * pageSize + 1, filteredArtworks.length)}–
              {Math.min(currentPage * pageSize, filteredArtworks.length)} of {filteredArtworks.length} artworks
            </span>
            <Pagination
              currentPage={currentPage}
              totalItems={filteredArtworks.length}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. RIGHT DETAIL DRAWER (iRAS Studio Prototype Style)                      */}
      {/* ========================================================================= */}
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
            {/* Artwork Image Container */}
            <div className="relative aspect-16/10 w-full rounded-lg bg-[#ECECE7] overflow-hidden border border-[#E8E8E3]">
              <Image
                src={selectedArtwork.imageUrl}
                alt={selectedArtwork.title}
                fill
                sizes="(max-width: 768px) 100vw, 500px"
                className="object-cover"
                priority
              />
              <div className="absolute top-3 right-3">
                {renderStatusBadge(selectedArtwork.status)}
              </div>
            </div>

            {/* Title, Creator & Price Header */}
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
                    {selectedArtwork.price ? formatCurrency(selectedArtwork.price) : "Price on request"}
                  </span>
                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditing((prev) => !prev)}
                      className="inline-flex items-center gap-1 text-[11px] text-[#B8532F] hover:text-[#9E4323] cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isEditing ? "Close Edit" : "Edit Details"}</span>
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
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Price (USD)"
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                    />
                    <Input
                      label="Medium"
                      value={editMedium}
                      onChange={(e) => setEditMedium(e.target.value)}
                    />
                  </div>
                  <Input
                    label="Physical Dimensions"
                    value={editDimensions}
                    onChange={(e) => setEditDimensions(e.target.value)}
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

            {/* Rejection Form */}
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

            {/* Specifications Section */}
            <div className="space-y-3 text-xs">
              <h5 className="font-semibold text-[#141413] uppercase tracking-wider text-[11px] text-[#8A8A85]">
                Specifications
              </h5>

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Artwork ID</span>
                <span className="font-mono text-[11px] text-[#141413] bg-[#F5F5F0] px-1.5 py-0.5 rounded">
                  {selectedArtwork.id}
                </span>
              </div>

              {selectedArtwork.creatorId && (
                <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                  <span className="text-[#6E6E69]">Creator ID</span>
                  <span className="font-mono text-[11px] text-[#141413] bg-[#F5F5F0] px-1.5 py-0.5 rounded">
                    {selectedArtwork.creatorId}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Medium</span>
                <span className="font-medium text-[#141413]">
                  {selectedArtwork.medium}
                </span>
              </div>

              {selectedArtwork.dimensions && (
                <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                  <span className="text-[#6E6E69]">Physical Dimensions</span>
                  <span className="font-medium text-[#141413]">
                    {selectedArtwork.dimensions}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Submitted Date</span>
                <span className="font-medium text-[#141413]">
                  {formatDate(selectedArtwork.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Catalog Availability</span>
                <span className="font-medium text-[#141413]">
                  {selectedArtwork.status === "published" ? "Available for collectors" : "Restricted / Internal"}
                </span>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* ========================================================================= */}
      {/* 6. ADD ARTWORK MODAL                                                      */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          if (!isAdding) setIsAddModalOpen(false);
        }}
        title="Add Artwork to Catalog"
        description="Register a new curated piece with media specifications and publication status."
        maxWidth="lg"
      >
        <form onSubmit={handleAddArtwork} className="space-y-4 py-1">
          <div className="space-y-3 text-xs">
            <Input
              label="Artwork Title *"
              required
              placeholder="e.g. Resonance in Ochre IV"
              value={addForm.title}
              onChange={(e) => setAddForm((prev) => ({ ...prev, title: e.target.value }))}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Creator Name *
                </label>
                <input
                  type="text"
                  required
                  list="creators-datalist"
                  placeholder="e.g. Sora Takahashi"
                  value={addForm.creatorName}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, creatorName: e.target.value }))}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#E8E8E3] bg-white text-[#141413] placeholder:text-[#8A8A85] focus:outline-none focus:border-[#B8532F] focus:ring-1 focus:ring-[#B8532F]"
                />
                <datalist id="creators-datalist">
                  {distinctCreators.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Primary Medium / Category *
                </label>
                <input
                  type="text"
                  required
                  list="media-datalist"
                  placeholder="e.g. Cast Bronze & Acoustic Transducer"
                  value={addForm.medium}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, medium: e.target.value }))}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#E8E8E3] bg-white text-[#141413] placeholder:text-[#8A8A85] focus:outline-none focus:border-[#B8532F] focus:ring-1 focus:ring-[#B8532F]"
                />
                <datalist id="media-datalist">
                  {distinctMedia.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Physical Dimensions"
                placeholder="e.g. 120 x 85 x 40 cm"
                value={addForm.dimensions}
                onChange={(e) => setAddForm((prev) => ({ ...prev, dimensions: e.target.value }))}
              />
              <Input
                label="Price (USD)"
                type="number"
                placeholder="e.g. 6800"
                value={addForm.price}
                onChange={(e) => setAddForm((prev) => ({ ...prev, price: e.target.value }))}
              />
            </div>

            <Input
              label="Artwork Image URL *"
              required
              placeholder="https://images.unsplash.com/..."
              value={addForm.imageUrl}
              onChange={(e) => setAddForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
            />

            {/* Quick Image Preview */}
            {addForm.imageUrl && (
              <div className="relative aspect-16/9 w-full rounded-lg overflow-hidden border border-[#E8E8E3] bg-[#ECECE7]">
                <img
                  src={addForm.imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#141413] mb-1">
                Initial Publication Status
              </label>
              <select
                value={addForm.status}
                onChange={(e) =>
                  setAddForm((prev) => ({
                    ...prev,
                    status: e.target.value as ArtworkStatus,
                  }))
                }
                className="w-full text-xs px-3 py-2 rounded-lg border border-[#E8E8E3] bg-white text-[#141413] focus:outline-none focus:border-[#B8532F]"
              >
                <option value="published">Published (Immediately available)</option>
                <option value="pending">Pending Curatorial Review</option>
                <option value="draft">Draft (Restricted view)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E8E8E3]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isAdding}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isAdding}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Artwork
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 7. DELETE CONFIRMATION MODAL                                             */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete artwork?"
        description="This action cannot be undone."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
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
          </div>
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
            This will permanently remove the piece from all exhibitions, collector bookmarks,
            and catalog archives immediately.
          </p>
        </div>
      </Modal>
    </div>
  );
}
