import { Creator, CreatorFilters } from "../types";
import { seedCreators } from "./seed";
import { getSupabaseAdmin } from "../supabase/server";

let creatorsStore: Creator[] = [...seedCreators];

function mapCreatorFromSupabase(row: any): Creator {
  const loc = [row.location_city, row.location_country].filter(Boolean).join(", ");
  return {
    id: row.id,
    userId: row.id,
    name: row.full_name || "Anonymous Creator",
    email: row.email,
    phoneNumber: row.phone_number,
    location: loc || undefined,
    aboutMe: row.about_me,
    profilePicUrl: row.profile_pic_url,
    portfolioUrl: row.portfolio_url,
    socialLinks: row.social_links || undefined,
    discipline: row.primary_medium || row.art_forms || "Visual Arts",
    plan: row.plan ? (row.plan.toLowerCase() as any) : (row.is_premium ? "elite" : "pro"),
    status: "active",
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export const creatorsRepo = {
  /**
   * List creators with optional filtering.
   * Fetches from Supabase profiles where role='Creator', with fallback to seed data.
   */
  async list(filters?: CreatorFilters): Promise<Creator[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        let query = supabase.from("profiles").select("*").eq("role", "Creator");

        if (filters?.discipline) {
          query = query.ilike("primary_medium", `%${filters.discipline}%`);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (!error && data) {
          let list = data.map(mapCreatorFromSupabase);

          if (filters?.query) {
            const q = filters.query.toLowerCase().trim();
            list = list.filter(
              (c) =>
                c.name.toLowerCase().includes(q) ||
                c.discipline.toLowerCase().includes(q)
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
        console.warn("Supabase creators query failed, using local fallback:", err);
      }
    }

    let result = [...creatorsStore];

    if (!filters) return result;

    if (filters.query) {
      const q = filters.query.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.discipline.toLowerCase().includes(q)
      );
    }

    if (filters.discipline) {
      const d = filters.discipline.toLowerCase().trim();
      result = result.filter((c) => c.discipline.toLowerCase().includes(d));
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
   * Retrieve a creator by ID.
   */
  async getById(id: string): Promise<Creator | null> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .eq("role", "Creator")
          .maybeSingle();

        if (!error && data) {
          return mapCreatorFromSupabase(data);
        }
      } catch (err) {
        console.warn("Supabase creator getById failed:", err);
      }
    }

    const creator = creatorsStore.find((c) => c.id === id);
    return creator ? { ...creator } : null;
  },

  /**
   * Update an existing creator.
   */
  async update(id: string, data: Partial<Creator>): Promise<Creator | null> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const payload: Record<string, any> = {};
        if (data.name !== undefined) payload.full_name = data.name;
        if (data.discipline !== undefined) payload.primary_medium = data.discipline;
        if (data.plan !== undefined) {
          payload.plan = data.plan;
          payload.is_premium = data.plan === "elite" || data.plan === "pro";
        }

        const { data: updated, error } = await (supabase.from("profiles") as any)
          .update(payload)
          .eq("id", id)
          .select()
          .single();

        if (!error && updated) {
          return mapCreatorFromSupabase(updated);
        }
      } catch (err) {
        console.warn("Supabase creator update failed:", err);
      }
    }

    const index = creatorsStore.findIndex((c) => c.id === id);
    if (index === -1) return null;

    creatorsStore[index] = {
      ...creatorsStore[index],
      ...data,
      id,
    };

    return { ...creatorsStore[index] };
  },

  /**
   * Remove a creator by ID.
   */
  async remove(id: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { error } = await supabase.from("profiles").delete().eq("id", id);
        if (!error) return true;
      } catch (err) {
        console.warn("Supabase creator remove failed:", err);
      }
    }

    const initialLen = creatorsStore.length;
    creatorsStore = creatorsStore.filter((c) => c.id !== id);
    return creatorsStore.length < initialLen;
  },

  /**
   * Aggregate statistics for creators.
   */
  async stats(): Promise<{
    total: number;
    active: number;
    pending: number;
    suspended: number;
    free: number;
    elite: number;
    pro: number;
    disciplines: string[];
  }> {
    const all = await this.list();

    const total = all.length;
    const active = all.filter((c) => c.status === "active").length;
    const pending = all.filter((c) => c.status === "pending").length;
    const suspended = all.filter((c) => c.status === "suspended").length;
    const free = all.filter((c) => c.plan === "free").length;
    const elite = all.filter((c) => c.plan === "elite").length;
    const pro = all.filter((c) => c.plan === "pro").length;

    const disciplines = Array.from(new Set(all.map((c) => c.discipline))).sort();

    return {
      total,
      active,
      pending,
      suspended,
      free,
      elite,
      pro,
      disciplines,
    };
  },
};
