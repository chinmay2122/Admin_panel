import React from "react";
import { FolderOpen } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-12 border border-dashed border-[#DCDCD5] rounded-lg bg-white/60 ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-[#F3F3EE] border border-[#E6E6DF] flex items-center justify-center text-[#7E7E77] mb-3.5">
        {icon || <FolderOpen className="w-5 h-5 stroke-[1.5]" />}
      </div>
      <h4 className="text-sm font-medium text-[#141413] tracking-tight">{title}</h4>
      {description && (
        <p className="mt-1 text-xs text-[#71716D] max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
