import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Palette,
  Sparkles,
  FileText,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import {
  usersRepo,
  creatorsRepo,
  artworksRepo,
  corRepo,
  applicationsRepo,
} from "@/lib/data";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { GenerateReportButton } from "@/components/reports/GenerateReportButton";

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
}

export default async function OverviewPage() {
  const [
    userStats,
    creatorStats,
    artworkStats,
    corStats,
    appStats,
    allUsers,
  ] = await Promise.all([
    usersRepo.stats(),
    creatorsRepo.stats(),
    artworksRepo.stats(),
    corRepo.stats(),
    applicationsRepo.stats(),
    usersRepo.list(),
  ]);

  // Last 5 users sorted by creation date descending
  const recentSignups = [...allUsers]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const statCards = [
    { label: "Total Users", value: userStats.total },
    { label: "Creators", value: userStats.creators },
    { label: "Collectors", value: userStats.collectors },
    { label: "Published Artworks", value: artworkStats.published },
    { label: "Free Creators", value: creatorStats.free },
    { label: "Elite Creators", value: creatorStats.elite },
    { label: "Pro Creators", value: creatorStats.pro },
    { label: "COR Members", value: corStats.active },
  ];

  const attentionItems = [
    {
      title: "Pending Artworks",
      description: "Submissions awaiting curatorial review",
      count: artworkStats.pending,
      href: "/admin/artworks?status=pending",
      icon: Palette,
    },
    {
      title: "Pending Creators",
      description: "Creator applications awaiting verification",
      count: creatorStats.pending,
      href: "/admin/creators?status=pending",
      icon: Sparkles,
    },
    {
      title: "Pending Applications",
      description: "Open call & residency applications",
      count: appStats.pending,
      href: "/admin/applications?status=pending",
      icon: FileText,
    },
  ];

  const totalNeedsAttention =
    artworkStats.pending + creatorStats.pending + appStats.pending;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-[#E8E8E3] pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-medium tracking-tight text-[#141413]">
            Studio Pulse
          </h2>
          <p className="mt-1 text-xs md:text-sm text-[#6E6E69]">
            Real-time platform metrics, member activity, and curatorial queues.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="text-[11px] text-[#8A8A85] tracking-tight hidden md:inline">
            Last refreshed: Just now
          </span>
          <GenerateReportButton />
        </div>
      </div>

      {/* Top Row: 8 Stat Cards (Minimal: Big number + Small label) */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[#8A8A85]">
          Key Metrics
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="bg-white border border-[#E8E8E3] rounded-lg p-4 flex flex-col justify-between transition-colors hover:border-[#D0D0CA]"
            >
              <span className="text-[11px] font-medium text-[#6E6E69] leading-snug">
                {stat.label}
              </span>
              <span className="text-2xl font-semibold tracking-tight text-[#141413] mt-2">
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Two Sections Grid: Recent Signups (2/3) + Needs Attention (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Section 1: Recent Signups */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[#141413] tracking-tight">
              Recent signups
            </h3>
            <Link
              href="/admin/users"
              className="text-xs text-[#B8532F] hover:text-[#9E4323] font-medium inline-flex items-center gap-1 transition-colors"
            >
              <span>View all users</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Card padded={false} className="overflow-hidden">
            {recentSignups.length === 0 ? (
              <EmptyState
                icon={<UserCheck className="w-5 h-5 text-[#8A8A85]" />}
                title="No recent signups"
                description="New member registrations will appear here in chronological order."
                className="py-12 border-none"
              />
            ) : (
              <div className="divide-y divide-[#E8E8E3]">
                {/* Table Header */}
                <div className="grid grid-cols-12 px-5 py-3 text-xs font-medium text-[#71716D] bg-[#FAFAF8] uppercase tracking-wider">
                  <div className="col-span-5">User</div>
                  <div className="col-span-2 text-center">Role</div>
                  <div className="col-span-2 text-center">Plan</div>
                  <div className="col-span-3 text-right">Signed Up</div>
                </div>

                {/* Table Rows */}
                {recentSignups.map((user) => (
                  <div
                    key={user.id}
                    className="grid grid-cols-12 items-center px-5 py-3.5 text-xs md:text-sm hover:bg-[#FAFAF8] transition-colors"
                  >
                    <div className="col-span-5 min-w-0 pr-2">
                      <p className="font-medium text-[#141413] truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-[#71716D] truncate">
                        {user.email}
                      </p>
                    </div>

                    <div className="col-span-2 text-center">
                      <Badge
                        variant={user.role === "creator" ? "accent" : "default"}
                        size="sm"
                      >
                        {user.role}
                      </Badge>
                    </div>

                    <div className="col-span-2 text-center">
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
                        <span className="text-[#8A8A85] text-xs">—</span>
                      )}
                    </div>

                    <div className="col-span-3 text-right text-xs text-[#6E6E69]">
                      {formatDate(user.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Section 2: Needs Attention */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[#141413] tracking-tight">
              Needs attention
            </h3>
            {totalNeedsAttention > 0 ? (
              <Badge variant="warning" size="sm" dot>
                {totalNeedsAttention} pending
              </Badge>
            ) : (
              <Badge variant="success" size="sm" dot>
                All clear
              </Badge>
            )}
          </div>

          <div className="space-y-2.5">
            {attentionItems.map((item) => {
              const Icon = item.icon;
              const hasPending = item.count > 0;

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group block bg-white border border-[#E8E8E3] hover:border-[#D0D0CA] rounded-lg p-4 transition-all duration-150"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#F5F5F0] border border-[#E8E8E3] flex items-center justify-center shrink-0 text-[#6E6E69] group-hover:text-[#B8532F] transition-colors">
                        <Icon className="w-4 h-4 stroke-[1.75]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-medium text-[#141413] group-hover:text-[#B8532F] transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-[#71716D] mt-0.5 leading-snug">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          hasPending
                            ? "bg-[#FAF5EC] text-[#865E16] border border-[#ECDDBB]"
                            : "bg-[#F3F3EF] text-[#71716D] border border-[#E5E5DF]"
                        }`}
                      >
                        {item.count}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#8A8A85] group-hover:text-[#141413] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </Link>
              );
            })}

            {totalNeedsAttention === 0 && (
              <div className="p-4 rounded-lg border border-dashed border-[#DCDCD5] bg-white/50 text-center">
                <CheckCircle2 className="w-4 h-4 text-[#28633B] mx-auto mb-1" />
                <p className="text-xs font-medium text-[#141413]">
                  All queues cleared
                </p>
                <p className="text-[11px] text-[#71716D] mt-0.5">
                  No submissions or verification items are currently awaiting review.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
