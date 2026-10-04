import { CorApplicationEvent, CorApplicationStatus } from "../types";
import { getSupabaseAdmin, isSupabaseConfigured } from "../supabase/server";

let eventsStore: CorApplicationEvent[] = [];

function mapEventFromSupabase(row: any): CorApplicationEvent {
  return {
    id: row.id,
    applicationId: row.application_id,
    previousStatus: (row.previous_stage || row.previous_status) as CorApplicationStatus | undefined,
    newStatus: (row.stage || row.new_status) as CorApplicationStatus,
    changedBy: row.changed_by || undefined,
    changedByName: row.changed_by_name || "Career Operations",
    note: row.note || undefined,
    scheduledDate: row.scheduled_date || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export const corEventsRepo = {
  /**
   * List events for a specific application in chronological order
   */
  async listForApplication(applicationId: string): Promise<CorApplicationEvent[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await (supabase.from("cor_application_events") as any)
          .select("*")
          .eq("application_id", applicationId)
          .order("created_at", { ascending: true });

        if (!error && Array.isArray(data)) {
          return data.map(mapEventFromSupabase);
        } else if (error) {
          console.error("Supabase cor_application_events fetch error:", error);
        }
      } catch (err) {
        console.error("Supabase cor_application_events query failed:", err);
      }
    }

    if (isSupabaseConfigured()) {
      return [];
    }

    return eventsStore
      .filter((e) => e.applicationId === applicationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  /**
   * Record a new application event
   */
  async create(data: Omit<CorApplicationEvent, "id" | "createdAt">): Promise<CorApplicationEvent> {
    const now = new Date().toISOString();
    const newEvent: CorApplicationEvent = {
      ...data,
      id: `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: now,
    };

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data: inserted, error } = await (supabase.from("cor_application_events") as any).insert({
          application_id: data.applicationId,
          stage: data.newStatus,
          previous_stage: data.previousStatus || null,
          title: `Moved to ${data.newStatus}`,
          note: data.note || null,
          scheduled_date: data.scheduledDate || null,
          changed_by: data.changedBy || null,
          changed_by_name: data.changedByName || "Career Operations",
        }).select().single();

        if (!error && inserted) {
          return mapEventFromSupabase(inserted);
        }
      } catch (err) {
        console.error("Supabase cor_application_events insert failed:", err);
      }
    }

    eventsStore.push(newEvent);
    return newEvent;
  },
};
