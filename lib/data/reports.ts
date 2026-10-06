import { Report, ReportFilters, ReportStatus, ModerationAuditLog } from "../types";
import { getSupabaseAdmin, isSupabaseConfigured } from "../supabase/server";

let reportsStore: Report[] = [];
let auditLogsStore: ModerationAuditLog[] = [];

function mapReportFromSupabase(row: any): Report {
  const artwork = row.artwork || row.artworks;
  const reporter = row.reporter || row.profiles_reporter;
  const owner = row.owner || row.profiles_owner;

  return {
    id: row.id,
    artworkId: row.artwork_id,
    reporterUserId: row.reporter_user_id,
    artworkOwnerId: row.artwork_owner_id,
    reason: row.reason || "Inappropriate content",
    details: row.details || "",
    status: (row.status?.toLowerCase() as ReportStatus) || "pending",
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || undefined,
    resolvedAt: row.resolved_at || undefined,
    resolvedBy: row.resolved_by || undefined,
    moderationAction: row.moderation_action || undefined,
    moderationNote: row.moderation_note || undefined,

    // Joined presentation fields
    artworkTitle: artwork?.title || row.artwork_title || "Untitled Artwork",
    artworkImageUrl: artwork?.image_url || row.artwork_image_url || "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800",
    artworkMedium: artwork?.art_type || artwork?.medium || "Mixed Media",
    artworkDimensions: artwork?.dimensions || "Dimensions unavailable",
    artworkStatus: artwork?.status === "Sold" ? "published" : artwork?.status === "Not for sale" ? "draft" : "published",
    artworkPrice: Number(artwork?.price) || 0,
    ownerName: owner?.full_name || artwork?.artist_name || row.owner_name || "Unknown Artist",
    ownerEmail: owner?.email || row.owner_email || "",
    ownerRole: owner?.role || "Creator",
    reporterName: reporter?.full_name || row.reporter_name || "Community Member",
    reporterEmail: reporter?.email || row.reporter_email || "",
    reporterRole: reporter?.role || "Collector",
  };
}

export const reportsRepo = {
  /**
   * List reports with filtering and search.
   * Pulls from Supabase when available, otherwise falls back to local dataset.
   */
  async list(filters?: ReportFilters): Promise<Report[]> {
    const supabase = getSupabaseAdmin();

    if (supabase) {
      try {
        let query = supabase
          .from("reports")
          .select("*, artwork:artworks(*)");

        if (filters?.status && filters.status !== "all") {
          query = query.eq("status", filters.status);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (!error && Array.isArray(data)) {
          let list = data.map(mapReportFromSupabase);

          if (filters?.query) {
            const q = filters.query.toLowerCase().trim();
            list = list.filter(
              (r) =>
                (r.artworkTitle && r.artworkTitle.toLowerCase().includes(q)) ||
                (r.ownerName && r.ownerName.toLowerCase().includes(q)) ||
                (r.reporterName && r.reporterName.toLowerCase().includes(q)) ||
                (r.reason && r.reason.toLowerCase().includes(q))
            );
          }

          return list;
        } else if (error) {
          console.error("Supabase reports query error:", error);
        }
      } catch (err) {
        console.error("Supabase reports query failed:", err);
      }
    }

    if (isSupabaseConfigured()) {
      return [];
    }

    // In-memory fallback
    let result = [...reportsStore];

    if (!filters) return result;

    if (filters.status && filters.status !== "all") {
      result = result.filter((r) => r.status === filters.status);
    }

    if (filters.query) {
      const q = filters.query.toLowerCase().trim();
      result = result.filter(
        (r) =>
          (r.artworkTitle && r.artworkTitle.toLowerCase().includes(q)) ||
          (r.ownerName && r.ownerName.toLowerCase().includes(q)) ||
          (r.reporterName && r.reporterName.toLowerCase().includes(q)) ||
          (r.reason && r.reason.toLowerCase().includes(q))
      );
    }

    return result;
  },

  /**
   * Retrieve dynamic counts for tabs from actual data.
   */
  async getCounts(): Promise<{ all: number; pending: number; resolved: number; dismissed: number }> {
    const allReports = await this.list();
    return {
      all: allReports.length,
      pending: allReports.filter((r) => r.status === "pending").length,
      resolved: allReports.filter((r) => r.status === "resolved").length,
      dismissed: allReports.filter((r) => r.status === "dismissed").length,
    };
  },

  /**
   * Retrieve a single report by ID.
   */
  async getById(id: string): Promise<Report | null> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("reports")
          .select("*, artwork:artworks(*)")
          .eq("id", id)
          .maybeSingle();

        if (!error && data) {
          return mapReportFromSupabase(data);
        }
      } catch (err) {
        console.warn("Supabase getById report failed:", err);
      }
    }

    if (isSupabaseConfigured()) {
      return null;
    }

    const found = reportsStore.find((r) => r.id === id);
    return found ? { ...found } : null;
  },

  /**
   * Create a new moderation report.
   * Can be invoked from user-side Report Artwork feature.
   */
  async create(data: {
    artworkId: string;
    reporterUserId?: string;
    reporterName?: string;
    reason: string;
    details?: string;
  }): Promise<Report> {
    const supabase = getSupabaseAdmin();
    const isUuid = (val?: string) =>
      typeof val === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

    const reporterId = isUuid(data.reporterUserId) ? data.reporterUserId : undefined;

    let ownerId: string | undefined = undefined;
    let artworkTitle = "Reported Artwork";
    let artworkImageUrl = "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800";
    let artworkMedium = "Painting";
    let artworkDimensions = "80 × 100 cm";
    let artworkStatus = "published" as const;
    let ownerName = "Creator";

    // Lookup artwork metadata
    if (supabase) {
      try {
        const { data: art } = await (supabase.from("artworks") as any)
          .select("*, profiles(*)")
          .eq("id", data.artworkId)
          .maybeSingle();

        if (art) {
          const a = art as any;
          ownerId = a.creator_id;
          artworkTitle = a.title || artworkTitle;
          artworkImageUrl = a.image_url || artworkImageUrl;
          artworkMedium = a.art_type || artworkMedium;
          artworkDimensions = a.dimensions || artworkDimensions;
          ownerName = a.artist_name || a.profiles?.full_name || ownerName;
        }
      } catch (err) {
        console.warn("Artwork lookup for report failed:", err);
      }
    }

    if (supabase) {
      try {
        const payload: Record<string, any> = {
          artwork_id: data.artworkId,
          reporter_user_id: reporterId || null,
          artwork_owner_id: ownerId || null,
          reason: data.reason,
          details: data.details || "",
          status: "pending",
        };

        const { data: created, error } = await (supabase.from("reports") as any)
          .insert(payload)
          .select("*, artwork:artworks(*)")
          .single();

        if (!error && created) {
          const mapped = mapReportFromSupabase(created);
          reportsStore.unshift(mapped);
          await this.logAudit({
            reportId: mapped.id,
            artworkId: data.artworkId,
            targetUserId: ownerId,
            action: "report_created",
            note: `Report submitted for reason: ${data.reason}`,
          });
          return mapped;
        }
      } catch (err) {
        console.warn("Supabase create report failed, using fallback:", err);
      }
    }

    const newReport: Report = {
      id: `rep_${Date.now().toString(36)}`,
      artworkId: data.artworkId,
      reporterUserId: reporterId || "usr_04",
      artworkOwnerId: ownerId,
      reason: data.reason,
      details: data.details || "",
      status: "pending",
      createdAt: new Date().toISOString(),
      artworkTitle,
      artworkImageUrl,
      artworkMedium,
      artworkDimensions,
      artworkStatus,
      ownerName,
      reporterName: data.reporterName || "Community Member",
    };

    reportsStore.unshift(newReport);
    await this.logAudit({
      reportId: newReport.id,
      artworkId: data.artworkId,
      targetUserId: ownerId,
      action: "report_created",
      note: `Report submitted for reason: ${data.reason}`,
    });

    return { ...newReport };
  },

  /**
   * Update report status and moderation details.
   */
  async updateStatus(
    id: string,
    status: ReportStatus,
    adminId?: string,
    action?: string,
    note?: string
  ): Promise<Report | null> {
    const now = new Date().toISOString();
    const supabase = getSupabaseAdmin();
    const isUuid = (val?: string) =>
      typeof val === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

    if (supabase) {
      try {
        const payload: Record<string, any> = {
          status,
          updated_at: now,
        };

        if (status === "resolved" || status === "dismissed") {
          payload.resolved_at = now;
          if (adminId && isUuid(adminId)) {
            payload.resolved_by = adminId;
          }
        }
        if (action) payload.moderation_action = action;
        if (note) payload.moderation_note = note;

        const { data: updated, error } = await (supabase.from("reports") as any)
          .update(payload)
          .eq("id", id)
          .select("*, artwork:artworks(*)")
          .single();

        if (!error && updated) {
          const mapped = mapReportFromSupabase(updated);
          const idx = reportsStore.findIndex((r) => r.id === id);
          if (idx !== -1) reportsStore[idx] = mapped;
          return mapped;
        } else if (error) {
          console.error("Supabase update report error:", error);
        }
      } catch (err) {
        console.warn("Supabase update report status failed, using fallback:", err);
      }
    }

    const index = reportsStore.findIndex((r) => r.id === id);
    if (index === -1) return null;

    reportsStore[index] = {
      ...reportsStore[index],
      status,
      updatedAt: now,
      resolvedAt: status === "resolved" || status === "dismissed" ? now : reportsStore[index].resolvedAt,
      resolvedBy: adminId || reportsStore[index].resolvedBy,
      moderationAction: action || reportsStore[index].moderationAction,
      moderationNote: note || reportsStore[index].moderationNote,
    };

    return { ...reportsStore[index] };
  },

  /**
   * Record a traceable moderation audit event.
   */
  async logAudit(entry: {
    reportId?: string;
    artworkId?: string;
    targetUserId?: string;
    adminId?: string;
    action: ModerationAuditLog["action"];
    note?: string;
  }): Promise<void> {
    const supabase = getSupabaseAdmin();
    const isUuid = (val?: string) =>
      typeof val === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

    // Security scrubbing: Ensure no password, authorization tokens, or API keys are ever stored in audit logs
    const sanitizedNote = entry.note
      ? entry.note.replace(/(password|token|bearer|secret|api_key|authorization)[=:\s]+[^\s,;]+/gi, "$1=[REDACTED]")
      : undefined;

    const logEntry: ModerationAuditLog = {
      id: `log_${Date.now().toString(36)}`,
      ...entry,
      note: sanitizedNote,
      createdAt: new Date().toISOString(),
    };

    auditLogsStore.unshift(logEntry);

    if (supabase) {
      try {
        await (supabase.from("moderation_audit_logs") as any).insert({
          report_id: isUuid(entry.reportId) ? entry.reportId : null,
          artwork_id: isUuid(entry.artworkId) ? entry.artworkId : null,
          target_user_id: isUuid(entry.targetUserId) ? entry.targetUserId : null,
          admin_id: isUuid(entry.adminId) ? entry.adminId : null,
          action: entry.action,
          note: sanitizedNote || entry.note,
        });
      } catch (err) {
        console.warn("Supabase audit log insert failed:", err);
      }
    }
  },

  /**
   * Retrieve audit logs.
   */
  async getAuditLogs(reportId?: string): Promise<ModerationAuditLog[]> {
    if (reportId) {
      return auditLogsStore.filter((l) => l.reportId === reportId);
    }
    return [...auditLogsStore];
  },
};
