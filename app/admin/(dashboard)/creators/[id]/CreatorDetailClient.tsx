"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Creator, Artwork, CorMember } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Calendar,
  Sparkles,
  Link as LinkIcon,
  Phone,
  Image as ImageIcon,
  Award,
} from "lucide-react";

interface CreatorDetailClientProps {
  creator: Creator;
  artworks: Artwork[];
  corMember: CorMember | null;
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

export function CreatorDetailClient({
  creator,
  artworks,
  corMember,
}: CreatorDetailClientProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "artworks" | "cor">("overview");

  return (
    <div className="space-y-6 text-[#141413]">
      {/* Back button */}
      <div>
        <Link
          href="/admin/creators"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6E6E69] hover:text-[#141413] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Creators</span>
        </Link>
      </div>

      {/* Creator Banner Card */}
      <div className="p-6 rounded-2xl border border-[#E8E8E3] bg-white shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {creator.profilePicUrl ? (
              <img
                src={creator.profilePicUrl}
                alt={creator.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-[#E8E8E3]"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#EAEAE5] flex items-center justify-center text-lg font-bold text-[#141413]">
                {creator.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#141413]">
                  {creator.name}
                </h1>
                <Badge
                  variant={
                    creator.status === "active"
                      ? "success"
                      : creator.status === "pending"
                      ? "warning"
                      : "danger"
                  }
                  size="sm"
                  dot
                >
                  {creator.status}
                </Badge>
              </div>
              <p className="text-xs md:text-sm text-[#6E6E69] mt-0.5">
                {creator.email || "No email"} · {creator.location || "Remote"} · Joined {formatDate(creator.createdAt)}
              </p>
              <div className="text-xs font-semibold text-[#B8532F] mt-1">
                {creator.discipline}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline">Suspend</Button>
            <Button variant="outline">Archive</Button>
            <Button variant="danger">Delete Account</Button>
          </div>
        </div>

        {/* Quick summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#E8E8E3] text-xs">
          <div>
            <span className="text-[#8A8A85]">Total Artworks:</span>
            <div className="font-bold text-sm text-[#141413] mt-0.5">
              {artworks.length}
            </div>
          </div>
          <div>
            <span className="text-[#8A8A85]">Subscription Plan:</span>
            <div className="font-semibold text-sm capitalize text-[#141413] mt-0.5">
              {creator.plan || "Free"}
            </div>
          </div>
          <div>
            <span className="text-[#8A8A85]">COR Status:</span>
            <div className="font-semibold text-sm text-[#141413] mt-0.5">
              {corMember ? (
                <span className="flex items-center gap-1 text-[#10B981]">
                  <Award className="w-3.5 h-3.5" /> {corMember.status}
                </span>
              ) : (
                <span className="text-[#6E6E69]">Not a Member</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-1 border-b border-[#E8E8E3] overflow-x-auto scrollbar-none">
        {(
          [
            { id: "overview", label: "Profile Overview", icon: Sparkles },
            { id: "artworks", label: `Artworks (${artworks.length})`, icon: ImageIcon },
            { id: "cor", label: "COR Status", icon: Award },
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
                  <div className="col-span-2 font-medium text-[#141413]">{creator.name}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-[#6E6E69]">Email</div>
                  <div className="col-span-2 font-medium text-[#141413]">{creator.email || "Not provided"}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-[#6E6E69]">Phone</div>
                  <div className="col-span-2 font-medium text-[#141413]">{creator.phoneNumber || "Not provided"}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-[#6E6E69]">Location</div>
                  <div className="col-span-2 font-medium text-[#141413]">{creator.location || "Not provided"}</div>
                </div>
              </div>
            </div>

            {/* Professional Profile */}
            <div className="p-5 rounded-xl border border-[#E8E8E3] bg-white">
              <h3 className="text-sm font-semibold text-[#141413] mb-4 pb-3 border-b border-[#F0F0EB]">
                Professional Profile
              </h3>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-[#6E6E69]">Specialisation</div>
                  <div className="col-span-2 font-medium text-[#141413]">{creator.discipline}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-[#6E6E69]">Portfolio URL</div>
                  <div className="col-span-2 font-medium text-[#141413]">
                    {creator.portfolioUrl ? (
                      <a href={creator.portfolioUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                        View Portfolio <LinkIcon className="w-3 h-3" />
                      </a>
                    ) : (
                      "Not provided"
                    )}
                  </div>
                </div>
                <div className="space-y-1.5 mt-2 pt-2 border-t border-[#F0F0EB]">
                  <div className="text-[#6E6E69]">Bio</div>
                  <div className="font-medium text-[#141413] whitespace-pre-wrap leading-relaxed text-sm">
                    {creator.aboutMe || "No bio provided."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "artworks" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#141413]">
              Creator's Artworks
            </h3>
            {artworks.length === 0 ? (
              <div className="p-8 text-center bg-[#FAFAF8] border border-[#E8E8E3] rounded-xl text-[#6E6E69] text-sm">
                No artworks have been added by this creator yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {artworks.map((artwork) => (
                  <Link href={`/admin/artworks`} key={artwork.id} className="group flex flex-col rounded-xl overflow-hidden border border-[#E8E8E3] bg-white hover:border-[#141413] transition-colors">
                    <div className="aspect-square bg-[#EAEAE5] relative">
                      {artwork.imageUrl ? (
                        <img src={artwork.imageUrl} alt={artwork.title} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-[#A8A8A3] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant={artwork.status === "published" ? "success" : "default"} size="sm">
                          {artwork.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="font-semibold text-sm text-[#141413] truncate group-hover:text-blue-600">
                        {artwork.title}
                      </h4>
                      <p className="text-xs text-[#6E6E69] mt-1 flex justify-between">
                        <span>{artwork.medium}</span>
                        {artwork.price ? <span>${artwork.price.toLocaleString()}</span> : null}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "cor" && (
          <div className="p-6 rounded-xl border border-[#E8E8E3] bg-white">
            <h3 className="text-sm font-semibold text-[#141413] mb-4 pb-3 border-b border-[#F0F0EB]">
              COR Membership Status
            </h3>
            {corMember ? (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-[#F0F0EB] py-1.5">
                      <span className="text-[#6E6E69]">Status</span>
                      <Badge variant="success">{corMember.status}</Badge>
                    </div>
                    <div className="flex justify-between border-b border-[#F0F0EB] py-1.5">
                      <span className="text-[#6E6E69]">Member Since</span>
                      <span className="font-medium text-[#141413]">{formatDate(corMember.joinedAt)}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-[#F0F0EB] py-1.5">
                      <span className="text-[#6E6E69]">Target Role</span>
                      <span className="font-medium text-[#141413] text-right">{corMember.desiredRole || "Not specified"}</span>
                    </div>
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <Link href={`/admin/cor/members/${corMember.id}`}>
                    <Button variant="primary">
                      View Full COR Profile
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-[#6E6E69] text-sm flex flex-col items-center">
                <Award className="w-12 h-12 text-[#E8E8E3] mb-3" />
                <p>This creator is not currently enrolled in the COR program.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
