"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Collector } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Calendar,
  Sparkles,
  Phone,
  ImageIcon,
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
  const [activeTab, setActiveTab] = useState<"overview" | "collection">("overview");

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
            {collector.profilePicUrl ? (
              <img
                src={collector.profilePicUrl}
                alt={collector.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-[#E8E8E3]"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#EAEAE5] flex items-center justify-center text-lg font-bold text-[#141413]">
                {collector.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#141413]">
                  {collector.name}
                </h1>
                <Badge
                  variant={
                    collector.status === "active"
                      ? "success"
                      : collector.status === "pending"
                      ? "warning"
                      : "danger"
                  }
                  size="sm"
                  dot
                >
                  {collector.status}
                </Badge>
              </div>
              <p className="text-xs md:text-sm text-[#6E6E69] mt-0.5">
                {collector.email || "No email"} · {collector.location || "Remote"} · Joined {formatDate(collector.createdAt)}
              </p>
              <div className="text-xs font-semibold text-[#B8532F] mt-1">
                {collector.preferences || "Various Art Forms"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline">Suspend</Button>
            <Button variant="outline">Archive</Button>
            <Button variant="danger">Delete Account</Button>
          </div>
        </div>


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
