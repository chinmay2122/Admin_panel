"use client";

import React from "react";
import {
  CorApplicationStatus,
  CorMemberStatus,
  CorRequestStatus,
  CorOpportunityStatus,
} from "@/lib/types";

export function CorApplicationBadge({ status }: { status: CorApplicationStatus }) {
  let bg = "bg-[#F3F3EE] text-[#5A5A55] border-[#E2E2DC]";
  let dot = "bg-[#8A8A85]";

  switch (status) {
    case "Recommended":
      bg = "bg-[#F5F3FF] text-[#6D28D9] border-[#DDD6FE]";
      dot = "bg-[#7C3AED]";
      break;
    case "Preparing Application":
      bg = "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]";
      dot = "bg-[#3B82F6]";
      break;
    case "Applied":
      bg = "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]";
      dot = "bg-[#22C55E]";
      break;
    case "Screening":
      bg = "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]";
      dot = "bg-[#F59E0B]";
      break;
    case "Interview":
      bg = "bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]";
      dot = "bg-[#D97706]";
      break;
    case "Final Round":
      bg = "bg-[#FDF4FF] text-[#86198F] border-[#F5D0FE]";
      dot = "bg-[#C026D3]";
      break;
    case "Offer":
      bg = "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]";
      dot = "bg-[#10B981]";
      break;
    case "Rejected":
      bg = "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]";
      dot = "bg-[#EF4444]";
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <span>{status}</span>
    </span>
  );
}

export function CorRequestBadge({ status }: { status: CorRequestStatus }) {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
          <span>Pending Review</span>
        </span>
      );
    case "approved":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          <span>Approved</span>
        </span>
      );
    case "declined":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
          <span>Declined</span>
        </span>
      );
  }
}

export function CorMemberBadge({ status }: { status: CorMemberStatus }) {
  switch (status) {
    case "active":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          <span>Active Member</span>
        </span>
      );
    case "paused":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
          <span>Paused</span>
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
          <span>Placed / Completed</span>
        </span>
      );
    case "removed":
    case "expired":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-[#F3F3EE] text-[#71716D] border-[#E2E2DC]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8A8A85]" />
          <span>{status === "removed" ? "Removed" : "Expired"}</span>
        </span>
      );
  }
}

export function CorOpportunityBadge({ status }: { status: CorOpportunityStatus }) {
  switch (status) {
    case "open":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          <span>Open</span>
        </span>
      );
    case "paused":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
          <span>Paused</span>
        </span>
      );
    case "closed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-[#F3F3EE] text-[#71716D] border-[#E2E2DC]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8A8A85]" />
          <span>Closed</span>
        </span>
      );
  }
}
