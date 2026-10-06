"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CorMember,
  CorRequest,
  CorApplication,
  CorOpportunity,
  CorAdminNote,
  CorActivity,
} from "@/lib/types";
import { CorMemberBadge, CorApplicationBadge } from "@/components/cor/CorStatusBadge";
import { ApplyForMemberModal } from "@/components/cor/ApplyForMemberModal";
import { rankOpportunitiesForMember } from "@/lib/data/cor-matching";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui";
import {
  addCorAdminNoteAction,
  deleteCorAdminNoteAction,
  updateCorMemberNotesAction,
} from "@/app/admin/actions";
import {
  ArrowLeft,
  UserCheck,
  Send,
  Briefcase,
  GraduationCap,
  Globe,
  FileText,
  Sparkles,
  Lock,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Calendar,
} from "lucide-react";

interface CorMemberDetailClientProps {
  member: CorMember;
  request?: CorRequest | null;
  applications: CorApplication[];
  availableOpportunities: CorOpportunity[];
  adminNotes: CorAdminNote[];
  activity: CorActivity[];
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function CorMemberDetailClient({
  member,
  request,
  applications: initialApplications,
  availableOpportunities,
  adminNotes: initialNotes,
  activity,
}: CorMemberDetailClientProps) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "applications" | "matches" | "notes" | "activity">("overview");

  // Notes state
  const [notes, setNotes] = useState<CorAdminNote[]>(initialNotes);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Strategy & Internal Notes on Member Profile
  const [internalNotes, setInternalNotes] = useState(member.internalNotes || "");
  const [careerStrategy, setCareerStrategy] = useState(member.careerStrategy || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Apply Modal state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | undefined>();

  // Opportunity matches computed with rule-based matching engine
  const rankedOpportunities = rankOpportunitiesForMember(member, availableOpportunities);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    setIsAddingNote(true);
    try {
      const res = await addCorAdminNoteAction({
        corMemberId: member.id,
        content: newNoteContent,
      });

      if (!res.success || !res.note) {
        toast.error("Failed to add note", res.error || "Please try again.");
      } else {
        toast.success("Note Saved", "Private internal note has been recorded.");
        setNotes((prev) => [res.note!, ...prev]);
        setNewNoteContent("");
      }
    } catch {
      toast.error("Network Error", "Could not save note.");
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const res = await deleteCorAdminNoteAction(id);
      if (res.success) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
        toast.success("Note Deleted", "Internal note removed.");
      } else {
        toast.error("Delete failed", res.error || "Please try again.");
      }
    } catch {
      toast.error("Network Error", "Could not delete note.");
    }
  };

  const handleSaveProfileNotes = async () => {
    setIsSavingNotes(true);
    try {
      const res = await updateCorMemberNotesAction(member.id, internalNotes, careerStrategy);
      if (res.success) {
        toast.success("Strategy Saved", "Internal notes and career strategy updated.");
      } else {
        toast.error("Failed to save", res.error || "Please try again.");
      }
    } catch {
      toast.error("Network Error", "Could not save strategy.");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleOpenApplyWithOpportunity = (oppId?: string) => {
    setSelectedOpportunityId(oppId);
    setApplyModalOpen(true);
  };

  return (
    <div className="space-y-6 text-[#141413]">
      {/* Back button */}
      <div>
        <Link
          href="/admin/cor/members"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6E6E69] hover:text-[#141413] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to COR Members</span>
        </Link>
      </div>

      {/* Member Banner Card */}
      <div className="p-6 rounded-2xl border border-[#E8E8E3] bg-white shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {member.creatorAvatar ? (
              <img
                src={member.creatorAvatar}
                alt={member.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-[#E8E8E3]"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#EAEAE5] flex items-center justify-center text-lg font-bold text-[#141413]">
                {member.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#141413]">
                  {member.name}
                </h1>
                <CorMemberBadge status={member.status} />
              </div>
              <p className="text-xs md:text-sm text-[#6E6E69] mt-0.5">
                {member.creatorEmail} · {member.location || "Remote"} · Joined {formatDate(member.joinedAt)}
              </p>
              <div className="text-xs font-semibold text-[#B8532F] mt-1">
                Target Role: {member.desiredRole || "Spatial Media & Design"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={() => handleOpenApplyWithOpportunity()}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Apply for Opportunity</span>
            </Button>
          </div>
        </div>

        {/* Quick summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#E8E8E3] text-xs">
          <div>
            <span className="text-[#8A8A85]">Active Applications:</span>
            <div className="font-bold text-sm text-[#141413] mt-0.5">
              {initialApplications.length}
            </div>
          </div>
          <div>
            <span className="text-[#8A8A85]">Experience Level:</span>
            <div className="font-semibold text-sm text-[#141413] mt-0.5">
              {member.experienceYears || request?.experienceYears || "Established"}
            </div>
          </div>
          <div>
            <span className="text-[#8A8A85]">Workplace Preference:</span>
            <div className="font-semibold text-sm text-[#141413] mt-0.5">
              {member.preferredWorkType || "Hybrid"}
            </div>
          </div>
          <div>
            <span className="text-[#8A8A85]">Matched Opportunities:</span>
            <div className="font-bold text-sm text-[#B8532F] mt-0.5">
              {rankedOpportunities.filter((r) => r.scorePercentage >= 50).length} Suitable
            </div>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-1 border-b border-[#E8E8E3] overflow-x-auto scrollbar-none">
        {(
          [
            { id: "overview", label: "Career Overview" },
            { id: "applications", label: `Applications (${initialApplications.length})` },
            { id: "matches", label: `Opportunity Matches (${rankedOpportunities.length})` },
            { id: "notes", label: `Internal Notes (${notes.length})`, icon: Lock },
            { id: "activity", label: "Activity Log" },
          ] as const
        ).map((tab) => {
          const active = activeTab === tab.id;
          const Icon = "icon" in tab ? tab.icon : null;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs md:text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                active
                  ? "border-[#B8532F] text-[#B8532F]"
                  : "border-transparent text-[#6E6E69] hover:text-[#141413]"
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5 text-[#B8532F]" />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Career Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Skills Card */}
            <div className="p-5 rounded-xl border border-[#E8E8E3] bg-white space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#6E6E69] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#B8532F]" />
                <span>Skills & Disciplines</span>
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {(member.skills || request?.skills || []).map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 rounded-lg bg-[#F3F3EE] text-xs font-medium text-[#141413]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Experience & Work History */}
            <div className="p-5 rounded-xl border border-[#E8E8E3] bg-white space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#6E6E69] flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#B8532F]" />
                <span>Work Experience & Studio Background</span>
              </h2>
              {request?.workHistory && request.workHistory.length > 0 ? (
                <div className="space-y-3">
                  {request.workHistory.map((wh, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-[#FAFAF8] border border-[#E8E8E3] space-y-1">
                      <div className="font-semibold text-sm text-[#141413]">
                        {wh.role} — {wh.company}
                      </div>
                      <div className="text-xs text-[#8A8A85]">{wh.dates}</div>
                      <div className="text-xs text-[#5E5E59] leading-relaxed pt-1">
                        {wh.responsibilities}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#6E6E69]">
                  {member.name} has {member.experienceYears || "several years"} of recognized professional studio practice.
                </p>
              )}
            </div>

            {/* Education */}
            {request?.education && (
              <div className="p-5 rounded-xl border border-[#E8E8E3] bg-white space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#6E6E69] flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#B8532F]" />
                  <span>Education & Credentials</span>
                </h2>
                <div className="text-xs">
                  <div className="font-semibold text-[#141413]">
                    {request.education.degree || "Formal Fine Arts Degree"}
                  </div>
                  <div className="text-[#6E6E69]">
                    {request.education.institution} ({request.education.year || "Completed"})
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Links, Career Goals, & Private Strategy */}
          <div className="space-y-6">
            {/* Career Goals */}
            <div className="p-5 rounded-xl border border-[#E8E8E3] bg-white space-y-3 text-xs">
              <h2 className="font-bold uppercase tracking-wider text-[#6E6E69]">
                Career Goals & Preferences
              </h2>
              <div className="space-y-2">
                <div>
                  <span className="text-[#8A8A85] block">Expected Salary / Rates:</span>
                  <div className="font-semibold text-[#141413]">
                    {request?.careerGoals?.expectedSalary || "Negotiable"}
                  </div>
                </div>
                <div>
                  <span className="text-[#8A8A85] block">Desired Role:</span>
                  <div className="font-semibold text-[#B8532F]">
                    {member.desiredRole || "Creative Director"}
                  </div>
                </div>
                <div>
                  <span className="text-[#8A8A85] block">Workplace Preference:</span>
                  <div className="font-semibold text-[#141413]">
                    {member.preferredWorkType || "Hybrid"}
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Links */}
            <div className="p-5 rounded-xl border border-[#E8E8E3] bg-white space-y-3 text-xs">
              <h2 className="font-bold uppercase tracking-wider text-[#6E6E69]">
                Portfolio & Links
              </h2>
              <div className="space-y-1.5">
                {request?.links?.portfolio && (
                  <a
                    href={request.links.portfolio}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-[#FAFAF8] hover:bg-[#F3F3EE] transition-colors"
                  >
                    <span>Portfolio</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#8A8A85]" />
                  </a>
                )}
                {request?.links?.website && (
                  <a
                    href={request.links.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-[#FAFAF8] hover:bg-[#F3F3EE] transition-colors"
                  >
                    <span>Website</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#8A8A85]" />
                  </a>
                )}
                {request?.links?.linkedin && (
                  <a
                    href={request.links.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-[#FAFAF8] hover:bg-[#F3F3EE] transition-colors"
                  >
                    <span>LinkedIn</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#8A8A85]" />
                  </a>
                )}
              </div>
            </div>

            {/* Internal Strategy (Admin Only) */}
            <div className="p-5 rounded-xl border border-[#E8E8E3] bg-[#FAFAF8] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-[#9E4323] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Admin Career Strategy</span>
                </span>
                <span className="text-[10px] text-[#8A8A85]">Private</span>
              </div>
              <textarea
                rows={3}
                value={careerStrategy}
                onChange={(e) => setCareerStrategy(e.target.value)}
                placeholder="Internal placement strategy, targeted institutions, or advisory notes..."
                className="w-full text-xs bg-white border border-[#E8E8E3] rounded-lg p-2.5 text-[#141413] focus:outline-none focus:ring-1 focus:ring-[#B8532F]"
              />
              <Button
                size="sm"
                variant="primary"
                onClick={handleSaveProfileNotes}
                isLoading={isSavingNotes}
              >
                Save Strategy
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Application History */}
      {activeTab === "applications" && (
        <div className="bg-white border border-[#E8E8E3] rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#E8E8E3] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#141413]">
              Application History for {member.name}
            </h2>
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleOpenApplyWithOpportunity()}
            >
              <Send className="w-3 h-3" />
              <span>Apply for New Opportunity</span>
            </Button>
          </div>

          <div className="divide-y divide-[#E8E8E3]">
            {initialApplications.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6E6E69]">
                No applications submitted yet for this member.
              </div>
            ) : (
              initialApplications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAFAF8] transition-colors"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-sm text-[#141413]">
                      {app.company} — {app.opportunityTitle}
                    </div>
                    <div className="text-xs text-[#6E6E69]">
                      Applied: {formatDate(app.appliedDate)} · Consultant: {app.consultant}
                      {app.interviewDate && ` · Interview: ${formatDate(app.interviewDate)}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <CorApplicationBadge status={app.status} />
                    <Link
                      href={`/admin/cor/applications/${app.id}`}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium border border-[#E8E8E3] bg-white text-[#141413] hover:bg-[#F3F3EE]"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Opportunity Matches */}
      {activeTab === "matches" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-[#E8E8E3] bg-white flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#141413]">
                Rule-based Opportunity Matching
              </h2>
              <p className="text-xs text-[#6E6E69] mt-0.5">
                Opportunities ranked according to skills overlap, target role, location, and workplace compatibility.
              </p>
            </div>
            <div className="text-xs font-semibold text-[#B8532F]">
              {rankedOpportunities.length} Available Opportunities
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rankedOpportunities.map((match) => (
              <div
                key={match.opportunity.id}
                className="p-5 rounded-xl border border-[#E8E8E3] bg-white shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-base font-bold text-[#141413]">
                        {match.opportunity.title}
                      </div>
                      <div className="text-xs font-medium text-[#6E6E69]">
                        {match.opportunity.company} · {match.opportunity.location} ({match.opportunity.workplaceType})
                      </div>
                    </div>

                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        match.scorePercentage >= 75
                          ? "bg-[#E6F4EA] text-[#137333]"
                          : match.scorePercentage >= 50
                          ? "bg-[#FEF7E0] text-[#B06000]"
                          : "bg-[#F1F3F4] text-[#5F6368]"
                      }`}
                    >
                      {match.scorePercentage}% Match
                    </span>
                  </div>

                  {/* Reasons list */}
                  <div className="space-y-1.5 mt-3 pt-3 border-t border-[#E8E8E3] text-xs">
                    {match.reasons.map((r, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {r.matched ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#137333] shrink-0" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8A8A85] shrink-0 ml-1 mr-1" />
                        )}
                        <span className="text-[#5E5E59] text-[11px] truncate">{r.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E8E8E3] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#141413]">
                    {match.opportunity.salary || "Competitive"}
                  </span>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleOpenApplyWithOpportunity(match.opportunity.id)}
                  >
                    <Send className="w-3 h-3" />
                    <span>Apply for Member</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Internal Admin Notes (CRITICAL PRIVACY: ADMIN ONLY) */}
      {activeTab === "notes" && (
        <div className="space-y-5">
          <div className="p-4 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] flex items-start gap-2.5 text-xs text-[#92400E]">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong>Private Administrative Zone:</strong> These notes and observations are strictly visible to the Career Operations admin team. They are never exposed to candidates or creators.
            </div>
          </div>

          {/* Add Note Form */}
          <form
            onSubmit={handleAddNote}
            className="p-4 rounded-xl border border-[#E8E8E3] bg-white shadow-xs space-y-3"
          >
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6E69]">
              Add Internal Admin Note
            </label>
            <textarea
              rows={3}
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="e.g. Discussed candidate with Kenji at Atelier Kōra. Recruiter responded positively to their kinetic installation catalog..."
              className="w-full text-xs md:text-sm bg-white border border-[#E8E8E3] rounded-lg p-3 text-[#141413] focus:outline-none focus:ring-1 focus:ring-[#B8532F]"
            />
            <div className="flex justify-end">
              <Button type="submit" variant="primary" size="sm" isLoading={isAddingNote}>
                <Plus className="w-3.5 h-3.5" />
                <span>Save Note</span>
              </Button>
            </div>
          </form>

          {/* Existing Notes List */}
          <div className="space-y-3">
            {notes.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6E6E69] bg-white rounded-xl border border-[#E8E8E3]">
                No internal notes recorded yet for this member.
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 rounded-xl border border-[#E8E8E3] bg-white space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#141413] flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-[#B8532F]" />
                      <span>{note.authorName}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#8A8A85] text-[11px]">
                        {formatDate(note.createdAt)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-[#8A8A85] hover:text-[#B91C1C] p-1"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-[#5E5E59] leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Activity Log */}
      {activeTab === "activity" && (
        <div className="p-5 rounded-xl border border-[#E8E8E3] bg-white shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-[#141413]">
            Activity & Event Timeline
          </h2>
          <div className="space-y-3 text-xs">
            {activity.length === 0 ? (
              <p className="text-[#6E6E69]">No activity recorded yet.</p>
            ) : (
              activity.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-[#FAFAF8] border border-[#E8E8E3]"
                >
                  <div className="w-2 h-2 rounded-full bg-[#B8532F] mt-1.5 shrink-0" />
                  <div>
                    <div className="text-[#141413] font-medium">{act.description}</div>
                    <div className="text-[11px] text-[#8A8A85] mt-0.5">
                      {formatDate(act.createdAt)} · Actor: {act.actorName || "Career Team"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Apply for Member Modal */}
      <ApplyForMemberModal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        availableMembers={[member]}
        availableOpportunities={availableOpportunities}
        initialMemberId={member.id}
        initialOpportunityId={selectedOpportunityId}
        onSuccess={() => {
          setActiveTab("applications");
        }}
      />
    </div>
  );
}
