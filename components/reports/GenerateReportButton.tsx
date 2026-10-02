"use client";

import React, { useState, useEffect } from "react";
import { FileText, Loader2, Calendar, Check, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

type PeriodType = "7d" | "30d" | "3m" | "1y" | "custom";

interface PeriodOption {
  id: PeriodType;
  label: string;
  description: string;
}

const PERIOD_OPTIONS: PeriodOption[] = [
  { id: "7d", label: "Last 7 Days", description: "Weekly velocity & new items" },
  { id: "30d", label: "Last 30 Days", description: "Standard monthly performance" },
  { id: "3m", label: "Last 3 Months", description: "Quarterly trajectory & retention" },
  { id: "1y", label: "This Year", description: "Annual cumulative summary" },
  { id: "custom", label: "Custom Range", description: "Define custom start and end dates" },
];

export function GenerateReportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("30d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState<"generating" | "analytics" | "creating">("generating");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize default custom range dates to last 30 days
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setEndDate(today.toISOString().split("T")[0]);
    setStartDate(thirtyDaysAgo.toISOString().split("T")[0]);
  }, []);

  // Multi-step loading message progression
  useEffect(() => {
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;

    if (isGenerating) {
      setLoadingStep("generating");
      timer1 = setTimeout(() => {
        setLoadingStep("analytics");
      }, 700);
      timer2 = setTimeout(() => {
        setLoadingStep("creating");
      }, 1500);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isGenerating]);

  const handleGenerate = async () => {
    if (isGenerating) return;

    if (selectedPeriod === "custom") {
      if (!startDate || !endDate) {
        setErrorMsg("Please select both a start and end date for the custom period.");
        return;
      }
      if (new Date(startDate) > new Date(endDate)) {
        setErrorMsg("The start date must be before or equal to the end date.");
        return;
      }
    }

    setErrorMsg(null);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/admin/reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          period: selectedPeriod,
          startDate: selectedPeriod === "custom" ? startDate : undefined,
          endDate: selectedPeriod === "custom" ? endDate : undefined,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.details || errJson.error || "Failed to generate report");
      }

      // Extract filename from header or fallback
      const disposition = response.headers.get("content-disposition");
      let filename = `ErasStudio-Report-${new Date().toISOString().split("T")[0]}.pdf`;
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      // Close modal upon completion
      setTimeout(() => {
        setIsGenerating(false);
        setIsOpen(false);
      }, 400);
    } catch (err: any) {
      console.error("PDF generation failure:", err);
      setErrorMsg(err.message || "An unexpected error occurred while generating the PDF.");
      setIsGenerating(false);
    }
  };

  const getLoadingMessage = () => {
    switch (loadingStep) {
      case "generating":
        return "Generating Report...";
      case "analytics":
        return "Preparing Analytics...";
      case "creating":
        return "Creating PDF...";
    }
  };

  return (
    <>
      {/* Top-right Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setErrorMsg(null);
          setIsOpen(true);
        }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E8E8E3] bg-white text-xs font-medium text-[#141413] hover:bg-[#F5F5F0] hover:border-[#D0D0CA] transition-all duration-150 shadow-xs cursor-pointer select-none active:scale-[0.98]"
        title="Generate client-ready Studio Performance Report"
      >
        <FileText className="w-3.5 h-3.5 text-[#B8532F]" />
        <span>Generate Report</span>
      </button>

      {/* Report Generation Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          if (!isGenerating) {
            setIsOpen(false);
          }
        }}
        title="Studio Performance Report"
        description="Configure reporting parameters to generate an executive 4-page A4 PDF performance summary."
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerate}
              disabled={isGenerating}
              isLoading={isGenerating}
              leftIcon={!isGenerating ? <FileText className="w-3.5 h-3.5" /> : undefined}
            >
              {isGenerating ? getLoadingMessage() : "Generate PDF"}
            </Button>
          </div>
        }
      >
        <div className="space-y-5 py-1">
          {/* Error Banner if any */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-[#FDF3F2] border border-[#F4CDCD] flex items-start gap-2.5 text-xs text-[#B83838]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Reporting Period Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-[#141413] uppercase tracking-wider">
              Reporting Period
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PERIOD_OPTIONS.map((opt) => {
                const isSelected = selectedPeriod === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => {
                      setSelectedPeriod(opt.id);
                      setErrorMsg(null);
                    }}
                    className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#B8532F] bg-[#FAF5F2] ring-1 ring-[#B8532F]"
                        : "border-[#E8E8E3] bg-white hover:bg-[#FAFAF8] hover:border-[#D0D0CA]"
                    } ${isGenerating ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <div>
                      <p className={`text-xs font-semibold ${isSelected ? "text-[#B8532F]" : "text-[#141413]"}`}>
                        {opt.label}
                      </p>
                      <p className="text-[11px] text-[#71716D] mt-0.5">
                        {opt.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-[#B8532F] flex items-center justify-center shrink-0 text-white ml-2">
                        <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Date Range Inputs */}
          {selectedPeriod === "custom" && (
            <div className="p-3.5 rounded-lg border border-[#E8E8E3] bg-[#FAFAF8] space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#141413]">
                <Calendar className="w-3.5 h-3.5 text-[#B8532F]" />
                <span>Custom Date Boundary</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#6E6E69] mb-1">
                    From
                  </label>
                  <input
                    type="date"
                    disabled={isGenerating}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-md border border-[#E8E8E3] bg-white text-[#141413] focus:outline-none focus:border-[#B8532F] focus:ring-1 focus:ring-[#B8532F]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#6E6E69] mb-1">
                    To
                  </label>
                  <input
                    type="date"
                    disabled={isGenerating}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-md border border-[#E8E8E3] bg-white text-[#141413] focus:outline-none focus:border-[#B8532F] focus:ring-1 focus:ring-[#B8532F]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Scope Note */}
          <div className="p-3 rounded-lg border border-[#E8E8E3] bg-white text-[11px] text-[#71716D] space-y-1">
            <div className="flex items-center gap-1.5 text-[#141413] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#28633B]" />
              <span>Report Specifications</span>
            </div>
            <p>
              • Exactly 4 A4 pages: Executive Summary, Platform Performance, Content & Conversion, and Key Insights.
            </p>
            <p>
              • Formatted for executive review with clean typography, vector charts, and no technical IDs.
            </p>
          </div>

          {/* Loading Indicator when Generating */}
          {isGenerating && (
            <div className="p-3.5 rounded-lg border border-[#E8E8E3] bg-[#FAF5F2] flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-[#B8532F] shrink-0" />
              <div>
                <p className="text-xs font-semibold text-[#141413]">
                  {getLoadingMessage()}
                </p>
                <p className="text-[11px] text-[#71716D] mt-0.5">
                  Synthesizing repository metrics and rendering vector A4 layout. Download will start automatically.
                </p>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
