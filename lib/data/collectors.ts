import { Collector, CollectorFilters } from "../types";
import { getSupabaseAdmin } from "../supabase/server";

let collectorsStore: Collector[] = []; // In a real app, you'd populate this with seed data

function mapCollectorFromSupabase(row: any): Collector {
  const loc = [row.location_city, row.location_country].filter(Boolean).join(", ");
  return {
    id: row.id,
    userId: row.id,
    name: row.full_name || "Anonymous Collector",
    email: row.email,
    phoneNumber: row.phone_number,
    location: loc || undefined,
    aboutMe: row.about_me,
    profilePicUrl: row.profile_pic_url,
    preferences: row.art_forms || "Various",
    plan: row.plan ? (row.plan.toLowerCase() as any) : (row.is_premium ? "elite" : "free"),
    status: (row.status?.toLowerCase() as any) || "active",
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export const collectorsRepo = {
  /**
   * List collectors with optional filtering.
   * Fetches from Supabase profiles where role='Collector'.
   */
  async list(filters?: CollectorFilters): Promise<Collector[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        let query = supabase.from("profiles").select("*").eq("role", "User");

        if (filters?.preferences) {
          query = query.ilike("art_forms", `%${filters.preferences}%`);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (!error && data) {
          let list = data.map(mapCollectorFromSupabase);

          if (filters?.query) {
            const q = filters.query.toLowerCase().trim();
            list = list.filter(
              (c) =>
                c.name.toLowerCase().includes(q) ||
                (c.preferences && c.preferences.toLowerCase().includes(q))
            );
          }

          if (filters?.plan) {
            list = list.filter((c) => c.plan === filters.plan);
          }

          if (filters?.status) {
            list = list.filter((c) => c.status === filters.status);
          }

          return list;
        }
      } catch (err) {
        console.warn("Supabase collectors query failed, using local fallback:", err);
      }
    }

    let result = [...collectorsStore];

    if (!filters) return result;

    if (filters.query) {
      const q = filters.query.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.preferences && c.preferences.toLowerCase().includes(q))
      );
    }

    if (filters.preferences) {
      const p = filters.preferences.toLowerCase().trim();
      result = result.filter((c) => c.preferences && c.preferences.toLowerCase().includes(p));
    }

    if (filters.plan) {
      result = result.filter((c) => c.plan === filters.plan);
    }

    if (filters.status) {
      result = result.filter((c) => c.status === filters.status);
    }

    return result;
  },

  /**
   * Retrieve a collector by ID.
   */
  async getById(id: string): Promise<Collector | null> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .eq("role", "User")
          .maybeSingle();

        if (!error && data) {
          return mapCollectorFromSupabase(data);
        }
      } catch (err) {
        console.warn("Supabase collector getById failed:", err);
      }
    }

    const collector = collectorsStore.find((c) => c.id === id);
    return collector ? { ...collector } : null;
  },

  /**
   * Update an existing collector.
   */
  async update(id: string, data: Partial<Collector>): Promise<Collector | null> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const payload: Record<string, any> = {};
        if (data.name !== undefined) payload.full_name = data.name;
        if (data.preferences !== undefined) payload.art_forms = data.preferences;
        if (data.plan !== undefined) {
          payload.plan = data.plan;
          payload.is_premium = data.plan === "elite" || data.plan === "pro";
        }
        if (data.status !== undefined) {
          payload.status = data.status;
        }

        let updateRes = await (supabase.from("profiles") as any)
          .update(payload)
          .eq("id", id)
          .select()
          .single();

        if (updateRes.error && updateRes.error.message?.includes("column profiles.status does not exist")) {
          delete payload.status;
          if (Object.keys(payload).length > 0) {
            updateRes = await (supabase.from("profiles") as any)
              .update(payload)
              .eq("id", id)
              .select()
              .single();
          }
        }

        if (!updateRes.error && updateRes.data) {
          const mapped = mapCollectorFromSupabase(updateRes.data);
          if (data.status) mapped.status = data.status;
          return mapped;
        }
      } catch (err) {
        console.warn("Supabase collector update failed:", err);
      }
    }

    const index = collectorsStore.findIndex((c) => c.id === id);
    if (index === -1) return null;

    collectorsStore[index] = {
      ...collectorsStore[index],
      ...data,
      id,
    };

    return { ...collectorsStore[index] };
  },

  /**
   * Remove a collector by ID.
   */
  async remove(id: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { error } = await supabase.from("profiles").delete().eq("id", id);
        if (!error) return true;
      } catch (err) {
        console.warn("Supabase collector remove failed:", err);
      }
    }

    const initialLen = collectorsStore.length;
    collectorsStore = collectorsStore.filter((c) => c.id !== id);
    return collectorsStore.length < initialLen;
  },

  /**
   * Aggregate statistics for collectors.
   */
  async stats(): Promise<{
    total: number;
    active: number;
    pending: number;
    suspended: number;
    free: number;
    elite: number;
    pro: number;
    preferences: string[];
  }> {
    const all = await this.list();

    const total = all.length;
    const active = all.filter((c) => c.status === "active").length;
    const pending = all.filter((c) => c.status === "pending").length;
    const suspended = all.filter((c) => c.status === "suspended").length;
    const free = all.filter((c) => c.plan === "free").length;
    const elite = all.filter((c) => c.plan === "elite").length;
    const pro = all.filter((c) => c.plan === "pro").length;

    const preferences = Array.from(new Set(all.map((c) => c.preferences || "Various"))).sort();

    return {
      total,
      active,
      pending,
      suspended,
      free,
      elite,
      pro,
      preferences,
    };
  },
};
