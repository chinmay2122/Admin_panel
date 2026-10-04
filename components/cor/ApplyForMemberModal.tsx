"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CorMember, CorOpportunity, CorApplicationStatus } from "@/lib/types";
import { calculateMatch } from "@/lib/data/cor-matching";
import { createCorApplicationAction } from "@/app/admin/actions";
import { useToast } from "@/components/ui";
import { Briefcase, UserCheck, Sparkles, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

interface ApplyForMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableMembers: CorMember[];
  availableOpportunities: CorOpportunity[];
  initialMemberId?: string;
  initialOpportunityId?: string;
  onSuccess?: () => void;
}

const STATUS_OPTIONS: CorApplicationStatus[] = [
  "Recommended",
  "Preparing Application",
  "Applied",
  "Screening",
  "Interview",
  "Final Round",
  "Offer",
];

export function ApplyForMemberModal({
  isOpen,
  onClose,
  availableMembers,
  availableOpportunities,
  initialMemberId,
  initialOpportunityId,
  onSuccess,
}: ApplyForMemberModalProps) {
  const toast = useToast();

  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    initialMemberId || (availableMembers[0]?.id ?? "")
  );
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>(
    initialOpportunityId || (availableOpportunities[0]?.id ?? "")
  );

  const [status, setStatus] = useState<CorApplicationStatus>("Recommended");
  const [appliedDate, setAppliedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [interviewDate, setInterviewDate] = useState<string>("");
  const [consultant, setConsultant] = useState<string>("Career Operations");
  const [adminNote, setAdminNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialMemberId) setSelectedMemberId(initialMemberId);
  }, [initialMemberId]);

  useEffect(() => {
    if (initialOpportunityId) setSelectedOpportunityId(initialOpportunityId);
  }, [initialOpportunityId]);

  const selectedMember = useMemo(
    () => availableMembers.find((m) => m.id === selectedMemberId),
    [availableMembers, selectedMemberId]
  );

  const selectedOpportunity = useMemo(
    () => availableOpportunities.find((o) => o.id === selectedOpportunityId),
    [availableOpportunities, selectedOpportunityId]
  );

  // Compute transparent rule-based match
  const matchResult = useMemo(() => {
    if (!selectedMember || !selectedOpportunity) return null;
    return calculateMatch(selectedMember, selectedOpportunity);
  }, [selectedMember, selectedOpportunity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !selectedOpportunityId) {
      toast.error("Selection Required", "Please select both a candidate and an opportunity.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createCorApplicationAction({
        corMemberId: selectedMemberId,
        opportunityId: selectedOpportunityId,
        initialStatus: status,
        appliedDate,
        interviewDate: interviewDate || undefined,
        consultant,
        adminNote: adminNote.trim() || undefined,
      });

      if (!res.success) {
        toast.error("Application Failed", res.error || "Could not create application.");
      } else {
        toast.success(
          "Application Created",
          `Successfully initiated application for ${selectedMember?.name} at ${selectedOpportunity?.company}.`
        );
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch {
      toast.error("Network Error", "An error occurred while creating the application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply for Member"
      description="Create a linked COR job application on behalf of an active member."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Member Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E6E69] mb-1.5">
            Select COR Member (Candidate)
          </label>
          <div className="relative">
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full text-sm bg-white border border-[#E8E8E3] rounded-lg px-3 py-2 text-[#141413] focus:outline-none focus:ring-1 focus:ring-[#B8532F]"
            >
              {availableMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.desiredRole || "Creator"} ({m.location || "Remote"})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Opportunity Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E6E69] mb-1.5">
            Select Opportunity / Job
          </label>
          <select
            value={selectedOpportunityId}
            onChange={(e) => setSelectedOpportunityId(e.target.value)}
            className="w-full text-sm bg-white border border-[#E8E8E3] rounded-lg px-3 py-2 text-[#141413] focus:outline-none focus:ring-1 focus:ring-[#B8532F]"
          >
            {availableOpportunities.map((o) => (
              <option key={o.id} value={o.id}>
                {o.company} — {o.title} ({o.location}, {o.workplaceType})
              </option>
            ))}
          </select>
        </div>

        {/* Transparent Rule-Based Match Breakdown Box */}
        {matchResult && selectedMember && selectedOpportunity && (
          <div className="p-4 rounded-xl border border-[#E8E8E3] bg-[#F7F7F4] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#B8532F]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#141413]">
                  Rule-based Match Profile
                </span>
              </div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  matchResult.scorePercentage >= 75
                    ? "bg-[#E6F4EA] text-[#137333]"
                    : matchResult.scorePercentage >= 50
                    ? "bg-[#FEF7E0] text-[#B06000]"
                    : "bg-[#F1F3F4] text-[#5F6368]"
                }`}
              >
                {matchResult.scorePercentage}% Compatibility
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {matchResult.reasons.map((r, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2 rounded-lg bg-white border border-[#E8E8E3]"
                >
                  {r.matched ? (
                    <CheckCircle2 className="w-4 h-4 text-[#137333] shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[#8A8A85] shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-[#141413]">{r.title}</div>
                    <div className="text-[11px] text-[#6E6E69] leading-relaxed">
                      {r.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Application Status & Dates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E6E69] mb-1.5">
              Initial Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CorApplicationStatus)}
              className="w-full text-sm bg-white border border-[#E8E8E3] rounded-lg px-3 py-2 text-[#141413] focus:outline-none focus:ring-1 focus:ring-[#B8532F]"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E6E69] mb-1.5">
              Applied Date
            </label>
            <input
              type="date"
              value={appliedDate}
              onChange={(e) => setAppliedDate(e.target.value)}
              className="w-full text-sm bg-white border border-[#E8E8E3] rounded-lg px-3 py-2 text-[#141413] focus:outline-none focus:ring-1 focus:ring-[#B8532F]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E6E69] mb-1.5">
              Interview Date (Optional)
            </label>
            <input
              type="date"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              className="w-full text-sm bg-white border border-[#E8E8E3] rounded-lg px-3 py-2 text-[#141413] focus:outline-none focus:ring-1 focus:ring-[#B8532F]"
            />
          </div>
        </div>

        {/* Consultant & Strategy Note */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E6E69] mb-1.5">
            Assigned Consultant / Admin
          </label>
          <input
            type="text"
            value={consultant}
            onChange={(e) => setConsultant(e.target.value)}
            placeholder="e.g. Elena Rostova"
            className="w-full text-sm bg-white border border-[#E8E8E3] rounded-lg px-3 py-2 text-[#141413] focus:outline-none focus:ring-1 focus:ring-[#B8532F]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E6E69] mb-1.5">
            Initial Application Note / Strategy (Internal)
          </label>
          <textarea
            rows={2}
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="e.g. Portfolio tailored for Kyoto pavilion. Direct submission via lead recruiter."
            className="w-full text-sm bg-white border border-[#E8E8E3] rounded-lg px-3 py-2 text-[#141413] focus:outline-none focus:ring-1 focus:ring-[#B8532F]"
          />
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-[#E8E8E3] flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto justify-center">
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full sm:w-auto inline-flex items-center justify-center">
            <span>Submit Application on Behalf</span>
            <ArrowRight className="w-4 h-4 ml-1.5 shrink-0" />
          </Button>
        </div>
      </form>
    </Modal>
  );
}
