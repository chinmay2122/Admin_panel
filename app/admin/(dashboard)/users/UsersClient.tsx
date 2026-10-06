"use client";

import React, { useState, useMemo } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Ban,
  CheckCircle,
  AlertTriangle,
  User as UserIcon,
  Shield,
  Award,
} from "lucide-react";
import { User, UserRole, UserPlan, UserStatus } from "@/lib/types";
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
import { ExportDropdown } from "@/components/admin/ExportDropdown";
import { FilterBar } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui";
import { updateUserAction, deleteUserAction } from "@/app/admin/actions";

interface UsersClientProps {
  initialUsers: User[];
}

type TabType = "all" | "creators" | "collectors" | "free" | "elite" | "pro";
type SortField = "name" | "email" | "role" | "plan" | "status" | "createdAt";
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

export function UsersClient({ initialUsers }: UsersClientProps) {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Drawer & selected user state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Tab definitions
  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: "all", label: "All", count: users.length },
    {
      id: "creators",
      label: "Creators",
      count: users.filter((u) => u.role === "creator").length,
    },
    {
      id: "collectors",
      label: "Collectors",
      count: users.filter((u) => u.role === "collector").length,
    },
    {
      id: "free",
      label: "Free",
      count: users.filter((u) => u.plan === "free").length,
    },
    {
      id: "elite",
      label: "Elite",
      count: users.filter((u) => u.plan === "elite").length,
    },
    {
      id: "pro",
      label: "Pro",
      count: users.filter((u) => u.plan === "pro").length,
    },
  ];

  // Filtering
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Tab filter
      if (activeTab === "creators" && user.role !== "creator") return false;
      if (activeTab === "collectors" && user.role !== "collector") return false;
      if (activeTab === "free" && user.plan !== "free") return false;
      if (activeTab === "elite" && user.plan !== "elite") return false;
      if (activeTab === "pro" && user.plan !== "pro") return false;

      // Search query (name or email)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = user.name.toLowerCase().includes(q);
        const matchesEmail = user.email.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail) return false;
      }

      return true;
    });
  }, [users, activeTab, searchQuery]);

  // Sorting
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let aVal = a[sortField] || "";
      let bVal = b[sortField] || "";

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
  }, [filteredUsers, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedUsers.slice(start, start + pageSize);
  }, [sortedUsers, currentPage, pageSize]);

  // Handle Sort
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
      return <ArrowUpDown className="w-3 h-3 text-[#A0A09B] opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3 h-3 text-[#B8532F]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#B8532F]" />
    );
  };

  // Open User Drawer
  const handleRowClick = (user: User) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
  };

  // Suspend / Reactivate action (optimistic)
  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    const nextStatus: UserStatus =
      selectedUser.status === "active" ? "suspended" : "active";
    const previousUser = { ...selectedUser };

    // Optimistic local update
    const updatedUser = { ...selectedUser, status: nextStatus };
    setSelectedUser(updatedUser);
    setUsers((prev) =>
      prev.map((u) => (u.id === selectedUser.id ? updatedUser : u))
    );

    setIsUpdatingStatus(true);
    try {
      const res = await updateUserAction(selectedUser.id, { status: nextStatus });
      if (!res.success) {
        // Rollback
        setSelectedUser(previousUser);
        setUsers((prev) =>
          prev.map((u) => (u.id === selectedUser.id ? previousUser : u))
        );
        toast.error("Failed to update status", res.error || "Please try again.");
      } else {
        toast.success(
          nextStatus === "suspended" ? "User suspended" : "Suspension reverted",
          nextStatus === "suspended"
            ? `${selectedUser.name} has been suspended.`
            : `Suspension reverted. ${selectedUser.name} is active.`
        );
      }
    } catch {
      setSelectedUser(previousUser);
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? previousUser : u))
      );
      toast.error("Network error", "Could not complete status update.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Delete User action (optimistic)
  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    const targetId = selectedUser.id;
    const deletedName = selectedUser.name;
    const previousUsers = [...users];

    // Optimistic removal
    setUsers((prev) => prev.filter((u) => u.id !== targetId));
    setIsDeleteModalOpen(false);
    setIsDrawerOpen(false);
    setSelectedUser(null);

    setIsDeleting(true);
    try {
      const res = await deleteUserAction(targetId);
      if (!res.success) {
        // Rollback
        setUsers(previousUsers);
        toast.error("Failed to delete user", res.error || "Could not delete user.");
      } else {
        toast.success("User deleted", `${deletedName} was permanently removed.`);
      }
    } catch {
      setUsers(previousUsers);
      toast.error("Network error", "Could not complete deletion.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Title & Stats Badge */}
      <div className="border-b border-[#E8E8E3] pb-5 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-medium tracking-tight text-[#141413]">
            Users
          </h2>
          <p className="mt-1 text-xs md:text-sm text-[#6E6E69]">
            Manage member accounts, permissions, and moderation status.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <ExportDropdown exportType="users" filters={{ query: searchQuery, role: activeTab === "all" ? undefined : activeTab }} />
          <div className="text-xs text-[#6E6E69] font-medium">
            Total: <span className="text-[#141413]">{users.length} members</span>
          </div>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="border-b border-[#E8E8E3] flex items-center gap-1 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium -mb-px transition-colors cursor-pointer select-none whitespace-nowrap ${
                isActive
                  ? "text-[#141413] border-b-2 border-[#B8532F]"
                  : "text-[#6E6E69] hover:text-[#141413] border-b-2 border-transparent"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded ${
                  isActive
                    ? "bg-[#F8EFEA] text-[#9E4323]"
                    : "bg-[#F3F3EF] text-[#6E6E69]"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Reusable FilterBar (Search input) */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search users by name or email..."
        hasActiveFilters={Boolean(searchQuery)}
        onResetFilters={() => setSearchQuery("")}
      >
        <span className="text-xs text-[#71716D]">
          {sortedUsers.length} {sortedUsers.length === 1 ? "user" : "users"} found
        </span>
      </FilterBar>

      {/* Table Container */}
      {sortedUsers.length === 0 ? (
        <EmptyState
          icon={<UserIcon className="w-5 h-5 text-[#8A8A85]" />}
          title="No users found"
          description={
            searchQuery
              ? `No user matched "${searchQuery}". Try adjusting your keywords or clearing the filter.`
              : "There are no users in this tab category yet."
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
                <TableHead>
                  <button
                    onClick={() => handleSort("name")}
                    className="group inline-flex items-center gap-1.5 hover:text-[#141413] cursor-pointer"
                  >
                    <span>Name</span>
                    {renderSortIndicator("name")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("email")}
                    className="group inline-flex items-center gap-1.5 hover:text-[#141413] cursor-pointer"
                  >
                    <span>Email</span>
                    {renderSortIndicator("email")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("role")}
                    className="group inline-flex items-center gap-1.5 hover:text-[#141413] cursor-pointer"
                  >
                    <span>Role</span>
                    {renderSortIndicator("role")}
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
                <TableHead>COR</TableHead>
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
              {paginatedUsers.map((user) => (
                <TableRow
                  key={user.id}
                  onClick={() => handleRowClick(user)}
                  className="cursor-pointer"
                >
                  {/* Name */}
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#EAEAE5] border border-[#DCDCD6] flex items-center justify-center text-xs font-medium text-[#141413] shrink-0">
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-medium text-[#141413]">
                        {user.name}
                      </span>
                    </div>
                  </TableCell>

                  {/* Email */}
                  <TableCell className="text-[#6E6E69]">{user.email}</TableCell>

                  {/* Role */}
                  <TableCell>
                    <Badge
                      variant={user.role === "creator" ? "accent" : "default"}
                      size="sm"
                    >
                      {user.role}
                    </Badge>
                  </TableCell>

                  {/* Plan */}
                  <TableCell>
                    {user.plan ? (
                      <Badge
                        variant={
                          user.plan === "elite"
                            ? "warning"
                            : user.plan === "pro"
                            ? "accent"
                            : "default"
                        }
                        size="sm"
                      >
                        {user.plan}
                      </Badge>
                    ) : (
                      <span className="text-xs text-[#8A8A85]">—</span>
                    )}
                  </TableCell>

                  {/* COR Badge */}
                  <TableCell>
                    {user.isCorMember ? (
                      <Badge variant="accent" size="sm" dot>
                        Yes
                      </Badge>
                    ) : (
                      <Badge variant="outline" size="sm">
                        No
                      </Badge>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge
                      variant={user.status === "active" ? "success" : "danger"}
                      size="sm"
                      dot
                    >
                      {user.status}
                    </Badge>
                  </TableCell>

                  {/* Joined Date */}
                  <TableCell className="text-xs text-[#6E6E69]">
                    {formatDate(user.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Reusable Pagination */}
          <Pagination
            currentPage={currentPage}
            totalItems={sortedUsers.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      {/* Side Drawer: User Details & Actions */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedUser?.name || "User Details"}
        description="Member profile and account administrative controls"
        footer={
          selectedUser && (
            <div className="flex items-center justify-between w-full">
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete User
              </Button>

              <Button
                variant={selectedUser.status === "active" ? "outline" : "primary"}
                size="sm"
                onClick={handleToggleStatus}
                isLoading={isUpdatingStatus}
                leftIcon={
                  selectedUser.status === "active" ? (
                    <Ban className="w-3.5 h-3.5" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )
                }
              >
                {selectedUser.status === "active"
                  ? "Suspend User"
                  : "Revert Suspension"}
              </Button>
            </div>
          )
        }
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* User Hero Header in Drawer */}
            <div className="flex items-center gap-3.5 pb-5 border-b border-[#E8E8E3]">
              <div className="w-12 h-12 rounded-full bg-[#EAEAE5] border border-[#DCDCD6] flex items-center justify-center text-base font-semibold text-[#141413]">
                {selectedUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-[#141413] truncate">
                  {selectedUser.name}
                </h4>
                <p className="text-xs text-[#6E6E69] truncate">
                  {selectedUser.email}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Badge
                    variant={selectedUser.status === "active" ? "success" : "danger"}
                    size="sm"
                    dot
                  >
                    {selectedUser.status}
                  </Badge>
                  {selectedUser.isCorMember && (
                    <Badge variant="accent" size="sm" dot>
                      COR Member
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Attributes List */}
            <div className="space-y-3.5 text-xs">
              <h5 className="font-medium text-[#141413] uppercase tracking-wider text-[11px] text-[#8A8A85]">
                Account Metadata
              </h5>

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">User ID</span>
                <span className="font-mono text-[11px] text-[#141413] bg-[#F5F5F0] px-1.5 py-0.5 rounded">
                  {selectedUser.id}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Platform Role</span>
                <span className="font-medium text-[#141413] capitalize">
                  {selectedUser.role}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Subscription Plan</span>
                <span className="font-medium text-[#141413] uppercase">
                  {selectedUser.plan || "Free / None"}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">COR Circle</span>
                <span className="font-medium text-[#141413]">
                  {selectedUser.isCorMember ? "Enrolled Fellow" : "Not Enrolled"}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Registered Date</span>
                <span className="font-medium text-[#141413]">
                  {formatDate(selectedUser.createdAt)}
                </span>
              </div>
            </div>

            {/* Security / Notice */}
            <div className="p-3.5 rounded-lg bg-[#FAF5EC] border border-[#ECDDBB] text-xs text-[#865E16] space-y-1">
              <div className="flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Account Controls Notice</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Suspending this user will immediately revoke their ability to publish
                artworks, apply for studio residencies, and interact with the collective.
              </p>
            </div>
          </div>
        )}
      </Drawer>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm User Deletion"
        description="This action is permanent and cannot be reversed."
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
              Delete Permanently
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-[#52524E]">
          <p>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-[#141413]">
              {selectedUser?.name}
            </span>{" "}
            (<span className="font-mono">{selectedUser?.email}</span>)?
          </p>
          <p className="text-[11px] text-[#71716D]">
            All studio associations, draft submissions, and account credentials
            will be removed from the database immediately.
          </p>
        </div>
      </Modal>
    </div>
  );
}
