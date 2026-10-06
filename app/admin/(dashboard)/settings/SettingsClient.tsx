"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PlatformSettings } from "@/lib/types";
import { updateSettingsAction } from "@/app/admin/actions";
import { useToast } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Check, AlertCircle, RefreshCw, Sparkles, Shield, Award } from "lucide-react";

interface SettingsClientProps {
  initialSettings: PlatformSettings;
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const toast = useToast();
  const [settings, setSettings] = useState<PlatformSettings>(initialSettings);
  const [formState, setFormState] = useState<PlatformSettings>(initialSettings);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Check if form has unsaved modifications
  const isDirty = useMemo(() => {
    return (
      formState.freeArtworkLimit !== settings.freeArtworkLimit ||
      formState.liteArtworkLimit !== settings.liteArtworkLimit ||
      formState.proArtworkLimit !== settings.proArtworkLimit ||
      formState.inviteRequestLimit !== settings.inviteRequestLimit ||
      formState.corEnabled !== settings.corEnabled ||
      formState.featuredCreatorControlsEnabled !== settings.featuredCreatorControlsEnabled ||
      formState.moderationSettingsEnabled !== settings.moderationSettingsEnabled ||
      formState.platformAnnouncement !== settings.platformAnnouncement ||
      formState.defaultProfileVisibility !== settings.defaultProfileVisibility
    );
  }, [formState, settings]);

  // Prevent accidental navigation when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Client-side instant validator
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (
      isNaN(formState.freeArtworkLimit) ||
      !Number.isInteger(Number(formState.freeArtworkLimit)) ||
      formState.freeArtworkLimit < 0
    ) {
      errors.freeArtworkLimit = "Free artwork limit must be a positive integer.";
    } else if (formState.freeArtworkLimit > 10000) {
      errors.freeArtworkLimit = "Limit cannot exceed 10,000.";
    }

    if (
      isNaN(formState.liteArtworkLimit) ||
      !Number.isInteger(Number(formState.liteArtworkLimit)) ||
      formState.liteArtworkLimit < 0
    ) {
      errors.liteArtworkLimit = "Lite artwork limit must be a positive integer.";
    } else if (formState.liteArtworkLimit > 10000) {
      errors.liteArtworkLimit = "Limit cannot exceed 10,000.";
    }

    if (
      isNaN(formState.proArtworkLimit) ||
      !Number.isInteger(Number(formState.proArtworkLimit)) ||
      formState.proArtworkLimit < 0
    ) {
      errors.proArtworkLimit = "Pro artwork limit must be a positive integer.";
    } else if (formState.proArtworkLimit > 10000) {
      errors.proArtworkLimit = "Limit cannot exceed 10,000.";
    }

    if (
      isNaN(formState.inviteRequestLimit) ||
      !Number.isInteger(Number(formState.inviteRequestLimit)) ||
      formState.inviteRequestLimit < 0
    ) {
      errors.inviteRequestLimit = "Invite request limit must be a positive integer.";
    } else if (formState.inviteRequestLimit > 10000) {
      errors.inviteRequestLimit = "Limit cannot exceed 10,000.";
    }

    if (formState.platformAnnouncement.length > 1000) {
      errors.platformAnnouncement = "Platform announcement cannot exceed 1,000 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Validation error", "Please correct the highlighted fields before saving.");
      return;
    }

    setIsSaving(true);
    setFieldErrors({});

    try {
      const res = await updateSettingsAction(formState);
      if (!res.success || !res.settings) {
        if (res.errors) {
          setFieldErrors(res.errors);
        }
        toast.error("Failed to save settings", res.error || "Please verify your input values.");
      } else {
        setSettings(res.settings);
        setFormState(res.settings);
        toast.success("Settings saved successfully.", "Limits and controls have been updated across the live platform.");
      }
    } catch {
      toast.error("Network error", "Unable to communicate with the server. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormState(settings);
    setFieldErrors({});
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl animate-in fade-in duration-150">
      {/* ========================================================================= */}
      {/* 1. PAGE HEADER (ERAS Studio Editorial Style)                              */}
      {/* ========================================================================= */}
      <div className="border-b border-[#E8E8E3] pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#141413] tracking-tight">
            Studio settings
          </h1>
          <p className="mt-1 text-sm text-[#6E6E69]">
            Configure rules and controls. Saved changes apply to the live platform.
          </p>
        </div>

        {/* Live sync & status tag */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isDirty ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#FFF3DC] text-[#975A16] border border-[#F6E0B5]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse" />
              Unsaved changes
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F5F5F3] text-[#71716D] border border-[#E8E8E3]">
              <Check className="w-3 h-3 text-[#28633B]" />
              Platform synchronized
            </span>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN SETTINGS CARD                                                     */}
      {/* ========================================================================= */}
      <form onSubmit={handleSave} className="space-y-8">
        <div className="bg-white rounded-2xl border border-[#E8E8E3] p-6 sm:p-8 shadow-2xs space-y-8">
          {/* SECTION A: ARTWORK ALLOWANCES */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-serif font-medium text-[#141413]">
                Artwork allowances
              </h2>
              <p className="text-xs text-[#8A8A85] mt-0.5">
                Maximum catalog creation quotas permitted per subscriber membership tier.
              </p>
            </div>

            {/* 2-Column Responsive Form Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
              {/* Free artwork limit */}
              <Input
                label="Free artwork limit"
                type="number"
                min={0}
                max={10000}
                value={formState.freeArtworkLimit}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setFormState((prev) => ({
                    ...prev,
                    freeArtworkLimit: isNaN(val) ? 0 : val,
                  }));
                }}
                error={fieldErrors.freeArtworkLimit}
                helperText="Maximum allowed artworks for Free community members"
              />

              {/* Lite artwork limit */}
              <Input
                label="Lite artwork limit"
                type="number"
                min={0}
                max={10000}
                value={formState.liteArtworkLimit}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setFormState((prev) => ({
                    ...prev,
                    liteArtworkLimit: isNaN(val) ? 0 : val,
                  }));
                }}
                error={fieldErrors.liteArtworkLimit}
                helperText="Allowed portfolio artworks for Lite candidates"
              />

              {/* Pro artwork limit */}
              <Input
                label="Pro artwork limit"
                type="number"
                min={0}
                max={10000}
                value={formState.proArtworkLimit}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setFormState((prev) => ({
                    ...prev,
                    proArtworkLimit: isNaN(val) ? 0 : val,
                  }));
                }}
                error={fieldErrors.proArtworkLimit}
                helperText="Allowed showcase creations for Pro & Elite artists"
              />

              {/* Invite request limit */}
              <Input
                label="Invite request limit"
                type="number"
                min={0}
                max={10000}
                value={formState.inviteRequestLimit}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setFormState((prev) => ({
                    ...prev,
                    inviteRequestLimit: isNaN(val) ? 0 : val,
                  }));
                }}
                error={fieldErrors.inviteRequestLimit}
                helperText="Monthly collector and peer invitation quota"
              />
            </div>
          </div>

          <div className="border-t border-[#F0F0EB]" />

          {/* SECTION B: PLATFORM CONTROLS */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-serif font-medium text-[#141413]">
                Platform controls
              </h2>
              <p className="text-xs text-[#8A8A85] mt-0.5">
                Toggle platform capabilities and active verification workflows.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {/* 1. COR Enabled */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E8E8E3] hover:border-[#D5D5CE] transition-colors cursor-pointer bg-[#FAF9F5]/40 select-none">
                <input
                  type="checkbox"
                  checked={formState.corEnabled}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, corEnabled: e.target.checked }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-[#D5D5CF] text-[#141413] focus:ring-[#141413] cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#141413]">
                      COR Enabled
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-[#EAF2EC] text-[#28633B] border border-[#CDE3D3]">
                      Active Registry
                    </span>
                  </div>
                  <p className="text-xs text-[#6E6E69]">
                    Enable the Certificate of Authenticity & Provenance registry for certified artworks.
                  </p>
                </div>
              </label>

              {/* 2. Featured Creator Controls */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E8E8E3] hover:border-[#D5D5CE] transition-colors cursor-pointer bg-[#FAF9F5]/40 select-none">
                <input
                  type="checkbox"
                  checked={formState.featuredCreatorControlsEnabled}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      featuredCreatorControlsEnabled: e.target.checked,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-[#D5D5CF] text-[#141413] focus:ring-[#141413] cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#141413]">
                      Featured Creator Controls
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-[#FAF9F5] text-[#141413] border border-[#E8E8E3]">
                      Curatorial Spotlight
                    </span>
                  </div>
                  <p className="text-xs text-[#6E6E69]">
                    Allow curators and leads to feature creators and curate homepage artist spotlights.
                  </p>
                </div>
              </label>

              {/* 3. Moderation Settings */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E8E8E3] hover:border-[#D5D5CE] transition-colors cursor-pointer bg-[#FAF9F5]/40 select-none">
                <input
                  type="checkbox"
                  checked={formState.moderationSettingsEnabled}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      moderationSettingsEnabled: e.target.checked,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-[#D5D5CF] text-[#141413] focus:ring-[#141413] cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#141413]">
                      Moderation Settings
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-[#EFEFEF] text-[#4A4A48] border border-[#E0E0DE]">
                      Safety & Enforcement
                    </span>
                  </div>
                  <p className="text-xs text-[#6E6E69]">
                    Enable community reporting queues, artwork hiding, and immediate account suspension controls.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="border-t border-[#F0F0EB]" />

          {/* SECTION C: PLATFORM ANNOUNCEMENT */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="platform-announcement"
                className="text-sm font-serif font-medium text-[#141413]"
              >
                Platform announcement
              </label>
              <span className="text-[11px] text-[#8A8A85]">
                {formState.platformAnnouncement.length} / 1000 characters
              </span>
            </div>

            <textarea
              id="platform-announcement"
              rows={4}
              value={formState.platformAnnouncement}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  platformAnnouncement: e.target.value,
                }))
              }
              maxLength={1000}
              placeholder="Enter studio-wide announcement shown to members..."
              className={`w-full bg-white text-[#141413] text-sm placeholder:text-[#9A9A94] border ${
                fieldErrors.platformAnnouncement ? "border-[#D94E4E]" : "border-[#E8E8E3]"
              } rounded-xl p-3.5 transition-colors focus:outline-none focus:border-[#141413] focus:ring-1 focus:ring-[#141413] leading-relaxed`}
            />
            {fieldErrors.platformAnnouncement && (
              <p className="text-xs text-[#D94E4E]">{fieldErrors.platformAnnouncement}</p>
            )}
            <p className="text-[11px] text-[#8A8A85]">
              Broadcasted on top of studio discovery views and member portals.
            </p>
          </div>

          <div className="border-t border-[#F0F0EB]" />

          {/* SECTION D: DEFAULT PROFILE VISIBILITY */}
          <div className="space-y-2 max-w-md">
            <Select
              label="Default Profile Visibility"
              value={formState.defaultProfileVisibility}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  defaultProfileVisibility: e.target.value as "public" | "private",
                }))
              }
              options={[
                { label: "Public — Open in directory & global search", value: "public" },
                { label: "Private — Unlisted until approved by curator", value: "private" },
              ]}
              helperText="Determines initial privacy preference for newly registered collector and artist profiles."
            />
          </div>

          <div className="border-t border-[#F0F0EB]" />

          {/* SECTION E: SAVE ACTION & FOOTER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
            <div className="flex items-center gap-3">
              <Button
                type="submit"
                size="md"
                isLoading={isSaving}
                disabled={!isDirty || isSaving}
                className="bg-[#141413] hover:bg-[#2A2A28] text-white px-6 font-medium cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Settings
              </Button>

              {isDirty && (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleReset}
                  disabled={isSaving}
                  className="cursor-pointer text-[#6E6E69] hover:text-[#141413]"
                >
                  Reset
                </Button>
              )}
            </div>

            <p className="text-xs text-[#8A8A85] tracking-tight">
              Limits and controls apply across the platform.
            </p>
          </div>
        </div>
      </form>

      {/* Audit Log / Last Updated Reference */}
      {settings.updatedAt && (
        <div className="px-2 flex items-center justify-between text-[11px] text-[#8A8A85]">
          <span>
            Configuration record ID: <code className="font-mono text-[#5A5A55]">{settings.id}</code>
          </span>
          <span>
            Last modified by admin: <strong className="text-[#3A3A35]">{settings.updatedBy || "adm_01"}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
