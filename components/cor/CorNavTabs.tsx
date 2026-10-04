"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, UserCheck, Briefcase, FileText, LayoutDashboard } from "lucide-react";

interface CorNavTabsProps {
  counts?: {
    requests?: number;
    members?: number;
    applications?: number;
    opportunities?: number;
  };
}

export function CorNavTabs({ counts }: CorNavTabsProps) {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Hub Overview",
      href: "/admin/cor",
      icon: LayoutDashboard,
      exact: true,
      count: undefined,
    },
    {
      name: "Requests",
      href: "/admin/cor/requests",
      icon: Award,
      exact: false,
      count: counts?.requests,
      highlightCount: (counts?.requests || 0) > 0,
    },
    {
      name: "Members",
      href: "/admin/cor/members",
      icon: UserCheck,
      exact: false,
      count: counts?.members,
    },
    {
      name: "Applications",
      href: "/admin/cor/applications",
      icon: FileText,
      exact: false,
      count: counts?.applications,
    },
    {
      name: "Opportunities",
      href: "/admin/cor/opportunities",
      icon: Briefcase,
      exact: false,
      count: counts?.opportunities,
    },
  ];

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-[#E8E8E3] select-none scrollbar-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`group inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
              isActive
                ? "bg-white text-[#141413] shadow-xs border border-[#E8E8E3]"
                : "text-[#6E6E69] hover:text-[#141413] hover:bg-white/60"
            }`}
          >
            <Icon
              className={`w-4 h-4 stroke-[1.75] transition-colors ${
                isActive ? "text-[#B8532F]" : "text-[#8A8A85] group-hover:text-[#141413]"
              }`}
            />
            <span>{tab.name}</span>
            {typeof tab.count === "number" && (
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                  tab.highlightCount
                    ? "bg-[#B8532F] text-white"
                    : isActive
                    ? "bg-[#F3F3EE] text-[#141413]"
                    : "bg-[#EAEAE5] text-[#6E6E69]"
                }`}
              >
                {tab.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
