import { PlatformSettings, SettingsAuditLog } from "../types";
import { getSupabaseAdmin } from "../supabase/server";

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  id: "default",
  freeArtworkLimit: 3,
  liteArtworkLimit: 50,
  proArtworkLimit: 100,
  inviteRequestLimit: 20,
  corEnabled: true,
  featuredCreatorControlsEnabled: true,
  moderationSettingsEnabled: true,
  platformAnnouncement: "Welcome to the ERAS Studio prototype.",
  defaultProfileVisibility: "public",
  updatedAt: "2026-10-02T12:00:00Z",
  updatedBy: "adm_01",
};

let settingsStore: PlatformSettings = { ...DEFAULT_PLATFORM_SETTINGS };
let settingsAuditLogsStore: SettingsAuditLog[] = [];

function mapFromSupabase(row: any): PlatformSettings {
  return {
    id: row.id || "default",
    freeArtworkLimit: Number(row.free_artwork_limit ?? 3),
    liteArtworkLimit: Number(row.lite_artwork_limit ?? 50),
    proArtworkLimit: Number(row.pro_artwork_limit ?? 100),
    inviteRequestLimit: Number(row.invite_request_limit ?? 20),
    corEnabled: Boolean(row.cor_enabled ?? true),
    featuredCreatorControlsEnabled: Boolean(row.featured_creator_controls_enabled ?? true),
    moderationSettingsEnabled: Boolean(row.moderation_settings_enabled ?? true),
    platformAnnouncement: String(row.platform_announcement || "Welcome to the ERAS Studio prototype."),
    defaultProfileVisibility: row.default_profile_visibility === "private" ? "private" : "public",
    updatedAt: row.updated_at || new Date().toISOString(),
    updatedBy: row.updated_by || "system",
  };
}

function mapToSupabase(data: Partial<PlatformSettings>): Record<string, any> {
  const payload: Record<string, any> = {};
  if (typeof data.freeArtworkLimit === "number") payload.free_artwork_limit = data.freeArtworkLimit;
  if (typeof data.liteArtworkLimit === "number") payload.lite_artwork_limit = data.liteArtworkLimit;
  if (typeof data.proArtworkLimit === "number") payload.pro_artwork_limit = data.proArtworkLimit;
  if (typeof data.inviteRequestLimit === "number") payload.invite_request_limit = data.inviteRequestLimit;
  if (typeof data.corEnabled === "boolean") payload.cor_enabled = data.corEnabled;
  if (typeof data.featuredCreatorControlsEnabled === "boolean") payload.featured_creator_controls_enabled = data.featuredCreatorControlsEnabled;
  if (typeof data.moderationSettingsEnabled === "boolean") payload.moderation_settings_enabled = data.moderationSettingsEnabled;
  if (typeof data.platformAnnouncement === "string") payload.platform_announcement = data.platformAnnouncement;
  if (data.defaultProfileVisibility) payload.default_profile_visibility = data.defaultProfileVisibility;
  if (data.updatedBy) payload.updated_by = data.updatedBy;
  payload.updated_at = new Date().toISOString();
  return payload;
}

export const settingsRepo = {
  /**
   * Retrieve platform settings from Supabase if configured, otherwise from in-memory store.
   */
  async get(): Promise<PlatformSettings> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("platform_settings")
          .select("*")
          .eq("id", "default")
          .maybeSingle();

        if (!error && data) {
          settingsStore = mapFromSupabase(data);
          return { ...settingsStore };
        }
      } catch (err) {
        console.warn("Supabase platform_settings query failed, using in-memory store:", err);
      }
    }

    return { ...settingsStore };
  },

  /**
   * Update platform settings and record an immutable audit log.
   */
  async update(
    data: Partial<PlatformSettings>,
    adminId: string = "adm_01"
  ): Promise<{ settings: PlatformSettings; auditLog: SettingsAuditLog }> {
    const current = await this.get();

    // Determine changed fields for audit logging
    const changedFields: Record<string, { previous: any; current: any }> = {};

    if (typeof data.freeArtworkLimit === "number" && data.freeArtworkLimit !== current.freeArtworkLimit) {
      changedFields.freeArtworkLimit = { previous: current.freeArtworkLimit, current: data.freeArtworkLimit };
    }
    if (typeof data.liteArtworkLimit === "number" && data.liteArtworkLimit !== current.liteArtworkLimit) {
      changedFields.liteArtworkLimit = { previous: current.liteArtworkLimit, current: data.liteArtworkLimit };
    }
    if (typeof data.proArtworkLimit === "number" && data.proArtworkLimit !== current.proArtworkLimit) {
      changedFields.proArtworkLimit = { previous: current.proArtworkLimit, current: data.proArtworkLimit };
    }
    if (typeof data.inviteRequestLimit === "number" && data.inviteRequestLimit !== current.inviteRequestLimit) {
      changedFields.inviteRequestLimit = { previous: current.inviteRequestLimit, current: data.inviteRequestLimit };
    }
    if (typeof data.corEnabled === "boolean" && data.corEnabled !== current.corEnabled) {
      changedFields.corEnabled = { previous: current.corEnabled, current: data.corEnabled };
    }
    if (typeof data.featuredCreatorControlsEnabled === "boolean" && data.featuredCreatorControlsEnabled !== current.featuredCreatorControlsEnabled) {
      changedFields.featuredCreatorControlsEnabled = { previous: current.featuredCreatorControlsEnabled, current: data.featuredCreatorControlsEnabled };
    }
    if (typeof data.moderationSettingsEnabled === "boolean" && data.moderationSettingsEnabled !== current.moderationSettingsEnabled) {
      changedFields.moderationSettingsEnabled = { previous: current.moderationSettingsEnabled, current: data.moderationSettingsEnabled };
    }
    if (typeof data.platformAnnouncement === "string" && data.platformAnnouncement !== current.platformAnnouncement) {
      changedFields.platformAnnouncement = { previous: current.platformAnnouncement, current: data.platformAnnouncement };
    }
    if (data.defaultProfileVisibility && data.defaultProfileVisibility !== current.defaultProfileVisibility) {
      changedFields.defaultProfileVisibility = { previous: current.defaultProfileVisibility, current: data.defaultProfileVisibility };
    }

    const updatedTimestamp = new Date().toISOString();
    const updatedSettings: PlatformSettings = {
      ...current,
      ...data,
      id: "default",
      updatedAt: updatedTimestamp,
      updatedBy: adminId,
    };

    const auditLog: SettingsAuditLog = {
      id: `set_audit_${Date.now()}`,
      adminId,
      changedSettings: changedFields,
      createdAt: updatedTimestamp,
    };

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const payload = mapToSupabase({ ...data, updatedBy: adminId });
        await (supabase.from("platform_settings") as any)
          .upsert({ id: "default", ...payload })
          .select();

        if (Object.keys(changedFields).length > 0) {
          await (supabase.from("settings_audit_logs") as any).insert({
            admin_id: adminId,
            changed_settings: changedFields,
            created_at: updatedTimestamp,
          });
        }
      } catch (err) {
        console.warn("Supabase settings update failed, falling back to local store:", err);
      }
    }

    settingsStore = { ...updatedSettings };
    if (Object.keys(changedFields).length > 0) {
      settingsAuditLogsStore.unshift(auditLog);
    }

    return { settings: { ...settingsStore }, auditLog };
  },

  /**
   * Retrieve settings audit logs.
   */
  async listAuditLogs(): Promise<SettingsAuditLog[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await (supabase.from("settings_audit_logs") as any)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (!error && data) {
          return data.map((row: any) => ({
            id: row.id,
            adminId: row.admin_id,
            changedSettings: row.changed_settings || {},
            createdAt: row.created_at,
          }));
        }
      } catch (err) {
        console.warn("Supabase settings_audit_logs query failed:", err);
      }
    }

    return [...settingsAuditLogsStore];
  },
};
