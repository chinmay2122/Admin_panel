import { CorActivity } from "../types";
import { getSupabaseAdmin, isSupabaseConfigured } from "../supabase/server";

let activityStore: CorActivity[] = [];

function mapEventToActivity(row: any): CorActivity {
  const app = row.cor_applications || {};
  const companyStr = app.company ? ` at ${app.company}` : "";
  const oppStr = app.opportunity_title ? ` (${app.opportunity_title})` : "";
  const statusStr = row.new_status ? ` to '${row.new_status}'` : "";

  return {
    id: row.id,
    creatorId: app.candidate_id || undefined,
    applicationId: row.application_id || undefined,
    actionType: "status_change",
    description: row.note || `Application status updated${statusStr}${companyStr}${oppStr}.`,
    actorName: row.changed_by_name || "Admin",
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export const corActivityRepo = {
  /**
   * List recent real activities from live database events
   */
  async list(limit = 20, creatorId?: string, memberId?: string): Promise<CorActivity[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        let query = (supabase.from("cor_application_events") as any)
          .select(`
            *,
            cor_applications (
              id,
              company,
              opportunity_title,
              candidate_id
            )
          `)
          .order("created_at", { ascending: false })
          .limit(limit);

        const { data, error } = await query;

        if (!error && Array.isArray(data)) {
          let list = data.map(mapEventToActivity);
          if (creatorId) {
            list = list.filter((a) => a.creatorId === creatorId);
          }
          return list;
        } else if (error) {
          console.error("Supabase cor_application_events fetch error:", error);
        }
      } catch (err) {
        console.error("Supabase cor_application_events list failed:", err);
      }
    }

    if (isSupabaseConfigured()) {
      return [];
    }

    let result = [...activityStore];
    if (creatorId) {
      result = result.filter((a) => a.creatorId === creatorId);
    }
    return result.slice(0, limit);
  },

  /**
   * Log an activity
   */
  async log(data: Omit<CorActivity, "id" | "createdAt">): Promise<CorActivity> {
    const now = new Date().toISOString();
    const newActivity: CorActivity = {
      ...data,
      id: `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: now,
    };

    const supabase = getSupabaseAdmin();
    if (supabase && data.applicationId) {
      try {
        await (supabase.from("cor_application_events") as any).insert({
          application_id: data.applicationId,
          new_status: data.actionType || "Updated",
          note: data.description,
          changed_by_name: data.actorName || "Admin",
        });
      } catch (err) {
        console.warn("Supabase cor_application_events insert failed:", err);
      }
    }

    activityStore.unshift(newActivity);
    return { ...newActivity };
  },
};
