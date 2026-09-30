import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize = 10,
  onPageChange,
  className = "",
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#6E6E69] select-none ${className}`}
    >
      <div>
        Showing <span className="font-medium text-[#141413]">{startItem}</span> to{" "}
        <span className="font-medium text-[#141413]">{endItem}</span> of{" "}
        <span className="font-medium text-[#141413]">{totalItems}</span> entries
      </div>

      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[#E8E8E3] bg-white text-[#141413] hover:bg-[#F5F5F0] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B8532F]"
        >
          <ChevronLeft className="w-4 h-4 stroke-[1.75]" />
        </button>

        {pages.map((p) => {
          const isCurrent = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-label={`Go to page ${p}`}
              aria-current={isCurrent ? "page" : undefined}
              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B8532F] ${
                isCurrent
                  ? "bg-[#141413] text-white border border-[#141413]"
                  : "bg-white text-[#5E5E59] border border-[#E8E8E3] hover:bg-[#F5F5F0] hover:text-[#141413]"
              }`}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[#E8E8E3] bg-white text-[#141413] hover:bg-[#F5F5F0] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B8532F]"
        >
          <ChevronRight className="w-4 h-4 stroke-[1.75]" />
        </button>
      </div>
    </div>
  );
}
