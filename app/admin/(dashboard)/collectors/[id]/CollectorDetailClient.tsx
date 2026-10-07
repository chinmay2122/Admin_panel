"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Collector, CollectorStatus, CollectorArtworkInterest } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui";
import {
  updateCollectorAction,
  deleteCollectorAction,
  updateInquiryStatusAction,
} from "@/app/admin/actions";
import {
  ArrowLeft,
  Sparkles,
  ImageIcon,
  AlertTriangle,
  MessageSquare,
  ExternalLink,
  Clock,
  Tag,
  Search,
  Filter,
  Palette,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  MessageCircle,
} from "lucide-react";

interface CollectorDetailClientProps {
  collector: Collector;
  interests?: CollectorArtworkInterest[];
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function formatPrice(price: number | null | undefined, visibility?: string): string {
  if (visibility === "Price on Request" || visibility === "Price on request") {
    return "Price on Request";
  }
  if (price !== null && price !== undefined && !isNaN(price)) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  }
  return "N/A";
}

export function CollectorDetailClient({
  collector,
  interests = [],
}: CollectorDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const initialTab = searchParams.get("tab") === "collection" ? "collection" : "overview";
  const [activeTab, setActiveTab] = useState<"overview" | "collection">(initialTab);

  const [collectorState, setCollectorState] = useState<Collector>(collector);
  const [interestsState, setInterestsState] = useState<CollectorArtworkInterest[]>(interests);
  const [isArchived, setIsArchived] = useState(collector.status === "pending");
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Interest Filters & Chat Modal
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInterestForChat, setSelectedInterestForChat] =
    useState<CollectorArtworkInterest | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const isSuspended = collectorState.status === "suspended";

  // Suspend / Revert Suspension
  const handleConfirmSuspendToggle = async () => {
    const nextStatus: CollectorStatus = isSuspended ? "active" : "suspended";
    setIsActionLoading(true);
    try {
      const res = await updateCollectorAction(collectorState.id, { status: nextStatus });
      if (!res.success) {
        toast.error(
          isSuspended ? "Failed to revert suspension" : "Failed to suspend collector",
          res.error || "Please try again."
        );
      } else {
        setCollectorState((prev) => ({ ...prev, status: nextStatus }));
        toast.success(
          nextStatus === "suspended" ? "Collector Suspended" : "Suspension Reverted",
          nextStatus === "suspended"
            ? `${collectorState.name} has been suspended.`
            : `Suspension reverted. ${collectorState.name}'s account is active.`
        );
        setIsSuspendModalOpen(false);
      }
    } catch {
      toast.error("Network Error", "Could not complete moderation action.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Delete Account
  const handleConfirmDelete = async () => {
    setIsActionLoading(true);
    try {
      const res = await deleteCollectorAction(collectorState.id);
      if (!res.success) {
        toast.error("Failed to delete account", res.error || "Please try again.");
        setIsActionLoading(false);
      } else {
        toast.success("Account Deleted", `${collectorState.name}'s profile was removed.`);
        setIsDeleteModalOpen(false);
        router.push("/admin/collectors");
      }
    } catch {
      toast.error("Network Error", "Could not delete account.");
      setIsActionLoading(false);
    }
  };

  // Archive / Revert Archive
  const handleConfirmArchive = async () => {
    setIsActionLoading(true);
    const nextArchived = !isArchived;
    const nextStatus: CollectorStatus = nextArchived ? "pending" : "active";
    try {
      const res = await updateCollectorAction(collectorState.id, { status: nextStatus });
      if (!res.success) {
        toast.error(
          nextArchived ? "Failed to archive collector" : "Failed to revert archive",
          res.error || "Please try again."
        );
      } else {
        setIsArchived(nextArchived);
        setCollectorState((prev) => ({ ...prev, status: nextStatus }));
        toast.success(
          nextArchived ? "Collector Archived" : "Archive Reverted",
          nextArchived
            ? `${collectorState.name} moved to archive.`
            : `${collectorState.name} restored from archive to active status.`
        );
        setIsArchiveModalOpen(false);
      }
    } catch {
      toast.error("Network Error", "Could not update archive status.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Update Inquiry Status (Active, Pending, Rejected, Closed)
  const handleUpdateInquiryStatus = async (chatId: string, newStatus: string) => {
    setStatusUpdatingId(chatId);
    try {
      const res = await updateInquiryStatusAction(chatId, newStatus);
      if (res.success) {
        setInterestsState((prev) =>
          prev.map((item) => (item.id === chatId ? { ...item, status: newStatus } : item))
        );
        if (selectedInterestForChat && selectedInterestForChat.id === chatId) {
          setSelectedInterestForChat((prev) => prev ? { ...prev, status: newStatus } : null);
        }
        toast.success("Status Updated", `Inquiry status changed to ${newStatus}.`);
      } else {
        toast.error("Failed to update status", res.error || "Please try again.");
      }
    } catch {
      toast.error("Network Error", "Could not update inquiry status.");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Filtered Interests
  const filteredInterests = useMemo(() => {
    return interestsState.filter((item) => {
      if (statusFilter !== "all") {
        if (item.status.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.artworkTitle.toLowerCase().includes(q);
        const matchesArtist = item.artistName.toLowerCase().includes(q);
        const matchesType = (item.artType || "").toLowerCase().includes(q);
        const matchesLocation = (item.location || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesArtist && !matchesType && !matchesLocation) {
          return false;
        }
      }
      return true;
    });
  }, [interestsState, statusFilter, searchQuery]);

  // Counts for filters
  const counts = useMemo(() => {
    const total = interestsState.length;
    const active = interestsState.filter((i) => i.status.toLowerCase() === "active").length;
    const pending = interestsState.filter((i) => i.status.toLowerCase() === "pending").length;
    const rejected = interestsState.filter((i) => i.status.toLowerCase() === "rejected").length;
    const closed = interestsState.filter((i) => i.status.toLowerCase() === "closed").length;
    return { total, active, pending, rejected, closed };
  }, [interestsState]);

  return (
    <div className="space-y-6 text-[#141413]">
      {/* Back button */}
      <div>
        <Link
          href="/admin/collectors"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6E6E69] hover:text-[#141413] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Collectors</span>
        </Link>
      </div>

      {/* Collector Banner Card */}
      <div className="p-6 rounded-2xl border border-[#E8E8E3] bg-white shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {collectorState.profilePicUrl ? (
              <img
                src={collectorState.profilePicUrl}
                alt={collectorState.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-[#E8E8E3]"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#EAEAE5] flex items-center justify-center text-lg font-bold text-[#141413]">
                {collectorState.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#141413]">
                  {collectorState.name}
                </h1>
                <Badge
                  variant={
                    collectorState.status === "active"
                      ? "success"
                      : collectorState.status === "pending"
                      ? "warning"
                      : "danger"
                  }
                  size="sm"
                  dot
                >
                  {collectorState.status}
                </Badge>
              </div>
              <p className="text-xs md:text-sm text-[#6E6E69] mt-0.5">
                {collectorState.email || "No email"} · {collectorState.location || "Remote"} · Joined {formatDate(collectorState.createdAt)}
              </p>
              <div className="flex items-center gap-2.5 mt-1">
                <span className="text-xs font-semibold text-[#B8532F]">
                  {collectorState.preferences || "Various Art Forms"}
                </span>
                <span className="text-[#C4C4BD]">·</span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  {interestsState.length} {interestsState.length === 1 ? "Artwork Interest" : "Artworks of Interest"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsSuspendModalOpen(true)}
              className={isSuspended ? "text-emerald-700 hover:text-emerald-800" : ""}
            >
              {isSuspended ? "Revert Suspension" : "Suspend"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsArchiveModalOpen(true)}
              className={isArchived ? "text-amber-700 hover:text-amber-800" : ""}
            >
              {isArchived ? "Revert Archive" : "Archive"}
            </Button>
            <Button
              variant="danger"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Delete Account
            </Button>
          </div>
        </div>

        {/* Confirmation Modal: Suspend / Revert Suspension */}
        <Modal
          isOpen={isSuspendModalOpen}
          onClose={() => !isActionLoading && setIsSuspendModalOpen(false)}
          title={isSuspended ? "Revert Suspension" : "Suspend Collector Account"}
          description={
            isSuspended
              ? `Revert suspension for ${collectorState.name}? This will restore their active inquiry and platform permissions.`
              : `Suspending this collector will prevent them from inquiring about artworks, communicating with creators, or accessing platform features.`
          }
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSuspendModalOpen(false)}
                disabled={isActionLoading}
              >
                Cancel
              </Button>
              <Button
                variant={isSuspended ? "primary" : "danger"}
                size="sm"
                onClick={handleConfirmSuspendToggle}
                isLoading={isActionLoading}
              >
                {isSuspended ? "Revert Suspension" : "Suspend Collector"}
              </Button>
            </>
          }
        >
          <div className="p-3 bg-[#F9F9F8] border border-[#E8E8E3] rounded-lg text-xs text-[#6E6E69] space-y-1">
            <p className="font-semibold text-[#141413]">Collector Profile:</p>
            <p>• User: {collectorState.name} ({collectorState.email || "No email"})</p>
            <p>• Status change: {isSuspended ? "active (reverted)" : "suspended"}</p>
          </div>
        </Modal>

        {/* Confirmation Modal: Delete */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => !isActionLoading && setIsDeleteModalOpen(false)}
          title="Delete Collector Account"
          description={`Permanently remove ${collectorState.name}'s profile from the platform? This action cannot be undone.`}
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isActionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
                isLoading={isActionLoading}
              >
                Delete Account Permanently
              </Button>
            </>
          }
        >
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">Critical Warning</p>
              <p>Removing this profile will delete collector access, past inquiry relations, and associated user records.</p>
            </div>
          </div>
        </Modal>

        {/* Confirmation Modal: Archive / Revert Archive */}
        <Modal
          isOpen={isArchiveModalOpen}
          onClose={() => !isActionLoading && setIsArchiveModalOpen(false)}
          title={isArchived ? "Revert Archive Status" : "Archive Collector"}
          description={
            isArchived
              ? `Revert archive status for ${collectorState.name}? This will restore the collector to active status.`
              : `Archive ${collectorState.name}'s profile to remove it from active listings while preserving interaction history.`
          }
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsArchiveModalOpen(false)}
                disabled={isActionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmArchive}
                isLoading={isActionLoading}
              >
                {isArchived ? "Revert Archive" : "Archive Collector"}
              </Button>
            </>
          }
        >
          <div className="p-3 bg-[#F9F9F8] border border-[#E8E8E3] rounded-lg text-xs text-[#6E6E69]">
            <p>Archiving preserves existing inquiries, messages, and transactional records.</p>
          </div>
        </Modal>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-1 border-b border-[#E8E8E3] overflow-x-auto scrollbar-none">
        {(
          [
            { id: "overview", label: "Profile Overview", icon: Sparkles },
            {
              id: "collection",
              label: "Collection & Activity",
              icon: ImageIcon,
              count: interestsState.length,
            },
          ] as const
        ).map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? "border-[#141413] text-[#141413]"
                  : "border-transparent text-[#6E6E69] hover:text-[#141413]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {"count" in tab && typeof tab.count === "number" && tab.count > 0 && (
                <span
                  className={`ml-1 text-xs px-2 py-0.5 rounded-full font-semibold ${
                    active
                      ? "bg-[#141413] text-white"
                      : "bg-[#EAEAE5] text-[#141413]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="py-2">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="p-5 rounded-xl border border-[#E8E8E3] bg-white">
                <h3 className="text-sm font-semibold text-[#141413] mb-4 pb-3 border-b border-[#F0F0EB]">
                  Personal Information
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-[#6E6E69]">Full Name</div>
                    <div className="col-span-2 font-medium text-[#141413]">{collector.name}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-[#6E6E69]">Email</div>
                    <div className="col-span-2 font-medium text-[#141413]">{collector.email || "Not provided"}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-[#6E6E69]">Phone</div>
                    <div className="col-span-2 font-medium text-[#141413]">{collector.phoneNumber || "Not provided"}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-[#6E6E69]">Location</div>
                    <div className="col-span-2 font-medium text-[#141413]">{collector.location || "Not provided"}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-[#6E6E69]">Preferences</div>
                    <div className="col-span-2 font-medium text-[#141413]">{collector.preferences || "Various Art Forms"}</div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="p-5 rounded-xl border border-[#E8E8E3] bg-white">
                <h3 className="text-sm font-semibold text-[#141413] mb-4 pb-3 border-b border-[#F0F0EB]">
                  About Collector
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="space-y-1.5 mt-2">
                    <div className="text-[#6E6E69]">Bio</div>
                    <div className="font-medium text-[#141413] whitespace-pre-wrap leading-relaxed text-sm">
                      {collector.aboutMe || "No bio provided."}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Overview Widget: Expressed Interests Summary */}
            <div className="p-5 rounded-xl border border-[#E8E8E3] bg-white space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EB]">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#141413]">
                    Artworks of Interest & Acquisition Inquiries
                  </h3>
                  <Badge variant="default" size="sm">
                    {interestsState.length} {interestsState.length === 1 ? "Artwork" : "Artworks"}
                  </Badge>
                </div>
                <button
                  onClick={() => setActiveTab("collection")}
                  className="text-xs font-semibold text-[#B8532F] hover:text-[#9A4222] transition-colors inline-flex items-center gap-1"
                >
                  <span>View All in Collection & Activity</span>
                  <span>→</span>
                </button>
              </div>

              {interestsState.length === 0 ? (
                <p className="text-xs text-[#6E6E69] py-3 text-center">
                  This collector has not yet raised interest on any artworks.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
                  {interestsState.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setActiveTab("collection")}
                      className="group p-3 rounded-lg border border-[#E8E8E3] bg-[#FAFAF8] hover:bg-white hover:border-[#D0D0CA] transition-all cursor-pointer flex gap-3 items-center"
                    >
                      <div className="w-14 h-14 rounded-md overflow-hidden bg-[#EAEAE5] shrink-0 border border-[#E0E0DB]">
                        {item.artworkImage ? (
                          <img
                            src={item.artworkImage}
                            alt={item.artworkTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-[#A0A09B]">
                            <Palette className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#141413] truncate">
                          {item.artworkTitle}
                        </p>
                        <p className="text-xs text-[#6E6E69] truncate">
                          by {item.artistName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-medium text-[#141413]">
                            {formatPrice(item.price, item.priceVisibility)}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                              item.status.toLowerCase() === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : item.status.toLowerCase() === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : item.status.toLowerCase() === "rejected"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-neutral-100 text-neutral-800"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Collection & Activity */}
        {activeTab === "collection" && (
          <div className="space-y-5">
            {/* Header with Title and Metrics */}
            <div className="p-5 rounded-2xl border border-[#E8E8E3] bg-white space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-[#141413] flex items-center gap-2">
                    <span>Artworks of Interest & Expressed Inquiries</span>
                    <Badge variant="default" size="sm">
                      {interestsState.length}
                    </Badge>
                  </h2>
                  <p className="text-xs text-[#6E6E69] mt-0.5">
                    Artworks where {collectorState.name} clicked &quot;Express Interest&quot; to initiate acquisition inquiries with creators.
                  </p>
                </div>

                {/* Status KPI Chips */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="px-3 py-1.5 rounded-lg bg-[#F7F7F5] border border-[#E8E8E3] text-xs">
                    <span className="text-[#6E6E69]">Total:</span>{" "}
                    <span className="font-bold text-[#141413]">{counts.total}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                    <span className="text-emerald-700">Active:</span>{" "}
                    <span className="font-bold">{counts.active}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    <span className="text-amber-700">Pending:</span>{" "}
                    <span className="font-bold">{counts.pending}</span>
                  </div>
                  {(counts.rejected > 0 || counts.closed > 0) && (
                    <div className="px-3 py-1.5 rounded-lg bg-neutral-100 border border-neutral-200 text-xs text-neutral-700">
                      <span className="text-neutral-600">Other:</span>{" "}
                      <span className="font-bold">{counts.rejected + counts.closed}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[#F0F0EB]">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E98]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by artwork title, artist, medium..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#E8E8E3] bg-[#FAFAF8] text-[#141413] placeholder:text-[#9E9E98] focus:outline-none focus:border-[#141413] transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#9E9E98] hover:text-[#141413]"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Status Filter Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                  <span className="text-xs text-[#6E6E69] mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Filter:
                  </span>
                  {[
                    { id: "all", label: "All", count: counts.total },
                    { id: "active", label: "Active", count: counts.active },
                    { id: "pending", label: "Pending", count: counts.pending },
                    { id: "rejected", label: "Rejected", count: counts.rejected },
                    { id: "closed", label: "Closed", count: counts.closed },
                  ].map((filter) => {
                    const active = statusFilter === filter.id;
                    return (
                      <button
                        key={filter.id}
                        onClick={() => setStatusFilter(filter.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                          active
                            ? "bg-[#141413] text-white"
                            : "bg-[#FAFAF8] border border-[#E8E8E3] text-[#6E6E69] hover:text-[#141413]"
                        }`}
                      >
                        {filter.label} ({filter.count})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* List / Cards of Artworks */}
            {filteredInterests.length === 0 ? (
              <div className="p-12 text-center bg-white border border-[#E8E8E3] rounded-2xl space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#FAFAF8] border border-[#E8E8E3] flex items-center justify-center mx-auto text-[#6E6E69]">
                  <Palette className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#141413]">
                    {searchQuery || statusFilter !== "all"
                      ? "No matching artworks found"
                      : "No artworks of interest recorded yet"}
                  </h3>
                  <p className="text-xs text-[#6E6E69] max-w-md mx-auto mt-1">
                    {searchQuery || statusFilter !== "all"
                      ? "Try adjusting your search keywords or status filter pills above."
                      : "When this collector clicks 'Express Interest' on artworks, the target artworks, artist communications, and negotiation records will appear here."}
                  </p>
                </div>
                {(searchQuery || statusFilter !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                    }}
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInterests.map((interest) => (
                  <div
                    key={interest.id}
                    className="p-5 rounded-2xl border border-[#E8E8E3] bg-white shadow-xs hover:border-[#D5D5CF] transition-all space-y-4"
                  >
                    <div className="flex flex-col md:flex-row gap-5 items-start">
                      {/* Artwork Image */}
                      <div className="w-full md:w-44 h-44 rounded-xl overflow-hidden bg-[#FAFAF8] border border-[#E8E8E3] shrink-0 relative group">
                        {interest.artworkImage ? (
                          <img
                            src={interest.artworkImage}
                            alt={interest.artworkTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-xs text-[#A0A09B] gap-1">
                            <Palette className="w-8 h-8" />
                            <span>No Image</span>
                          </div>
                        )}
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 text-white backdrop-blur-xs">
                          {interest.artType || "Artwork"}
                        </span>
                      </div>

                      {/* Content Details */}
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold text-[#141413] tracking-tight">
                                {interest.artworkTitle}
                              </h3>
                              {/* Artwork Availability Badge */}
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                {interest.artworkStatus || "Available"}
                              </span>
                            </div>

                            <p className="text-xs text-[#6E6E69] mt-0.5">
                              Created by{" "}
                              <span className="font-semibold text-[#141413]">
                                {interest.artistName}
                              </span>
                              {interest.creatorEmail && ` (${interest.creatorEmail})`}
                            </p>
                          </div>

                          {/* Inquiry Status Badge & Status Selector */}
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                interest.status.toLowerCase() === "active"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : interest.status.toLowerCase() === "pending"
                                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                                  : interest.status.toLowerCase() === "rejected"
                                  ? "bg-rose-50 text-rose-800 border border-rose-200"
                                  : "bg-neutral-100 text-neutral-800 border border-neutral-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  interest.status.toLowerCase() === "active"
                                    ? "bg-emerald-500 animate-pulse"
                                    : interest.status.toLowerCase() === "pending"
                                    ? "bg-amber-500"
                                    : interest.status.toLowerCase() === "rejected"
                                    ? "bg-rose-500"
                                    : "bg-neutral-400"
                                }`}
                              />
                              Inquiry: {interest.status}
                            </span>

                            {/* Status Change Selector for Admin */}
                            <select
                              value={interest.status}
                              disabled={statusUpdatingId === interest.id}
                              onChange={(e) =>
                                handleUpdateInquiryStatus(interest.id, e.target.value)
                              }
                              className="text-xs bg-[#FAFAF8] border border-[#E8E8E3] rounded-lg px-2 py-1 text-[#141413] focus:outline-none focus:border-[#141413] cursor-pointer disabled:opacity-50"
                              title="Update inquiry status"
                            >
                              <option value="Active">Active</option>
                              <option value="Pending">Pending</option>
                              <option value="Rejected">Rejected</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </div>
                        </div>

                        {/* Metadata specs row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 px-3 rounded-lg bg-[#FAFAF8] border border-[#E8E8E3] text-xs">
                          <div>
                            <span className="text-[#8E8E88] block text-[10px] uppercase font-semibold">
                              Price
                            </span>
                            <span className="font-bold text-[#141413]">
                              {formatPrice(interest.price, interest.priceVisibility)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#8E8E88] block text-[10px] uppercase font-semibold">
                              Dimensions
                            </span>
                            <span className="text-[#141413]">
                              {interest.dimensions || "Not specified"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#8E8E88] block text-[10px] uppercase font-semibold">
                              Year
                            </span>
                            <span className="text-[#141413]">{interest.year || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-[#8E8E88] block text-[10px] uppercase font-semibold">
                              Interest Raised
                            </span>
                            <span className="text-[#141413] flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#8E8E88]" />
                              {formatDate(interest.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Collector's Initial Inquiry Message Quote */}
                        {interest.initialMessage && (
                          <div className="p-3 rounded-lg bg-[#F5F5F0] border border-[#EAEAE5] text-xs space-y-1">
                            <div className="flex items-center gap-1.5 text-[#6E6E69] font-medium text-[11px]">
                              <MessageSquare className="w-3.5 h-3.5 text-[#B8532F]" />
                              <span>Collector&apos;s Initial Expression of Interest:</span>
                            </div>
                            <p className="text-[#141413] italic font-serif text-sm">
                              &ldquo;{interest.initialMessage}&rdquo;
                            </p>
                          </div>
                        )}

                        {/* Footer action bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-2 text-xs text-[#6E6E69]">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Timestamp: {formatDateTime(interest.createdAt)}
                            </span>
                            <span>•</span>
                            <span className="font-medium text-[#141413]">
                              {interest.messagesCount} {interest.messagesCount === 1 ? "message" : "messages"} exchanged
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Open Full Conversation Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedInterestForChat(interest)}
                              className="text-xs flex items-center gap-1.5 border-[#141413] text-[#141413] hover:bg-[#141413] hover:text-white transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>View Conversation ({interest.messagesCount})</span>
                            </Button>

                            {/* View in Artwork Catalog */}
                            <Link
                              href="/admin/artworks"
                              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#E8E8E3] bg-[#FAFAF8] text-[#6E6E69] hover:text-[#141413] hover:border-[#141413] transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Artwork Catalog</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Conversation Thread Dialogue Modal */}
      {selectedInterestForChat && (
        <Modal
          isOpen={!!selectedInterestForChat}
          onClose={() => setSelectedInterestForChat(null)}
          title={`Inquiry Dialogue — "${selectedInterestForChat.artworkTitle}"`}
          description={`Direct acquisition discussion thread between ${selectedInterestForChat.collectorName} and creator ${selectedInterestForChat.artistName}.`}
          footer={
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#6E6E69]">
                <span>Status:</span>
                <span className="font-semibold text-[#141413]">
                  {selectedInterestForChat.status}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedInterestForChat(null)}
              >
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Artwork banner inside modal */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#FAFAF8] border border-[#E8E8E3]">
              <div className="w-12 h-12 rounded-md overflow-hidden bg-[#EAEAE5] shrink-0 border border-[#E0E0DB]">
                {selectedInterestForChat.artworkImage ? (
                  <img
                    src={selectedInterestForChat.artworkImage}
                    alt={selectedInterestForChat.artworkTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-[#A0A09B]">
                    <Palette className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-[#141413] truncate">
                  {selectedInterestForChat.artworkTitle}
                </h4>
                <p className="text-xs text-[#6E6E69]">
                  Artist: {selectedInterestForChat.artistName} · Price:{" "}
                  {formatPrice(selectedInterestForChat.price, selectedInterestForChat.priceVisibility)}
                </p>
              </div>
              <Badge
                variant={
                  selectedInterestForChat.status.toLowerCase() === "active"
                    ? "success"
                    : selectedInterestForChat.status.toLowerCase() === "pending"
                    ? "warning"
                    : "default"
                }
                size="sm"
              >
                {selectedInterestForChat.status}
              </Badge>
            </div>

            {/* Messages Thread Container */}
            <div className="p-4 rounded-xl border border-[#E8E8E3] bg-[#FAFAF8] max-h-96 overflow-y-auto space-y-3">
              {selectedInterestForChat.messages.length === 0 ? (
                <p className="text-xs text-[#8E8E88] text-center py-6">
                  No message history recorded for this inquiry.
                </p>
              ) : (
                selectedInterestForChat.messages.map((msg) => {
                  const isCollectorMsg = msg.isCollector;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isCollectorMsg ? "items-start" : "items-end"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[11px] text-[#6E6E69]">
                        <span className="font-semibold text-[#141413]">
                          {isCollectorMsg
                            ? `${selectedInterestForChat.collectorName} (Collector)`
                            : `${selectedInterestForChat.artistName} (Creator)`}
                        </span>
                        <span>·</span>
                        <span>{formatDateTime(msg.createdAt)}</span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-2xs ${
                          isCollectorMsg
                            ? "bg-white border border-[#E8E8E3] text-[#141413] rounded-tl-xs"
                            : "bg-[#141413] text-white rounded-tr-xs"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
