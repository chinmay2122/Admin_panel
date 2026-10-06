"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Collector, CollectorStatus } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui";
import { updateCollectorAction, deleteCollectorAction } from "@/app/admin/actions";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Calendar,
  Sparkles,
  Phone,
  ImageIcon,
  AlertTriangle,
} from "lucide-react";

interface CollectorDetailClientProps {
  collector: Collector;
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

export function CollectorDetailClient({
  collector,
}: CollectorDetailClientProps) {
  const router = useRouter();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "collection">("overview");

  const [collectorState, setCollectorState] = useState<Collector>(collector);
  const [isArchived, setIsArchived] = useState(collector.status === "pending");
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

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
              <div className="text-xs font-semibold text-[#B8532F] mt-1">
                {collectorState.preferences || "Various Art Forms"}
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
            { id: "collection", label: "Collection & Activity", icon: ImageIcon },
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
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="py-2">
        {activeTab === "overview" && (
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
        )}

        {activeTab === "collection" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#141413]">
              Collection & Activity
            </h3>
            <div className="p-8 text-center bg-[#FAFAF8] border border-[#E8E8E3] rounded-xl text-[#6E6E69] text-sm">
              Collection data, purchases, and saved artworks are not tracked in the current database schema.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
