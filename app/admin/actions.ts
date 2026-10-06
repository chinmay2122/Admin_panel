"use server";

import { requireAdminSession } from "@/lib/auth";
import {
  usersRepo,
  creatorsRepo,
  artworksRepo,
  corRepo,
  corRequestsRepo,
  corMembersRepo,
  corOpportunitiesRepo,
  corApplicationsRepo,
  corEventsRepo,
  corNotesRepo,
  corActivityRepo,
  jobsRepo,
  applicationsRepo,
  reportsRepo,
  settingsRepo,
  collectorsRepo,
} from "@/lib/data";
import {
  User,
  Creator,
  Collector,
  Artwork,
  CorMember,
  CorMemberStatus,
  CorRequest,
  CorOpportunity,
  CorApplication,
  CorApplicationStatus,
  CorAdminNote,
  CorActivity,
  Job,
  Application,
  Report,
  PlatformSettings,
} from "@/lib/types";
import { canModerateTarget, hasPermission } from "@/lib/security/rbac";
import { globalRateLimiter, RATE_LIMIT_CONFIGS } from "@/lib/security/rateLimit";
import {
  isValidId,
  isValidReportReason,
  isValidReportStateTransition,
  isValidCorRequestStatus,
  isValidCorMemberStatus,
  isValidCorOpportunityStatus,
  isValidCorApplicationStatus,
  filterSafeArtworkUpdates,
  filterSafeUserUpdates,
  filterSafeCreatorUpdates,
  validatePlatformSettings,
  sanitizeClientError,
} from "@/lib/security/validators";

// ==============================================================================
// User Actions
// ==============================================================================

export async function updateUserAction(
  id: string,
  data: Partial<User>
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const session = await requireAdminSession("user:manage");

    if (!isValidId(id)) {
      return { success: false, error: "Invalid user ID format." };
    }

    const allowRoleChange = hasPermission(session.role, "user:change_role");
    const safeData = filterSafeUserUpdates(data, { allowRoleChange });

    if (Object.keys(safeData).length === 0) {
      return { success: false, error: "No authorized or valid fields provided for update." };
    }

    const updated = await usersRepo.update(id, safeData);
    if (!updated) {
      return { success: false, error: "User not found or update failed." };
    }

    await reportsRepo.logAudit({
      targetUserId: id,
      adminId: session.id,
      action: "user_role_changed" as any,
      note: `Updated user profile attributes: ${Object.keys(safeData).join(", ")}.`,
    }).catch(() => {});

    return { success: true, user: updated };
  } catch (err: any) {
    console.error("updateUserAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to update user.") };
  }
}

export async function deleteUserAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAdminSession("user:manage");

    if (!isValidId(id)) {
      return { success: false, error: "Invalid user ID format." };
    }

    if (session.id === id) {
      return { success: false, error: "Administrators cannot delete their own account." };
    }

    const targetUser = await usersRepo.getById(id);
    if (targetUser) {
      const hierarchyCheck = canModerateTarget(session.role, targetUser.role, false);
      if (!hierarchyCheck.allowed) {
        return { success: false, error: hierarchyCheck.reason || "Action not allowed by role hierarchy." };
      }
    }

    const success = await usersRepo.remove(id);

    if (success) {
      await reportsRepo.logAudit({
        targetUserId: id,
        adminId: session.id,
        action: "user_suspended" as any,
        note: "User account deleted by administrator.",
      }).catch(() => {});
    }

    return { success };
  } catch (err: any) {
    console.error("deleteUserAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to delete user.") };
  }
}

// ==============================================================================
// Creator Actions
// ==============================================================================

export async function updateCreatorAction(
  id: string,
  data: Partial<Creator>
): Promise<{ success: boolean; creator?: Creator; error?: string }> {
  try {
    await requireAdminSession("user:manage");

    if (!isValidId(id)) {
      return { success: false, error: "Invalid creator ID format." };
    }

    const safeData = filterSafeCreatorUpdates(data);
    const updated = await creatorsRepo.update(id, safeData);
    if (!updated) {
      return { success: false, error: "Creator not found or update failed." };
    }
    return { success: true, creator: updated };
  } catch (err: any) {
    console.error("updateCreatorAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to update creator.") };
  }
}

export async function deleteCreatorAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminSession("user:manage");

    if (!isValidId(id)) {
      return { success: false, error: "Invalid creator ID format." };
    }

    const success = await creatorsRepo.remove(id);
    return { success };
  } catch (err: any) {
    console.error("deleteCreatorAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to delete creator.") };
  }
}

// ==============================================================================
// Collector Actions
// ==============================================================================

export async function updateCollectorAction(
  id: string,
  data: Partial<Collector>
): Promise<{ success: boolean; collector?: Collector; error?: string }> {
  try {
    await requireAdminSession("user:manage");

    if (!isValidId(id)) {
      return { success: false, error: "Invalid collector ID format." };
    }

    const updated = await collectorsRepo.update(id, data);
    if (!updated) {
      return { success: false, error: "Collector not found or update failed." };
    }
    return { success: true, collector: updated };
  } catch (err: any) {
    console.error("updateCollectorAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to update collector.") };
  }
}

export async function deleteCollectorAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminSession("user:manage");

    if (!isValidId(id)) {
      return { success: false, error: "Invalid collector ID format." };
    }

    const success = await collectorsRepo.remove(id);
    return { success };
  } catch (err: any) {
    console.error("deleteCollectorAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to delete collector.") };
  }
}

// ==============================================================================
// Artwork Actions
// ==============================================================================

import { getSupabaseAdmin } from "@/lib/supabase/server";

// ==============================================================================
// Artwork Actions & Media Uploads
// ==============================================================================

/**
 * Upload Artwork Media to Supabase Storage (Bucket: artworks)
 * Strictly validates MIME type, file size (max 10MB), and isolates folder per creator.
 */
export async function uploadArtworkMediaAction(
  formData: FormData
): Promise<{
  success: boolean;
  url?: string;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}> {
  try {
    await requireAdminSession("artwork:view_all");

    const file = formData.get("file") as File | null;
    const creatorId = (formData.get("creatorId") as string | null) || "general";

    if (!file) {
      return { success: false, error: "No media file provided." };
    }

    const ALLOWED_MIME_TYPES = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];

    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return {
        success: false,
        error: `Unsupported file format (${file.type || "unknown"}). Allowed: PNG, JPG, JPEG, WEBP.`,
      };
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File size exceeds the 10 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB uploaded).`,
      };
    }

    const extMatch = file.name.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const storagePath = `${creatorId}/${uniqueSuffix}.${ext}`;

    const supabase = getSupabaseAdmin();
    if (supabase) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("artworks")
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.warn("Supabase storage upload failed, attempting public URL fallback:", uploadError);
      } else if (uploadData?.path) {
        const { data: publicUrlData } = supabase.storage
          .from("artworks")
          .getPublicUrl(uploadData.path);

        return {
          success: true,
          url: publicUrlData.publicUrl,
          filePath: uploadData.path,
          fileName: cleanFileName,
          fileSize: file.size,
        };
      }
    }

    // Fallback for local/offline mock environments
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return {
      success: true,
      url: dataUrl,
      filePath: storagePath,
      fileName: cleanFileName,
      fileSize: file.size,
    };
  } catch (err: any) {
    console.error("uploadArtworkMediaAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to upload artwork media.") };
  }
}

/**
 * Delete Artwork Media from Supabase Storage (Rollback / Cleanup)
 */
export async function deleteArtworkMediaAction(
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminSession("artwork:view_all");

    if (!filePath || typeof filePath !== "string") {
      return { success: false, error: "Invalid storage file path." };
    }

    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { error } = await supabase.storage.from("artworks").remove([filePath]);
      if (error) {
        console.warn("Storage deletion failed:", error);
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error("deleteArtworkMediaAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to delete storage file.") };
  }
}

export async function createArtworkAction(data: {
  title: string;
  creatorId?: string;
  creatorName: string;
  medium?: string;
  dimensions?: string;
  price?: number;
  imageUrl?: string;
  status?: Artwork["status"];
  year?: string;
  location?: string;
  collection?: string;
  description?: string;
  priceVisibility?: string;
  availability?: string;
  additionalImages?: string[];
}): Promise<{ success: boolean; artwork?: Artwork; error?: string }> {
  try {
    await requireAdminSession("artwork:view_all");

    if (!data.title?.trim() || data.title.trim().length > 200) {
      return { success: false, error: "A valid artwork title (under 200 characters) is required." };
    }

    if (data.creatorId && !isValidId(data.creatorId)) {
      return { success: false, error: "Invalid creator ID." };
    }

    // Enforce centralized plan artwork limits from Studio Settings
    const settings = await settingsRepo.get();
    if (data.creatorId) {
      const creator = await creatorsRepo.getById(data.creatorId);
      const plan = creator?.plan || "free";
      const existingArtworks = await artworksRepo.list({ creatorId: data.creatorId });
      const currentCount = existingArtworks.length;

      let allowedLimit = settings.freeArtworkLimit;
      if (plan === "pro" || plan === "elite") {
        allowedLimit = settings.proArtworkLimit;
      } else if ((plan as any) === "lite") {
        allowedLimit = settings.liteArtworkLimit;
      }

      if (currentCount >= allowedLimit) {
        return {
          success: false,
          error: `Artwork creation limit reached for ${plan} plan (maximum ${allowedLimit} artworks allowed). Update allowances in Studio Settings.`,
        };
      }
    }

    const created = await artworksRepo.create({
      title: data.title.trim(),
      creatorId: data.creatorId,
      creatorName: data.creatorName?.trim() || "Unknown Artist",
      medium: data.medium?.trim() || "Mixed Media",
      dimensions: data.dimensions?.trim() || "Dimensions unavailable",
      price: typeof data.price === "number" && data.price >= 0 ? data.price : 0,
      imageUrl: data.imageUrl?.trim() || "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800",
      status: data.status || "published",
      year: data.year?.trim() || new Date().getFullYear().toString(),
      location: data.location?.trim(),
      collection: data.collection?.trim(),
      description: data.description?.trim(),
      priceVisibility: data.priceVisibility,
      availability: data.availability,
      additionalImages: data.additionalImages,
    });

    return { success: true, artwork: created };
  } catch (err: any) {
    console.error("createArtworkAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to create artwork.") };
  }
}

export async function updateArtworkAction(
  id: string,
  data: Partial<Artwork>
): Promise<{ success: boolean; artwork?: Artwork; error?: string }> {
  try {
    await requireAdminSession("artwork:view_all");

    if (!isValidId(id)) {
      return { success: false, error: "Invalid artwork ID format." };
    }

    // Mass assignment prevention
    const safeData = filterSafeArtworkUpdates(data);
    if (Object.keys(safeData).length === 0) {
      return { success: false, error: "No authorized or valid fields provided for update." };
    }

    if (safeData.isFeatured !== undefined) {
      const settings = await settingsRepo.get();
      if (!settings.featuredCreatorControlsEnabled) {
        return {
          success: false,
          error: "Featured creator and curation controls are currently disabled in Studio Settings.",
        };
      }
    }

    const updated = await artworksRepo.update(id, safeData);
    if (!updated) {
      return { success: false, error: "Artwork not found or update failed." };
    }
    return { success: true, artwork: updated };
  } catch (err: any) {
    console.error("updateArtworkAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to update artwork.") };
  }
}

export async function bulkUpdateArtworksAction(
  ids: string[],
  data: Partial<Artwork>
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    await requireAdminSession("artwork:view_all");

    if (!Array.isArray(ids) || ids.length === 0) {
      return { success: false, error: "At least one artwork ID is required." };
    }

    if (ids.length > 50) {
      return { success: false, error: "Bulk operations are limited to 50 items per request." };
    }

    const validIds = ids.filter(isValidId);
    if (validIds.length !== ids.length) {
      return { success: false, error: "One or more artwork IDs are malformed." };
    }

    const safeData = filterSafeArtworkUpdates(data);
    const count = await artworksRepo.bulkUpdate(validIds, safeData);
    return { success: true, count };
  } catch (err: any) {
    console.error("bulkUpdateArtworksAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to bulk update artworks.") };
  }
}

export async function deleteArtworkAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAdminSession("artwork:remove");

    if (!isValidId(id)) {
      return { success: false, error: "Invalid artwork ID format." };
    }

    const existing = await artworksRepo.getById(id);
    if (!existing) {
      return { success: false, error: "Artwork not found." };
    }

    const success = await artworksRepo.remove(id);

    if (success) {
      await reportsRepo.logAudit({
        artworkId: id,
        adminId: session.id,
        action: "artwork_removed",
        note: `Artwork '${existing.title}' permanently removed by admin.`,
      }).catch(() => {});
    }

    return { success };
  } catch (err: any) {
    console.error("deleteArtworkAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to delete artwork.") };
  }
}

// ==============================================================================
// COR Member Actions
// ==============================================================================

export async function addCorMemberAction(
  userId: string,
  name: string
): Promise<{ success: boolean; member?: CorMember; error?: string }> {
  try {
    await requireAdminSession("user:manage");

    if (!isValidId(userId)) {
      return { success: false, error: "Invalid user ID format." };
    }

    const member = await corRepo.create({
      userId,
      name: name?.trim() || "COR Member",
      joinedAt: new Date().toISOString(),
      status: "active",
    });

    await usersRepo.update(userId, { isCorMember: true });
    return { success: true, member };
  } catch (err: any) {
    console.error("addCorMemberAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to add member to COR.") };
  }
}

export async function updateCorMemberAction(
  id: string,
  data: Partial<CorMember>
): Promise<{ success: boolean; member?: CorMember; error?: string }> {
  try {
    await requireAdminSession("user:manage");

    if (!isValidId(id)) {
      return { success: false, error: "Invalid COR member ID format." };
    }

    const safeData: Partial<CorMember> = {};
    if (data.status && ["active", "expired"].includes(data.status)) {
      safeData.status = data.status;
    }

    const member = await corRepo.update(id, safeData);
    if (!member) {
      return { success: false, error: "Member not found." };
    }
    return { success: true, member };
  } catch (err: any) {
    console.error("updateCorMemberAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to update member status.") };
  }
}

export async function removeCorMemberAction(
  id: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminSession("user:manage");

    if (!isValidId(id)) {
      return { success: false, error: "Invalid COR member ID format." };
    }

    const success = await corRepo.remove(id);
    if (userId && isValidId(userId)) {
      await usersRepo.update(userId, { isCorMember: false });
    }
    return { success };
  } catch (err: any) {
    console.error("removeCorMemberAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to remove member.") };
  }
}

// ==============================================================================
// Job Actions
// ==============================================================================

export async function createJobAction(
  data: Omit<Job, "id" | "createdAt" | "applicantCount">
): Promise<{ success: boolean; job?: Job; error?: string }> {
  try {
    await requireAdminSession("settings:manage");

    if (!data.title?.trim() || !data.company?.trim() || !data.location?.trim()) {
      return { success: false, error: "Title, Company, and Location are mandatory job fields." };
    }

    const job = await jobsRepo.create({
      title: data.title.trim().slice(0, 200),
      company: data.company.trim().slice(0, 200),
      type: data.type || "Full-time",
      location: data.location.trim().slice(0, 200),
      description: data.description?.trim().slice(0, 5000),
      requirements: data.requirements?.trim().slice(0, 5000),
      status: data.status === "closed" ? "closed" : "open",
      isProOnly: data.isProOnly !== false,
    });

    return { success: true, job };
  } catch (err: any) {
    console.error("createJobAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to create job.") };
  }
}

export async function updateJobAction(
  id: string,
  data: Partial<Job>
): Promise<{ success: boolean; job?: Job; error?: string }> {
  try {
    await requireAdminSession("settings:manage");

    if (!isValidId(id)) {
      return { success: false, error: "Invalid job ID format." };
    }

    const safeData: Partial<Job> = {};
    if (typeof data.title === "string") safeData.title = data.title.trim().slice(0, 200);
    if (typeof data.company === "string") safeData.company = data.company.trim().slice(0, 200);
    if (typeof data.location === "string") safeData.location = data.location.trim().slice(0, 200);
    if (typeof data.description === "string") safeData.description = data.description.trim().slice(0, 5000);
    if (typeof data.requirements === "string") safeData.requirements = data.requirements.trim().slice(0, 5000);
    if (data.status && ["open", "closed"].includes(data.status)) safeData.status = data.status;
    if (typeof data.isProOnly === "boolean") safeData.isProOnly = data.isProOnly;

    const job = await jobsRepo.update(id, safeData);
    if (!job) {
      return { success: false, error: "Job not found." };
    }
    return { success: true, job };
  } catch (err: any) {
    console.error("updateJobAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to update job.") };
  }
}

export async function deleteJobAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminSession("settings:manage");

    if (!isValidId(id)) {
      return { success: false, error: "Invalid job ID format." };
    }

    const success = await jobsRepo.remove(id);
    return { success };
  } catch (err: any) {
    console.error("deleteJobAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to delete job.") };
  }
}

// ==============================================================================
// Application Actions
// ==============================================================================

export async function updateApplicationAction(
  id: string,
  data: Partial<Application>
): Promise<{ success: boolean; application?: Application; error?: string }> {
  try {
    await requireAdminSession("settings:manage");

    if (!isValidId(id)) {
      return { success: false, error: "Invalid application ID format." };
    }

    const safeData: Partial<Application> = {};
    if (data.status && ["pending", "shortlisted", "accepted", "rejected"].includes(data.status)) {
      safeData.status = data.status;
    }

    const app = await applicationsRepo.update(id, safeData);
    if (!app) {
      return { success: false, error: "Application not found." };
    }
    return { success: true, application: app };
  } catch (err: any) {
    console.error("updateApplicationAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to update application.") };
  }
}

// ==============================================================================
// Report & Moderation Actions (OWASP ASVS Hardened)
// ==============================================================================

/**
 * Report Artwork: Rate-limited, validated, input-sanitized
 */
export async function createReportAction(data: {
  artworkId: string;
  reporterUserId?: string;
  reporterName?: string;
  reason: string;
  details?: string;
}): Promise<{ success: boolean; report?: Report; error?: string }> {
  try {
    const settings = await settingsRepo.get();
    if (!settings.moderationSettingsEnabled) {
      return { success: false, error: "Community moderation and reporting are currently paused in Studio Settings." };
    }

    if (!isValidId(data.artworkId)) {
      return { success: false, error: "Invalid artwork ID." };
    }

    if (!isValidReportReason(data.reason)) {
      return { success: false, error: "Please select a valid report category from the options." };
    }

    const reporterKey = data.reporterUserId || "anonymous_reporter";
    const rateCheck = globalRateLimiter.check(
      `report_${reporterKey}`,
      RATE_LIMIT_CONFIGS.REPORT_CREATION.limit,
      RATE_LIMIT_CONFIGS.REPORT_CREATION.windowMs
    );

    if (!rateCheck.allowed) {
      return {
        success: false,
        error: `Submission limit reached. Please wait ${rateCheck.resetSeconds} seconds before submitting another report.`,
      };
    }

    // Verify artwork exists before creating report
    const targetArtwork = await artworksRepo.getById(data.artworkId);
    if (!targetArtwork) {
      return { success: false, error: "The reported artwork does not exist." };
    }

    const cleanDetails = (data.details || "").trim().slice(0, 2000);

    const report = await reportsRepo.create({
      artworkId: data.artworkId,
      reporterUserId: data.reporterUserId,
      reporterName: data.reporterName?.trim().slice(0, 100),
      reason: data.reason.trim(),
      details: cleanDetails,
    });

    return { success: true, report };
  } catch (err: any) {
    console.error("createReportAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to submit report.") };
  }
}

/**
 * Dismiss Report: Enforces 'report:dismiss' permission, rate limiting, and state transitions
 */
export async function dismissReportAction(
  reportId: string,
  note?: string
): Promise<{ success: boolean; report?: Report; error?: string }> {
  try {
    const session = await requireAdminSession("report:dismiss");

    if (!isValidId(reportId)) {
      return { success: false, error: "Invalid report ID format." };
    }

    // Rate limit moderation operations to avoid race conditions and flood attacks
    const rateCheck = globalRateLimiter.check(
      `mod_${session.id}`,
      RATE_LIMIT_CONFIGS.MODERATION_ACTION.limit,
      RATE_LIMIT_CONFIGS.MODERATION_ACTION.windowMs
    );
    if (!rateCheck.allowed) {
      return { success: false, error: "Action rate limit exceeded. Please wait a moment." };
    }

    // Verify existing state
    const currentReport = await reportsRepo.getById(reportId);
    if (!currentReport) {
      return { success: false, error: "Report not found." };
    }

    const stateCheck = isValidReportStateTransition(currentReport.status, "dismissed");
    if (!stateCheck.valid) {
      return { success: false, error: stateCheck.error };
    }

    const cleanNote = (note || "Report dismissed without action.").trim().slice(0, 1000);

    const report = await reportsRepo.updateStatus(
      reportId,
      "dismissed",
      session.id,
      "report_dismissed",
      cleanNote
    );

    if (!report) {
      return { success: false, error: "Failed to update report status." };
    }

    await reportsRepo.logAudit({
      reportId,
      artworkId: report.artworkId,
      targetUserId: report.artworkOwnerId,
      adminId: session.id,
      action: "report_dismissed",
      note: cleanNote,
    });

    return { success: true, report };
  } catch (err: any) {
    console.error("dismissReportAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to dismiss report.") };
  }
}

/**
 * Resolve Report: Enforces 'report:resolve' permission, rate limiting, and state transitions
 */
export async function resolveReportAction(
  reportId: string,
  note?: string
): Promise<{ success: boolean; report?: Report; error?: string }> {
  try {
    const session = await requireAdminSession("report:resolve");

    if (!isValidId(reportId)) {
      return { success: false, error: "Invalid report ID format." };
    }

    const rateCheck = globalRateLimiter.check(
      `mod_${session.id}`,
      RATE_LIMIT_CONFIGS.MODERATION_ACTION.limit,
      RATE_LIMIT_CONFIGS.MODERATION_ACTION.windowMs
    );
    if (!rateCheck.allowed) {
      return { success: false, error: "Action rate limit exceeded. Please wait a moment." };
    }

    const currentReport = await reportsRepo.getById(reportId);
    if (!currentReport) {
      return { success: false, error: "Report not found." };
    }

    const stateCheck = isValidReportStateTransition(currentReport.status, "resolved");
    if (!stateCheck.valid) {
      return { success: false, error: stateCheck.error };
    }

    const cleanNote = (note || "Report reviewed and resolved.").trim().slice(0, 1000);

    const report = await reportsRepo.updateStatus(
      reportId,
      "resolved",
      session.id,
      "report_resolved",
      cleanNote
    );

    if (!report) {
      return { success: false, error: "Failed to update report status." };
    }

    await reportsRepo.logAudit({
      reportId,
      artworkId: report.artworkId,
      targetUserId: report.artworkOwnerId,
      adminId: session.id,
      action: "report_resolved",
      note: cleanNote,
    });

    return { success: true, report };
  } catch (err: any) {
    console.error("resolveReportAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to resolve report.") };
  }
}

/**
 * Reopen Report: Enforces 'report:resolve' permission and sets status back to 'pending'
 */
export async function reopenReportAction(
  reportId: string,
  note?: string
): Promise<{ success: boolean; report?: Report; error?: string }> {
  try {
    const session = await requireAdminSession("report:resolve");

    if (!isValidId(reportId)) {
      return { success: false, error: "Invalid report ID format." };
    }

    const currentReport = await reportsRepo.getById(reportId);
    if (!currentReport) {
      return { success: false, error: "Report not found." };
    }

    const cleanNote = (note || "Report reopened to pending review.").trim().slice(0, 1000);

    const report = await reportsRepo.updateStatus(
      reportId,
      "pending",
      session.id,
      undefined,
      cleanNote
    );

    if (!report) {
      return { success: false, error: "Failed to update report status." };
    }

    await reportsRepo.logAudit({
      reportId,
      artworkId: report.artworkId,
      targetUserId: report.artworkOwnerId,
      adminId: session.id,
      action: "report_created",
      note: cleanNote,
    });

    return { success: true, report };
  } catch (err: any) {
    console.error("reopenReportAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to reopen report.") };
  }
}

/**
 * Hide Artwork: Enforces 'artwork:hide' permission, artwork verification, and audit logging
 */
export async function hideArtworkModerationAction(
  reportId: string,
  artworkId: string,
  note?: string
): Promise<{ success: boolean; report?: Report; error?: string }> {
  try {
    const session = await requireAdminSession("artwork:hide");

    if (!isValidId(reportId) || !isValidId(artworkId)) {
      return { success: false, error: "Invalid report or artwork ID format." };
    }

    const currentReport = await reportsRepo.getById(reportId);
    if (!currentReport) {
      return { success: false, error: "Report not found." };
    }

    const stateCheck = isValidReportStateTransition(currentReport.status, "resolved");
    if (!stateCheck.valid) {
      return { success: false, error: stateCheck.error };
    }

    const targetArtwork = await artworksRepo.getById(artworkId);
    if (!targetArtwork) {
      return { success: false, error: "Target artwork does not exist." };
    }

    // Hide artwork: set status to draft and is_published to false
    const updatedArtwork = await artworksRepo.update(artworkId, {
      status: "draft",
    });

    if (!updatedArtwork) {
      return { success: false, error: "Failed to change artwork status to hidden/draft." };
    }

    const cleanNote = (note || "Artwork hidden from public visibility.").trim().slice(0, 1000);

    const report = await reportsRepo.updateStatus(
      reportId,
      "resolved",
      session.id,
      "artwork_hidden",
      cleanNote
    );

    await reportsRepo.logAudit({
      reportId,
      artworkId,
      targetUserId: targetArtwork.creatorId || report?.artworkOwnerId,
      adminId: session.id,
      action: "artwork_hidden",
      note: cleanNote,
    });

    return { success: true, report: report || undefined };
  } catch (err: any) {
    console.error("hideArtworkModerationAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to hide artwork.") };
  }
}

/**
 * Remove Artwork: Requires 'artwork:remove' (Admin/Super Admin only, not Moderator)
 */
export async function removeArtworkModerationAction(
  reportId: string,
  artworkId: string,
  note?: string
): Promise<{ success: boolean; report?: Report; error?: string }> {
  try {
    const session = await requireAdminSession("artwork:remove");

    if (!isValidId(reportId) || !isValidId(artworkId)) {
      return { success: false, error: "Invalid report or artwork ID format." };
    }

    const currentReport = await reportsRepo.getById(reportId);
    if (!currentReport) {
      return { success: false, error: "Report not found." };
    }

    const stateCheck = isValidReportStateTransition(currentReport.status, "resolved");
    if (!stateCheck.valid) {
      return { success: false, error: stateCheck.error };
    }

    const targetArtwork = await artworksRepo.getById(artworkId);
    if (!targetArtwork) {
      return { success: false, error: "Target artwork does not exist." };
    }

    const removed = await artworksRepo.remove(artworkId);
    if (!removed) {
      return { success: false, error: "Could not remove artwork from database." };
    }

    const cleanNote = (note || "Artwork removed from catalog.").trim().slice(0, 1000);

    const report = await reportsRepo.updateStatus(
      reportId,
      "resolved",
      session.id,
      "artwork_removed",
      cleanNote
    );

    await reportsRepo.logAudit({
      reportId,
      artworkId,
      targetUserId: targetArtwork.creatorId || report?.artworkOwnerId,
      adminId: session.id,
      action: "artwork_removed",
      note: cleanNote,
    });

    return { success: true, report: report || undefined };
  } catch (err: any) {
    console.error("removeArtworkModerationAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to remove artwork.") };
  }
}

/**
 * Suspend User: Requires 'user:suspend' (Admin/Super Admin only)
 * Enforces hierarchy check: cannot suspend oneself or higher-level administrative accounts
 */
export async function suspendUserModerationAction(
  reportId: string,
  userId: string,
  note?: string
): Promise<{ success: boolean; report?: Report; error?: string }> {
  try {
    const session = await requireAdminSession("user:suspend");

    if (!isValidId(reportId) || !isValidId(userId)) {
      return { success: false, error: "Invalid report or user ID format." };
    }

    // Self-suspension prevention
    if (session.id === userId) {
      return { success: false, error: "Administrators cannot suspend their own account." };
    }

    const targetUser = await usersRepo.getById(userId);
    if (!targetUser) {
      return { success: false, error: "Target user account not found." };
    }

    // Role hierarchy enforcement
    const hierarchy = canModerateTarget(session.role, targetUser.role, false);
    if (!hierarchy.allowed) {
      return { success: false, error: hierarchy.reason || "Action not allowed by role hierarchy." };
    }

    const currentReport = await reportsRepo.getById(reportId);
    if (!currentReport) {
      return { success: false, error: "Report not found." };
    }

    const stateCheck = isValidReportStateTransition(currentReport.status, "resolved");
    if (!stateCheck.valid) {
      return { success: false, error: stateCheck.error };
    }

    // Suspend user
    const updatedUser = await usersRepo.update(userId, {
      status: "suspended",
    });

    if (!updatedUser) {
      return { success: false, error: "Failed to update user account status to suspended." };
    }

    const cleanNote = (note || `User ${updatedUser.name} suspended.`).trim().slice(0, 1000);

    const report = await reportsRepo.updateStatus(
      reportId,
      "resolved",
      session.id,
      "user_suspended",
      cleanNote
    );

    await reportsRepo.logAudit({
      reportId,
      targetUserId: userId,
      artworkId: report?.artworkId,
      adminId: session.id,
      action: "user_suspended",
      note: cleanNote,
    });

    return { success: true, report: report || undefined };
  } catch (err: any) {
    console.error("suspendUserModerationAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to suspend user.") };
  }
}

/**
 * Revert Hide Artwork: Sets status back to published and logs restoration
 */
export async function unhideArtworkModerationAction(
  reportId: string,
  artworkId: string,
  note?: string
): Promise<{ success: boolean; report?: Report; error?: string }> {
  try {
    const session = await requireAdminSession("artwork:hide");

    if (!isValidId(reportId) || !isValidId(artworkId)) {
      return { success: false, error: "Invalid report or artwork ID format." };
    }

    const currentReport = await reportsRepo.getById(reportId);
    if (!currentReport) {
      return { success: false, error: "Report not found." };
    }

    const targetArtwork = await artworksRepo.getById(artworkId);
    if (!targetArtwork) {
      return { success: false, error: "Target artwork does not exist." };
    }

    // Restore artwork: set status to published
    const updatedArtwork = await artworksRepo.update(artworkId, {
      status: "published",
    });

    if (!updatedArtwork) {
      return { success: false, error: "Failed to restore artwork status to published." };
    }

    const cleanNote = (note || "Artwork unhidden and restored to public catalog.").trim().slice(0, 1000);

    const report = await reportsRepo.updateStatus(
      reportId,
      "resolved",
      session.id,
      "artwork_restored",
      cleanNote
    );

    await reportsRepo.logAudit({
      reportId,
      artworkId,
      targetUserId: targetArtwork.creatorId || report?.artworkOwnerId,
      adminId: session.id,
      action: "artwork_restored",
      note: cleanNote,
    });

    return { success: true, report: report || undefined };
  } catch (err: any) {
    console.error("unhideArtworkModerationAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to restore artwork.") };
  }
}

/**
 * Revert User Suspension: Restores account status to active
 */
export async function revertSuspendUserModerationAction(
  reportId: string,
  userId: string,
  note?: string
): Promise<{ success: boolean; report?: Report; error?: string }> {
  try {
    const session = await requireAdminSession("user:suspend");

    if (!isValidId(reportId) || !isValidId(userId)) {
      return { success: false, error: "Invalid report or user ID format." };
    }

    const currentReport = await reportsRepo.getById(reportId);
    if (!currentReport) {
      return { success: false, error: "Report not found." };
    }

    // Revert suspension: set status to active
    const updatedUser = await usersRepo.update(userId, {
      status: "active",
    });

    if (!updatedUser) {
      return { success: false, error: "Failed to revert user suspension." };
    }

    const cleanNote = (note || "User suspension reverted to active.").trim().slice(0, 1000);

    const report = await reportsRepo.updateStatus(
      reportId,
      "resolved",
      session.id,
      "user_reinstated",
      cleanNote
    );

    await reportsRepo.logAudit({
      reportId,
      targetUserId: userId,
      adminId: session.id,
      action: "user_reinstated",
      note: cleanNote,
    });

    return { success: true, report: report || undefined };
  } catch (err: any) {
    console.error("revertSuspendUserModerationAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to revert user suspension.") };
  }
}

// ==============================================================================
// Studio Settings Actions (RBAC + Rate Limiting + Input Validation + Audit)
// ==============================================================================

export async function getSettingsAction(): Promise<{
  success: boolean;
  settings?: PlatformSettings;
  error?: string;
}> {
  try {
    await requireAdminSession("settings:manage");
    const settings = await settingsRepo.get();
    return { success: true, settings };
  } catch (err: any) {
    console.error("getSettingsAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to load platform settings.") };
  }
}

export async function updateSettingsAction(
  data: unknown
): Promise<{
  success: boolean;
  settings?: PlatformSettings;
  errors?: Record<string, string>;
  error?: string;
}> {
  try {
    const session = await requireAdminSession("settings:manage");

    // Rate limit configuration modifications
    const rateCheck = globalRateLimiter.check(`settings_${session.id}`, 20, 60 * 1000);
    if (!rateCheck.allowed) {
      return {
        success: false,
        error: "Too many settings update attempts. Please wait before saving again.",
      };
    }

    const validation = validatePlatformSettings(data);
    if (!validation.valid || !validation.sanitized) {
      return {
        success: false,
        errors: validation.errors,
        error: "Invalid settings inputs provided. Please verify all fields.",
      };
    }

    const { settings } = await settingsRepo.update(validation.sanitized, session.id);
    return { success: true, settings };
  } catch (err: any) {
    console.error("updateSettingsAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to save settings.") };
  }
}

// ==============================================================================
// COR (Career Operations Representation) Workflow Actions
// ==============================================================================

/**
 * Approve COR Request:
 * 1. Validates request
 * 2. Changes request status to 'approved'
 * 3. Enrolls creator into cor_members as 'active'
 * 4. Stores approved_by and approved_at
 * 5. Logs audit activity
 */
export async function approveCorRequestAction(
  requestId: string
): Promise<{ success: boolean; request?: CorRequest; member?: CorMember; error?: string }> {
  try {
    const session = await requireAdminSession("cor:approve_request");

    if (!isValidId(requestId)) {
      return { success: false, error: "Invalid request ID format." };
    }

    const targetRequest = await corRequestsRepo.getById(requestId);
    if (!targetRequest) {
      return { success: false, error: "COR request not found." };
    }

    if (targetRequest.status === "approved") {
      return { success: false, error: "This request has already been approved." };
    }

    // Approve the request
    const approvedRequest = await corRequestsRepo.approve(requestId, session.id);
    if (!approvedRequest) {
      return { success: false, error: "Failed to update request status." };
    }

    // Check if member record already exists, or create new one
    let member = await corMembersRepo.getByCreatorId(approvedRequest.creatorId);
    if (member) {
      member = await corMembersRepo.update(member.id, {
        status: "active",
        requestId,
        desiredRole: approvedRequest.desiredRole,
        skills: approvedRequest.skills,
        experienceYears: approvedRequest.experienceYears,
        preferredWorkType: approvedRequest.careerGoals?.preferredWorkType || "Hybrid",
      });
    } else {
      member = await corMembersRepo.create({
        creatorId: approvedRequest.creatorId,
        name: approvedRequest.creatorName,
        creatorName: approvedRequest.creatorName,
        creatorEmail: approvedRequest.creatorEmail,
        creatorAvatar: approvedRequest.creatorAvatar,
        location: approvedRequest.location,
        desiredRole: approvedRequest.desiredRole,
        skills: approvedRequest.skills,
        experienceYears: approvedRequest.experienceYears,
        preferredWorkType: approvedRequest.careerGoals?.preferredWorkType || "Hybrid",
        status: "active",
        requestId,
        approvedBy: session.id,
        approvedAt: new Date().toISOString(),
      });
    }

    // Update user profile isCorMember flag
    await usersRepo.update(approvedRequest.creatorId, { isCorMember: true }).catch(() => {});

    // Log Activity
    await corActivityRepo.log({
      creatorId: approvedRequest.creatorId,
      corMemberId: member?.id,
      actionType: "request_approved",
      description: `COR application approved for ${approvedRequest.creatorName}. Member enrolled as active.`,
      actorId: session.id,
      actorName: session.name || "Admin",
    });

    return { success: true, request: approvedRequest, member: member || undefined };
  } catch (err: any) {
    console.error("approveCorRequestAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to approve COR request.") };
  }
}

/**
 * Decline COR Request:
 * 1. Changes status to 'declined'
 * 2. Stores reason & optional admin note
 * 3. Logs activity
 */
export async function declineCorRequestAction(
  requestId: string,
  reason: string,
  note?: string
): Promise<{ success: boolean; request?: CorRequest; error?: string }> {
  try {
    const session = await requireAdminSession("cor:decline_request");

    if (!isValidId(requestId)) {
      return { success: false, error: "Invalid request ID format." };
    }

    if (!reason || !reason.trim()) {
      return { success: false, error: "A valid decline reason is required." };
    }

    const cleanReason = reason.trim().slice(0, 500);
    const cleanNote = note?.trim().slice(0, 1000);

    const declinedRequest = await corRequestsRepo.decline(requestId, session.id, cleanReason, cleanNote);
    if (!declinedRequest) {
      return { success: false, error: "Failed to decline COR request." };
    }

    // Log Activity
    await corActivityRepo.log({
      creatorId: declinedRequest.creatorId,
      actionType: "request_declined",
      description: `COR request for ${declinedRequest.creatorName} declined. Reason: ${cleanReason}`,
      actorId: session.id,
      actorName: session.name || "Admin",
    });

    return { success: true, request: declinedRequest };
  } catch (err: any) {
    console.error("declineCorRequestAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to decline COR request.") };
  }
}

/**
 * Update COR Member Status (active, paused, completed, removed, expired)
 */
export async function updateCorMemberStatusAction(
  memberId: string,
  status: CorMemberStatus
): Promise<{ success: boolean; member?: CorMember; error?: string }> {
  try {
    const session = await requireAdminSession("cor:manage");

    if (!isValidId(memberId)) {
      return { success: false, error: "Invalid member ID format." };
    }

    if (!isValidCorMemberStatus(status)) {
      return { success: false, error: "Invalid COR member status." };
    }

    const updated = await corMembersRepo.update(memberId, { status });
    if (!updated) {
      return { success: false, error: "Member not found." };
    }

    await corActivityRepo.log({
      creatorId: updated.creatorId,
      corMemberId: updated.id,
      actionType: "member_status_changed",
      description: `Membership status for ${updated.name} updated to '${status}'.`,
      actorId: session.id,
      actorName: session.name || "Admin",
    });

    return { success: true, member: updated };
  } catch (err: any) {
    console.error("updateCorMemberStatusAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to update member status.") };
  }
}

/**
 * Update COR Member Internal Notes & Career Strategy (Admin Only)
 */
export async function updateCorMemberNotesAction(
  memberId: string,
  internalNotes?: string,
  careerStrategy?: string
): Promise<{ success: boolean; member?: CorMember; error?: string }> {
  try {
    await requireAdminSession("cor:manage");

    if (!isValidId(memberId)) {
      return { success: false, error: "Invalid member ID format." };
    }

    const updated = await corMembersRepo.update(memberId, {
      internalNotes: internalNotes !== undefined ? internalNotes.trim().slice(0, 3000) : undefined,
      careerStrategy: careerStrategy !== undefined ? careerStrategy.trim().slice(0, 3000) : undefined,
    });

    if (!updated) {
      return { success: false, error: "Member not found." };
    }

    return { success: true, member: updated };
  } catch (err: any) {
    console.error("updateCorMemberNotesAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to save member notes.") };
  }
}

/**
 * Create COR Opportunity (Job/Residency/Commission)
 */
export async function createCorOpportunityAction(
  data: Omit<CorOpportunity, "id" | "createdAt" | "updatedAt">
): Promise<{ success: boolean; opportunity?: CorOpportunity; error?: string }> {
  try {
    const session = await requireAdminSession("cor:manage_opportunities");

    if (!data.title?.trim() || !data.company?.trim() || !data.location?.trim()) {
      return { success: false, error: "Title, Company, and Location are mandatory fields." };
    }

    const opportunity = await corOpportunitiesRepo.create({
      title: data.title.trim().slice(0, 200),
      company: data.company.trim().slice(0, 200),
      description: data.description?.trim().slice(0, 5000) || "",
      location: data.location.trim().slice(0, 200),
      workplaceType: data.workplaceType || "Remote",
      salary: data.salary?.trim().slice(0, 200) || "",
      requiredSkills: Array.isArray(data.requiredSkills)
        ? data.requiredSkills.map((s) => s.trim().slice(0, 100)).filter(Boolean)
        : [],
      experienceRequirement: data.experienceRequirement?.trim().slice(0, 500) || "",
      jobUrl: data.jobUrl?.trim().slice(0, 500) || undefined,
      recruiterName: data.recruiterName?.trim().slice(0, 200) || undefined,
      recruiterEmail: data.recruiterEmail?.trim().slice(0, 200) || undefined,
      recruiterContact: data.recruiterContact?.trim().slice(0, 200) || undefined,
      applicationDeadline: data.applicationDeadline || undefined,
      source: data.source?.trim().slice(0, 200) || "Direct Curated",
      status: data.status || "open",
      createdBy: session.id,
    });

    return { success: true, opportunity };
  } catch (err: any) {
    console.error("createCorOpportunityAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to create opportunity.") };
  }
}

/**
 * Update COR Opportunity
 */
export async function updateCorOpportunityAction(
  id: string,
  data: Partial<CorOpportunity>
): Promise<{ success: boolean; opportunity?: CorOpportunity; error?: string }> {
  try {
    await requireAdminSession("cor:manage_opportunities");

    if (!isValidId(id)) {
      return { success: false, error: "Invalid opportunity ID format." };
    }

    const safe: Partial<CorOpportunity> = {};
    if (typeof data.title === "string") safe.title = data.title.trim().slice(0, 200);
    if (typeof data.company === "string") safe.company = data.company.trim().slice(0, 200);
    if (typeof data.description === "string") safe.description = data.description.trim().slice(0, 5000);
    if (typeof data.location === "string") safe.location = data.location.trim().slice(0, 200);
    if (data.workplaceType && ["Remote", "Hybrid", "Onsite"].includes(data.workplaceType)) {
      safe.workplaceType = data.workplaceType;
    }
    if (typeof data.salary === "string") safe.salary = data.salary.trim().slice(0, 200);
    if (Array.isArray(data.requiredSkills)) {
      safe.requiredSkills = data.requiredSkills.map((s) => s.trim().slice(0, 100)).filter(Boolean);
    }
    if (data.status && ["open", "paused", "closed"].includes(data.status)) {
      safe.status = data.status;
    }
    if (data.jobUrl !== undefined) safe.jobUrl = data.jobUrl?.trim().slice(0, 500);

    const opportunity = await corOpportunitiesRepo.update(id, safe);
    if (!opportunity) {
      return { success: false, error: "Opportunity not found." };
    }

    return { success: true, opportunity };
  } catch (err: any) {
    console.error("updateCorOpportunityAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to update opportunity.") };
  }
}

/**
 * Delete COR Opportunity
 */
export async function deleteCorOpportunityAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminSession("cor:manage_opportunities");

    if (!isValidId(id)) {
      return { success: false, error: "Invalid opportunity ID format." };
    }

    const success = await corOpportunitiesRepo.remove(id);
    return { success };
  } catch (err: any) {
    console.error("deleteCorOpportunityAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to delete opportunity.") };
  }
}

/**
 * Admin Creates Application for Member ("Apply for Member")
 * Phase 11: Links Member + Opportunity + Creator
 */
export async function createCorApplicationAction(data: {
  corMemberId: string;
  opportunityId: string;
  initialStatus?: CorApplicationStatus;
  appliedDate?: string;
  interviewDate?: string;
  consultant?: string;
  adminNote?: string;
}): Promise<{ success: boolean; application?: CorApplication; error?: string }> {
  try {
    const session = await requireAdminSession("cor:apply");

    if (!isValidId(data.corMemberId) || !isValidId(data.opportunityId)) {
      return { success: false, error: "Invalid member or opportunity ID." };
    }

    const member = await corMembersRepo.getById(data.corMemberId);
    if (!member) {
      return { success: false, error: "Selected COR Member was not found." };
    }

    const opportunity = await corOpportunitiesRepo.getById(data.opportunityId);
    if (!opportunity) {
      return { success: false, error: "Selected Opportunity was not found." };
    }

    // Check if application already exists between this member and opportunity
    const existing = await corApplicationsRepo.list();
    const alreadyApplied = existing.some(
      (a) => a.corMemberId === member.id && a.opportunityId === opportunity.id
    );
    if (alreadyApplied) {
      return { success: false, error: "An application has already been submitted for this member to this opportunity." };
    }

    const application = await corApplicationsRepo.createApplication({
      creatorId: member.creatorId || member.userId || member.id,
      creatorName: member.name,
      creatorEmail: member.creatorEmail,
      creatorAvatar: member.creatorAvatar,
      corMemberId: member.id,
      opportunityId: opportunity.id,
      opportunityTitle: opportunity.title,
      company: opportunity.company,
      location: opportunity.location,
      salary: opportunity.salary,
      workplaceType: opportunity.workplaceType,
      jobUrl: opportunity.jobUrl,
      recruiterContact: opportunity.recruiterContact,
      initialStatus: data.initialStatus || "Recommended",
      appliedDate: data.appliedDate,
      interviewDate: data.interviewDate,
      consultant: data.consultant || session.name || "Career Operations",
      appliedBy: session.id,
      appliedByName: session.name || "Career Operations",
      adminNote: data.adminNote,
    });

    return { success: true, application };
  } catch (err: any) {
    console.error("createCorApplicationAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to create application.") };
  }
}

/**
 * Update COR Application Status (Interactive Dropdown)
 * Phase 13: Updates status, preserves history, logs activity
 */
export async function updateCorApplicationStatusAction(
  applicationId: string,
  newStatus: CorApplicationStatus,
  note?: string,
  scheduledDate?: string
): Promise<{ success: boolean; application?: CorApplication; error?: string }> {
  try {
    const session = await requireAdminSession("cor:update_application");

    if (!isValidId(applicationId)) {
      return { success: false, error: "Invalid application ID format." };
    }

    if (!isValidCorApplicationStatus(newStatus)) {
      return { success: false, error: `Invalid application status '${newStatus}'.` };
    }

    const updated = await corApplicationsRepo.updateStatus(
      applicationId,
      newStatus,
      session.id,
      session.name || "Career Operations",
      note,
      scheduledDate
    );

    if (!updated) {
      return { success: false, error: "Application not found or update failed." };
    }

    return { success: true, application: updated };
  } catch (err: any) {
    console.error("updateCorApplicationStatusAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to update application status.") };
  }
}

/**
 * Add Internal Admin Note (Member or Application)
 */
export async function addCorAdminNoteAction(data: {
  corMemberId?: string;
  applicationId?: string;
  content: string;
}): Promise<{ success: boolean; note?: CorAdminNote; error?: string }> {
  try {
    const session = await requireAdminSession("cor:manage");

    if (!data.content?.trim()) {
      return { success: false, error: "Note content cannot be empty." };
    }

    const cleanContent = data.content.trim().slice(0, 3000);

    const note = await corNotesRepo.create({
      corMemberId: data.corMemberId,
      applicationId: data.applicationId,
      authorId: session.id,
      authorName: session.name || "Career Team Lead",
      content: cleanContent,
    });

    return { success: true, note };
  } catch (err: any) {
    console.error("addCorAdminNoteAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to save internal note.") };
  }
}

/**
 * Delete Internal Admin Note
 */
export async function deleteCorAdminNoteAction(
  noteId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminSession("cor:manage");

    if (!isValidId(noteId)) {
      return { success: false, error: "Invalid note ID format." };
    }

    const success = await corNotesRepo.remove(noteId);
    return { success };
  } catch (err: any) {
    console.error("deleteCorAdminNoteAction error:", err);
    return { success: false, error: sanitizeClientError(err, "Failed to delete note.") };
  }
}

