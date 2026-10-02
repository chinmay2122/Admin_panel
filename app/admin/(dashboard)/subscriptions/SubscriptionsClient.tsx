"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, X, Users, ChevronDown } from "lucide-react";
import { Subscriber, SubscriptionStats } from "@/lib/data/subscriptions";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";

interface SubscriptionsClientProps {
  initialSubscribers: Subscriber[];
  stats: SubscriptionStats;
}

type PlanFilter = "all" | "featured" | "cor_active" | "free" | "lite" | "pro" | "active" | "suspended";

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const PLAN_COLORS: Record<string, string> = {
  Free: "bg-[#F5F5F3] text-[#6E6E69] border-[#E8E8E3]",
  Lite: "bg-[#EEF3FF] text-[#3B5BDB] border-[#C5D8FF]",
  Pro: "bg-[#FFF3E0] text-[#B8532F] border-[#FFDBB3]",
  Elite: "bg-[#FAF0FF] text-[#7048B6] border-[#E5CEFF]",
};

const AVATAR_COLORS = [
  "bg-[#E8F0F5] text-[#2D6A9F]",
  "bg-[#F0EBF8] text-[#6A3D9F]",
  "bg-[#EBF5F0] text-[#2D8A5E]",
  "bg-[#F5EBE8] text-[#9F3D2D]",
  "bg-[#F5F0E8] text-[#8A6D2D]",
  "bg-[#EBF0F5] text-[#3D6A8A]",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function SubscriptionsClient({ initialSubscribers, stats }: SubscriptionsClientProps) {
  const toast = useToast();
  const [subscribers, setSubscribers] = useState<Subscriber[]>(initialSubscribers);
  const [activeTab, setActiveTab] = useState<PlanFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activePlanDropdownId, setActivePlanDropdownId] = useState<string | null>(null);
  const pageSize = 20;

  useEffect(() => {
    const close = () => setActivePlanDropdownId(null);
    const keyClose = (e: KeyboardEvent) => { if (e.key === "Escape") setActivePlanDropdownId(null); };
    window.addEventListener("click", close);
    window.addEventListener("keydown", keyClose);
    return () => { window.removeEventListener("click", close); window.removeEventListener("keydown", keyClose); };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchInput); setCurrentPage(1); }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filtered = useMemo(() => {
    let result = [...subscribers];

    if (activeTab === "featured") result = result.filter((s) => s.isCorMember);
    else if (activeTab === "cor_active") result = result.filter((s) => s.isCorMember && s.status === "active");
    else if (activeTab === "free") result = result.filter((s) => !s.plan || s.plan === "free");
    else if (activeTab === "lite") result = result.filter((s) => (s.plan as string) === "lite");
    else if (activeTab === "pro") result = result.filter((s) => s.plan === "pro" || s.plan === "elite");
    else if (activeTab === "active") result = result.filter((s) => s.status === "active");
    else if (activeTab === "suspended") result = result.filter((s) => s.status === "suspended");

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
      );
    }

    return result;
  }, [subscribers, activeTab, debouncedSearch]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const handleSuspend = (sub: Subscriber) => {
    const next = subscribers.map((s) =>
      s.id === sub.id ? { ...s, status: "suspended" as const } : s
    );
    setSubscribers(next);
    toast.success("User suspended", `${sub.name}'s account has been suspended.`);
  };

  const handleCancelToFree = (sub: Subscriber) => {
    const next = subscribers.map((s) =>
      s.id === sub.id ? { ...s, plan: "free" as const } : s
    );
    setSubscribers(next);
    toast.success("Plan changed", `${sub.name} has been moved to the Free plan.`);
  };

  const handlePlanChange = (sub: Subscriber, newPlan: string) => {
    setActivePlanDropdownId(null);
    const next = subscribers.map((s) =>
      s.id === sub.id ? { ...s, plan: newPlan as any } : s
    );
    setSubscribers(next);
    toast.success("Plan updated", `${sub.name} is now on the ${newPlan} plan.`);
  };

  const tabs: { key: PlanFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "featured", label: "Featured" },
    { key: "cor_active", label: "COR Active" },
    { key: "free", label: "Free" },
    { key: "lite", label: "Lite" },
    { key: "pro", label: "Pro" },
    { key: "active", label: "Active" },
    { key: "suspended", label: "Suspended" },
  ];

  const planLabel = (plan: string | null | undefined): string => {
    if (!plan || plan === "free") return "Free";
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  return (
    <div className="space-y-7 pb-16 animate-in fade-in duration-150">
      <div>
        <h1 className="text-3xl sm:text-4xl font-serif text-[#141413] tracking-tight">
          Subscriptions
        </h1>
        <p className="mt-1 text-sm text-[#6E6E69]">
          Local plan controls. No real billing or subscription changes.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E8E8E3] rounded-xl p-5 shadow-2xs hover:border-[#CFCFC9] transition-all">
          <p className="text-xs font-medium text-[#6E6E69]">Free creators</p>
          <p className="mt-2 text-4xl font-serif font-semibold text-[#141413]">{stats.freeCount}</p>
          <p className="mt-1.5 text-[11px] text-[#8A8A85]">Prototype data</p>
        </div>
        <div className="bg-white border border-[#E8E8E3] rounded-xl p-5 shadow-2xs hover:border-[#CFCFC9] transition-all">
          <p className="text-xs font-medium text-[#6E6E69]">Lite creators</p>
          <p className="mt-2 text-4xl font-serif font-semibold text-[#141413]">{stats.liteCount}</p>
          <p className="mt-1.5 text-[11px] text-[#8A8A85]">Prototype data</p>
        </div>
        <div className="bg-white border border-[#E8E8E3] rounded-xl p-5 shadow-2xs hover:border-[#CFCFC9] transition-all">
          <p className="text-xs font-medium text-[#6E6E69]">Pro creators</p>
          <p className="mt-2 text-4xl font-serif font-semibold text-[#141413]">{stats.proCount}</p>
          <p className="mt-1.5 text-[11px] text-[#8A8A85]">Prototype data</p>
        </div>
      </div>

      <div className="relative w-full">
        <Search className="w-3.5 h-3.5 text-[#8A8A85] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name, email, location or discipline"
          className="w-full text-sm pl-10 pr-9 py-2.5 rounded-xl border border-[#E8E8E3] bg-white text-[#141413] placeholder:text-[#8A8A85] focus:outline-none focus:border-[#141413] transition-all shadow-2xs"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => { setSearchInput(""); setDebouncedSearch(""); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A85] hover:text-[#141413] p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap select-none ${
                isActive
                  ? "bg-[#141413] text-white shadow-2xs"
                  : "text-[#6E6E69] hover:text-[#141413] hover:bg-neutral-100"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="w-6 h-6 text-[#8A8A85]" />}
          title="No subscribers found"
          description="No members match the selected filter or search query."
        />
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E8E8E3] overflow-visible shadow-2xs">
            <Table containerClassName="overflow-visible border-none bg-transparent">
              <TableHeader>
                <tr>
                  <TableHead className="py-3.5 pl-6 font-medium text-xs text-[#8A8A85]">Name / Email</TableHead>
                  <TableHead className="py-3.5 font-medium text-xs text-[#8A8A85]">Role</TableHead>
                  <TableHead className="py-3.5 font-medium text-xs text-[#8A8A85]">Plan</TableHead>
                  <TableHead className="py-3.5 font-medium text-xs text-[#8A8A85]">Status</TableHead>
                  <TableHead className="py-3.5 font-medium text-xs text-[#8A8A85]">Joined</TableHead>
                  <TableHead className="py-3.5 pr-6 text-right font-medium text-xs text-[#8A8A85]">Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {paginated.map((sub) => {
                  const initials = getInitials(sub.name);
                  const avatarColor = getAvatarColor(sub.name);
                  const plan = planLabel(sub.plan);
                  const planColorClass = PLAN_COLORS[plan] || "bg-[#F5F5F3] text-[#6E6E69] border-[#E8E8E3]";
                  const isActive = sub.status === "active";
                  const isPlanDropdownOpen = activePlanDropdownId === sub.id;

                  return (
                    <TableRow key={sub.id} className="hover:bg-[#FAF9F5] transition-colors">
                      <TableCell className="pl-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarColor}`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#141413] truncate">{sub.name}</p>
                            <p className="text-xs text-[#6E6E69] truncate">{sub.email}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5 text-sm text-[#4A4A48] capitalize">{sub.role}</TableCell>

                      <TableCell className="py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePlanDropdownId(isPlanDropdownOpen ? null : sub.id);
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-medium cursor-pointer transition-all ${planColorClass} hover:opacity-80`}
                          >
                            {plan}
                            <ChevronDown className="w-3 h-3 opacity-60" />
                          </button>
                          {isPlanDropdownOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute left-0 z-50 mt-1 w-28 rounded-xl bg-white border border-[#E8E8E3] shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100"
                            >
                              {["Free", "Lite", "Pro", "Elite"].map((p) => (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => handlePlanChange(sub, p.toLowerCase())}
                                  className={`w-full px-3 py-1.5 text-left text-xs font-medium transition-colors cursor-pointer ${
                                    plan === p
                                      ? "bg-[#F5F5F3] text-[#141413]"
                                      : "text-[#4A4A48] hover:bg-[#F5F5F3] hover:text-[#141413]"
                                  }`}
                                >
                                  {p}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium select-none ${
                          isActive
                            ? "bg-[#EAF2EC] text-[#28633B]"
                            : "bg-[#FDF2F2] text-[#C0392B]"
                        }`}>
                          {isActive ? "Active" : "Suspended"}
                        </span>
                      </TableCell>

                      <TableCell className="py-3.5 text-sm text-[#6E6E69] whitespace-nowrap">
                        {formatDate(sub.createdAt)}
                      </TableCell>

                      <TableCell className="pr-6 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            className="px-2.5 py-1 text-xs font-medium text-[#141413] border border-[#D5D5CF] rounded-lg hover:bg-[#F5F5F3] transition-all cursor-pointer whitespace-nowrap"
                          >
                            View / Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSuspend(sub)}
                            disabled={sub.status === "suspended"}
                            className="px-2.5 py-1 text-xs font-medium text-[#6E6E69] border border-[#D5D5CF] rounded-lg hover:bg-[#F5F5F3] hover:text-[#141413] transition-all cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Suspend
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelToFree(sub)}
                            disabled={!sub.plan || sub.plan === "free"}
                            className="px-2.5 py-1 text-xs font-medium text-[#6E6E69] border border-[#D5D5CF] rounded-lg hover:bg-[#F5F5F3] hover:text-[#141413] transition-all cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Cancel to Free
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filtered.length > pageSize && (
            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-[#8A8A85]">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} members
              </span>
              <Pagination
                currentPage={currentPage}
                totalItems={filtered.length}
                pageSize={pageSize}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-[#8A8A85] max-w-lg">
        Illustrative period metrics. 14 upgrades &middot; 3 downgrades &middot; 8 COR conversions. Choosing
        a plan above simulates upgrade, downgrade or reactivation.
      </p>
    </div>
  );
}
