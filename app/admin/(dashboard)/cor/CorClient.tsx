"use client";

import React, { useState, useMemo } from "react";
import {
  Award,
  Search,
  Plus,
  UserCheck,
  Trash2,
  Clock,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Shield,
} from "lucide-react";
import { CorMember, CorMemberStatus, User } from "@/lib/types";
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
import { Modal } from "@/components/ui/Modal";
import { FilterBar } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui";
import {
  addCorMemberAction,
  updateCorMemberAction,
  removeCorMemberAction,
} from "@/app/admin/actions";

interface CorClientProps {
  initialMembers: CorMember[];
  availableUsers: User[];
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

export function CorClient({ initialMembers, availableUsers }: CorClientProps) {
  const toast = useToast();
  const [members, setMembers] = useState<CorMember[]>(initialMembers);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Remove confirmation modal state
  const [memberToRemove, setMemberToRemove] = useState<CorMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Status toggle action loading
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Computed counts
  const totalCount = members.length;
  const activeCount = members.filter((m) => m.status === "active").length;
  const expiredCount = members.filter((m) => m.status === "expired").length;

  // Users eligible for addition (not already active in COR)
  const existingUserIds = useMemo(
    () => new Set(members.map((m) => m.userId)),
    [members]
  );

  const eligibleUsers = useMemo(() => {
    return availableUsers.filter((u) => {
      if (existingUserIds.has(u.id)) return false;
      if (userSearchQuery.trim()) {
        const q = userSearchQuery.toLowerCase().trim();
        return (
          u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [availableUsers, existingUserIds, userSearchQuery]);

  // Filtering members by search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase().trim();
    return members.filter((m) => m.name.toLowerCase().includes(q));
  }, [members, searchQuery]);

  // Pagination
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  // Action: Toggle Active / Expired status (optimistic)
  const handleToggleStatus = async (member: CorMember) => {
    const nextStatus: CorMemberStatus =
      member.status === "active" ? "expired" : "active";
    const previous = [...members];

    setMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, status: nextStatus } : m))
    );
    setActionLoadingId(member.id);

    try {
      const res = await updateCorMemberAction(member.id, { status: nextStatus });
      if (!res.success) {
        setMembers(previous);
        toast.error("Failed to update status", res.error || "Please try again.");
      } else {
        toast.success(
          nextStatus === "expired" ? "Member expired" : "Member reactivated",
          `${member.name} marked as ${nextStatus}.`
        );
      }
    } catch {
      setMembers(previous);
      toast.error("Network error", "Could not update member status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Action: Remove Member (optimistic)
  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;
    const target = memberToRemove;
    const previous = [...members];

    setMembers((prev) => prev.filter((m) => m.id !== target.id));
    setMemberToRemove(null);
    setIsRemoving(true);

    try {
      const res = await removeCorMemberAction(target.id, target.userId);
      if (!res.success) {
        setMembers(previous);
        toast.error("Failed to remove member", res.error || "Please try again.");
      } else {
        toast.success("Member removed", `${target.name} removed from COR.`);
      }
    } catch {
      setMembers(previous);
      toast.error("Network error", "Could not remove member.");
    } finally {
      setIsRemoving(false);
    }
  };

  // Action: Add Member (optimistic)
  const handleAddMember = async () => {
    if (!selectedUserId) {
      setAddError("Please select a community member to enroll.");
      return;
    }
    const user = availableUsers.find((u) => u.id === selectedUserId);
    if (!user) return;

    setAddError(null);
    setIsAdding(true);

    const tempMember: CorMember = {
      id: `cor_${Date.now()}`,
      userId: user.id,
      name: user.name,
      joinedAt: new Date().toISOString(),
      status: "active",
    };

    // Optimistic insert
    setMembers((prev) => [tempMember, ...prev]);

    try {
      const res = await addCorMemberAction(user.id, user.name);
      if (!res.success) {
        setMembers((prev) => prev.filter((m) => m.id !== tempMember.id));
        setAddError(res.error || "Failed to add member.");
        toast.error("Failed to enroll member", res.error || "Please try again.");
      } else if (res.member) {
        // Update with real ID
        setMembers((prev) =>
          prev.map((m) => (m.id === tempMember.id ? res.member! : m))
        );
        setIsAddModalOpen(false);
        setSelectedUserId("");
        setUserSearchQuery("");
        toast.success("Member enrolled", `${user.name} added to COR fellowship.`);
      }
    } catch {
      setMembers((prev) => prev.filter((m) => m.id !== tempMember.id));
      setAddError("An error occurred while enrolling the member.");
      toast.error("Network error", "Could not enroll member.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header with Title and Add Member Button */}
      <div className="border-b border-[#E8E8E3] pb-5 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-medium tracking-tight text-[#141413]">
            COR (Circle of Renaissance)
          </h2>
          <p className="mt-1 text-xs md:text-sm text-[#6E6E69]">
            Archival records, curated studio fellowship, and recognized patrons.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setIsAddModalOpen(true);
            setAddError(null);
            setSelectedUserId("");
          }}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Member
        </Button>
      </div>

      {/* Top Counts: Total & Active */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
        <div className="bg-white border border-[#E8E8E3] rounded-lg p-4">
          <p className="text-xs font-medium text-[#6E6E69]">Total Enrolled</p>
          <p className="text-2xl font-semibold tracking-tight text-[#141413] mt-1">
            {totalCount}
          </p>
          <p className="text-[11px] text-[#6E6E69] mt-0.5">Circle members</p>
        </div>

        <div className="bg-white border border-[#E8E8E3] rounded-lg p-4">
          <p className="text-xs font-medium text-[#6E6E69]">Active Fellows</p>
          <p className="text-2xl font-semibold tracking-tight text-[#141413] mt-1">
            {activeCount}
          </p>
          <p className="text-[11px] text-[#28633B] mt-0.5">Current in good standing</p>
        </div>

        <div className="bg-white border border-[#E8E8E3] rounded-lg p-4 col-span-2 sm:col-span-1">
          <p className="text-xs font-medium text-[#6E6E69]">Expired / Past</p>
          <p className="text-2xl font-semibold tracking-tight text-[#141413] mt-1">
            {expiredCount}
          </p>
          <p className="text-[11px] text-[#71716D] mt-0.5">Archived records</p>
        </div>
      </div>

      {/* Search FilterBar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search COR member by name..."
        hasActiveFilters={Boolean(searchQuery)}
        onResetFilters={() => setSearchQuery("")}
      >
        <span className="text-xs text-[#71716D]">
          {filteredMembers.length} {filteredMembers.length === 1 ? "member" : "members"}
        </span>
      </FilterBar>

      {/* Members Table */}
      {filteredMembers.length === 0 ? (
        <EmptyState
          icon={<Award className="w-5 h-5 text-[#8A8A85]" />}
          title="No COR members found"
          description={
            searchQuery
              ? `No circle member matches "${searchQuery}".`
              : "No members enrolled in the Circle of Renaissance yet."
          }
          action={
            searchQuery ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Member Name</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {paginatedMembers.map((member) => (
                <TableRow key={member.id}>
                  {/* Name */}
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#EAEAE5] border border-[#DCDCD6] flex items-center justify-center text-xs font-semibold text-[#141413] shrink-0">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-[#141413]">
                          {member.name}
                        </p>
                        <p className="text-[11px] text-[#71716D]">
                          ID: {member.id}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Joined Date */}
                  <TableCell className="text-xs text-[#6E6E69]">
                    {formatDate(member.joinedAt)}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge
                      variant={member.status === "active" ? "success" : "default"}
                      size="sm"
                      dot
                    >
                      {member.status === "active" ? "Active" : "Expired"}
                    </Badge>
                  </TableCell>

                  {/* Actions: Expire / Reactivate & Remove */}
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {member.status === "active" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionLoadingId === member.id}
                          onClick={() => handleToggleStatus(member)}
                          className="text-[#6E6E69] hover:text-[#B83838]"
                        >
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          Expire
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionLoadingId === member.id}
                          onClick={() => handleToggleStatus(member)}
                          className="text-[#28633B] hover:text-[#1F4F2F]"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          Reactivate
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMemberToRemove(member)}
                        className="text-[#8A8A85] hover:text-[#B83838]"
                        aria-label="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredMembers.length}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      )}

      {/* ADD MEMBER MODAL (Pick from existing users) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Enroll Circle Member"
        description="Select an existing community member to induct into the Circle of Renaissance."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isAdding}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddMember}
              isLoading={isAdding}
              disabled={!selectedUserId}
              leftIcon={<Award className="w-3.5 h-3.5" />}
            >
              Enroll Member
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {addError && (
            <div className="p-2.5 rounded-lg bg-[#FDF2F2] border border-[#F2C6C6] text-xs text-[#9E3333] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{addError}</span>
            </div>
          )}

          {/* Search within available users */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8A8A85] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              placeholder="Search user by name or email..."
              className="w-full h-8 pl-8 pr-3 text-xs bg-[#FAFAF8] text-[#141413] placeholder:text-[#9A9A94] border border-[#E8E8E3] rounded-lg focus:outline-none focus:border-[#B8532F] focus:ring-1 focus:ring-[#B8532F]"
            />
          </div>

          {/* User Selection List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-[#F0F0EB] border border-[#E8E8E3] rounded-lg">
            {eligibleUsers.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#8A8A85]">
                {userSearchQuery
                  ? "No matching users found."
                  : "All available platform users are already enrolled in COR."}
              </div>
            ) : (
              eligibleUsers.map((user) => {
                const isSelected = selectedUserId === user.id;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedUserId(user.id)}
                    className={`w-full text-left p-3 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#FAF5EC] border-l-2 border-[#B8532F]"
                        : "hover:bg-[#FAFAF8]"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-medium text-[#141413] truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-[#71716D] truncate">
                        {user.email} • <span className="capitalize">{user.role}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {user.plan && (
                        <Badge variant="outline" size="sm">
                          {user.plan.toUpperCase()}
                        </Badge>
                      )}
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? "border-[#B8532F] bg-[#B8532F] text-white"
                            : "border-[#D0D0CA] bg-white"
                        }`}
                      >
                        {isSelected && <span className="text-[9px]">✓</span>}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </Modal>

      {/* REMOVE MEMBER CONFIRMATION MODAL */}
      <Modal
        isOpen={Boolean(memberToRemove)}
        onClose={() => setMemberToRemove(null)}
        title="Remove Circle Member"
        description="Revoke COR enrollment from this member."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMemberToRemove(null)}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmRemove}
              isLoading={isRemoving}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Confirm Removal
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-[#52524E]">
          <p>
            Are you sure you want to remove{" "}
            <span className="font-semibold text-[#141413]">
              {memberToRemove?.name}
            </span>{" "}
            from the Circle of Renaissance?
          </p>
          <p className="text-[11px] text-[#71716D]">
            This will update their user profile badge and remove them from active
            circle honors.
          </p>
        </div>
      </Modal>
    </div>
  );
}
