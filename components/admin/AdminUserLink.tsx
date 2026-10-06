import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface AdminUserLinkProps {
  userId: string;
  name: string;
  role: "Creator" | "Collector" | "User" | "Admin" | string;
  avatar?: string;
  className?: string;
  showIcon?: boolean;
}

function getInitials(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AdminUserLink({
  userId,
  name,
  role,
  avatar,
  className = "",
  showIcon = true,
}: AdminUserLinkProps) {
  if (!userId) {
    return <span className={`text-[#8A8A85] ${className}`}>Unknown User</span>;
  }

  let route = `/admin/users/${userId}`;
  const r = role.toLowerCase();
  
  if (r === "creator") {
    route = `/admin/creators/${userId}`;
  } else if (r === "collector" || r === "user") {
    route = `/admin/collectors/${userId}`;
  }

  return (
    <Link
      href={route}
      className={`group inline-flex items-center gap-2 cursor-pointer transition-colors hover:text-blue-600 ${className}`}
    >
      {avatar !== undefined ? (
        avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-7 h-7 rounded-full object-cover border border-[#E8E8E3]"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-[#EAEAE5] border border-[#DCDCD6] flex items-center justify-center text-xs font-semibold text-[#141413] shrink-0">
            {getInitials(name)}
          </div>
        )
      ) : null}
      <span className="font-medium text-[#141413] group-hover:text-blue-600 group-hover:underline decoration-1 underline-offset-2">
        {name}
      </span>
      {showIcon && (
        <ArrowUpRight className="w-3.5 h-3.5 text-[#8A8A85] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-blue-600" />
      )}
    </Link>
  );
}
