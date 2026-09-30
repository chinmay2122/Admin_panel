"use client";

import React from "react";
import { Search, X, RotateCcw } from "lucide-react";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterSelectConfig {
  id: string;
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  filters?: FilterSelectConfig[];
  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  onResetFilters,
  hasActiveFilters = false,
  className = "",
  children,
}: FilterBarProps) {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 bg-white border border-[#E8E8E3] rounded-lg ${className}`}
    >
      {/* Left side: Search input + Select filters */}
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#8A8A85] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-8 pl-8 pr-7 text-xs bg-[#FAFAF8] text-[#141413] placeholder:text-[#9A9A94] border border-[#E8E8E3] rounded-lg focus:outline-none focus:border-[#B8532F] focus:ring-1 focus:ring-[#B8532F] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8A85] hover:text-[#141413] rounded p-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B8532F]"
              aria-label="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Dynamic Filter Dropdowns */}
        {filters.map((filter) => (
          <div key={filter.id} className="relative">
            <select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="h-8 text-xs bg-white text-[#141413] border border-[#E8E8E3] rounded-lg px-2.5 pr-7 focus:outline-none focus:border-[#B8532F] focus:ring-1 focus:ring-[#B8532F] cursor-pointer appearance-none"
            >
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8A85] text-[10px]">
              ▼
            </div>
          </div>
        ))}

        {/* Reset button */}
        {hasActiveFilters && onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            aria-label="Reset all filters"
            className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs text-[#71716D] hover:text-[#141413] hover:bg-[#F5F5F0] rounded-lg border border-transparent hover:border-[#E8E8E3] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B8532F]"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Right side: Custom children slot if needed */}
      {children && (
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}
