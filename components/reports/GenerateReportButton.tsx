"use client";

import React, { useState, useEffect } from "react";
import { FileText, Loader2, Calendar, Check, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

type PeriodType = "7d" | "30d" | "3m" | "1y" | "custom";

interface PeriodOption {
  id: PeriodType;
  label: string;
  description: string;
}

const PERIOD_OPTIONS: PeriodOption[] = [
  { id: "7d", label: "Last 7 days", description: "Weekly overview" },
  { id: "30d", label: "Last 30 days", description: "Monthly review" },
  { id: "3m", label: "Last 3 months", description: "Quarterly view" },
  { id: "1y", label: "This year", description: "Annual summary" },
];

export function GenerateReportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("30d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize default custom range dates to last 30 days
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setEndDate(today.toISOString().split("T")[0]);
    setStartDate(thirtyDaysAgo.toISOString().split("T")[0]);
  }, [isOpen]);

  const handleGenerate = async () => {
    if (isGenerating || isSuccess) return;

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

      setIsGenerating(false);
      setIsSuccess(true);
      
      // Auto close after showing success
      setTimeout(() => {
        setIsOpen(false);
        setTimeout(() => setIsSuccess(false), 300);
      }, 2000);
      
    } catch (err: any) {
      console.error("PDF generation failure:", err);
      setErrorMsg(err.message || "An unexpected error occurred while generating the PDF.");
      setIsGenerating(false);
    }
  };

  const getPreviewInfo = () => {
    const today = new Date();
    const formatDt = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    
    if (selectedPeriod === "7d") {
      const start = new Date(today);
      start.setDate(start.getDate() - 7);
      return { title: "7-day performance overview", range: `${formatDt(start)} — ${formatDt(today)}` };
    }
    if (selectedPeriod === "30d") {
      const start = new Date(today);
      start.setDate(start.getDate() - 30);
      return { title: "30-day performance overview", range: `${formatDt(start)} — ${formatDt(today)}` };
    }
    if (selectedPeriod === "3m") {
      const start = new Date(today);
      start.setMonth(start.getMonth() - 3);
      return { title: "3-month performance overview", range: `${formatDt(start)} — ${formatDt(today)}` };
    }
    if (selectedPeriod === "1y") {
      const start = new Date(today.getFullYear(), 0, 1);
      return { title: "Annual performance overview", range: `${formatDt(start)} — ${formatDt(today)}` };
    }
    
    // custom
    if (!startDate || !endDate) {
       return { title: "Custom performance overview", range: "Select a valid date range" };
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
       return { title: "Custom performance overview", range: "Invalid date range" };
    }
    return { title: "Custom performance overview", range: `${formatDt(start)} — ${formatDt(end)}` };
  };

  const previewInfo = getPreviewInfo();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setErrorMsg(null);
          setIsSuccess(false);
          setIsOpen(true);
        }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E8E8E3] bg-white text-xs font-medium text-[#141413] hover:bg-[#F5F5F0] hover:border-[#D0D0CA] transition-all duration-150 shadow-xs cursor-pointer select-none active:scale-[0.98]"
      >
        <FileText className="w-3.5 h-3.5 text-[#B8532F]" />
        <span>Generate Report</span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          if (!isGenerating) setIsOpen(false);
        }}
        title="Generate Performance Report"
        description="Choose a reporting period and generate a concise overview of your studio's performance."
        maxWidth="md"
        footer={null} // We will use a custom footer inside the body to match the exact design requirement
      >
        <div className="flex flex-col space-y-6 pt-2">
          {/* Success State Overlay / Replacement */}
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="w-12 h-12 rounded-full bg-[#E8F3EB] text-[#28633B] flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-medium text-[#141413] mb-1">Report ready</h3>
              <p className="text-sm text-[#6E6E69]">Your performance report has been generated.</p>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3 rounded-lg bg-[#FDF3F2] border border-[#F4CDCD] flex items-start gap-2.5 text-xs text-[#B83838]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* REPORTING PERIOD */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-semibold text-[#6E6E69] uppercase tracking-wider">
                  Reporting Period
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                        className={`flex flex-col items-start justify-center p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                          isSelected
                            ? "border-[#B8532F] bg-[#FAF5F2] ring-1 ring-[#B8532F]"
                            : "border-[#E8E8E3] bg-white hover:bg-[#FAFAF8] hover:border-[#D0D0CA]"
                        } ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-sm font-medium ${isSelected ? "text-[#B8532F]" : "text-[#141413]"}`}>
                            {opt.label}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-[#B8532F]" />}
                        </div>
                        <span className="text-xs text-[#71716D] mt-1">{opt.description}</span>
                      </button>
                    );
                  })}
                  
                  {/* Custom Range Button */}
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => {
                      setSelectedPeriod("custom");
                      setErrorMsg(null);
                    }}
                    className={`sm:col-span-2 flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedPeriod === "custom"
                        ? "border-[#B8532F] bg-[#FAF5F2] ring-1 ring-[#B8532F]"
                        : "border-[#E8E8E3] bg-white hover:bg-[#FAFAF8] hover:border-[#D0D0CA]"
                    } ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span className={`text-sm font-medium ${selectedPeriod === "custom" ? "text-[#B8532F]" : "text-[#141413]"}`}>
                      Custom range
                    </span>
                    {selectedPeriod === "custom" ? <Check className="w-4 h-4 text-[#B8532F]" /> : <ArrowRight className="w-4 h-4 text-[#6E6E69]" />}
                  </button>
                </div>

                {/* Custom Date Inputs */}
                {selectedPeriod === "custom" && (
                  <div className="grid grid-cols-2 gap-3 mt-2 animate-in fade-in duration-200 slide-in-from-top-1">
                    <div>
                      <label className="block text-[11px] font-medium text-[#6E6E69] mb-1.5 ml-1">
                        From
                      </label>
                      <input
                        type="date"
                        disabled={isGenerating}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full text-sm px-3 py-2 rounded-lg border border-[#E8E8E3] bg-white text-[#141413] focus:outline-none focus:border-[#B8532F] focus:ring-1 focus:ring-[#B8532F] shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#6E6E69] mb-1.5 ml-1">
                        To
                      </label>
                      <input
                        type="date"
                        disabled={isGenerating}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full text-sm px-3 py-2 rounded-lg border border-[#E8E8E3] bg-white text-[#141413] focus:outline-none focus:border-[#B8532F] focus:ring-1 focus:ring-[#B8532F] shadow-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* REPORT PREVIEW */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-semibold text-[#6E6E69] uppercase tracking-wider">
                  Report Preview
                </h4>
                <div className="p-4 rounded-xl border border-[#E8E8E3] bg-[#FAFAF8]">
                  <h5 className="text-sm font-medium text-[#141413]">
                    {previewInfo.title}
                  </h5>
                  <p className="text-xs text-[#71716D] mt-1 mb-4">
                    {previewInfo.range}
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[#141413] mb-2">Includes:</p>
                    <div className="flex items-center gap-2 text-xs text-[#6E6E69]">
                      <Check className="w-3.5 h-3.5 text-[#28633B]" />
                      <span>Platform performance</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#6E6E69]">
                      <Check className="w-3.5 h-3.5 text-[#28633B]" />
                      <span>Content & creator activity</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#6E6E69]">
                      <Check className="w-3.5 h-3.5 text-[#28633B]" />
                      <span>Key performance insights</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8E8E3] mt-2">
                <Button
                  variant="secondary"
                  onClick={() => setIsOpen(false)}
                  disabled={isGenerating}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="min-w-[140px]"
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Generating report...
                    </span>
                  ) : errorMsg ? (
                    "Try Again"
                  ) : (
                    "Generate Report"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
