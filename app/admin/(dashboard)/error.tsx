"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4 py-12 animate-in fade-in duration-200">
      <div className="w-12 h-12 rounded-full bg-[#FAF0ED] border border-[#F5D8CE] flex items-center justify-center text-[#B8532F] mb-4 shadow-xs">
        <AlertTriangle className="w-6 h-6 stroke-[1.75]" />
      </div>

      <h2 className="text-xl font-medium tracking-tight text-[#141413]">
        Something went wrong
      </h2>

      <p className="mt-2 text-xs md:text-sm text-[#6E6E69] max-w-md leading-relaxed">
        An unexpected error occurred while loading this section of the admin panel.
        {error.message ? (
          <span className="block mt-1 font-mono text-[11px] text-[#B83838] bg-[#FAF2F2] border border-[#F2D6D6] px-2 py-1 rounded">
            {error.message}
          </span>
        ) : null}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="primary"
          size="sm"
          onClick={() => reset()}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Try Again
        </Button>

        <Link href="/admin/overview">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<LayoutDashboard className="w-3.5 h-3.5" />}
          >
            Back to Overview
          </Button>
        </Link>
      </div>
    </div>
  );
}
