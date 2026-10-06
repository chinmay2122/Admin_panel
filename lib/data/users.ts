import { User, UserFilters } from "../types";
import { getSupabaseAdmin, isSupabaseConfigured } from "../supabase/server";

let usersStore: User[] = [];

function mapUserFromSupabase(row: any): User {
  return {
    id: row.id,
    name: row.full_name || "Anonymous",
    email: row.email || "",
    role: row.role?.toLowerCase() === "creator" ? "creator" : "collector",
    plan: row.plan ? (row.plan.toLowerCase() as any) : (row.is_premium ? "pro" : "free"),
    isCorMember: Boolean(row.is_premium),
    status: (row.status?.toLowerCase() as any) || "active",
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export const usersRepo = {
  /**
   * List users with optional filtering directly from Supabase profiles.
   */
  async list(filters?: UserFilters): Promise<User[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        let query = supabase.from("profiles").select("*");

        if (filters?.role) {
          const mappedRole = filters.role === "creator" ? "Creator" : "User";
          query = query.eq("role", mappedRole);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (!error && Array.isArray(data)) {
          let list = data.map(mapUserFromSupabase);

          if (filters?.query) {
            const q = filters.query.toLowerCase().trim();
            list = list.filter(
              (u) =>
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q)
            );
          }

          if (filters?.plan) {
            list = list.filter((u) => u.plan === filters.plan);
          }

          if (filters?.status) {
            list = list.filter((u) => u.status === filters.status);
          }

          if (typeof filters?.isCorMember === "boolean") {
            list = list.filter((u) => u.isCorMember === filters.isCorMember);
          }

          return list;
        } else if (error) {
          console.error("Supabase profiles query error:", error);
        }
      } catch (err) {
        console.error("Supabase profiles query failed:", err);
      }
    }

    if (isSupabaseConfigured()) {
      return [];
    }

    let result = [...usersStore];
    if (!filters) return result;

    if (filters.query) {
      const q = filters.query.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }
    if (filters.role) {
      result = result.filter((u) => u.role === filters.role);
    }
    if (filters.plan) {
      result = result.filter((u) => u.plan === filters.plan);
    }
    if (filters.status) {
      result = result.filter((u) => u.status === filters.status);
    }
    if (typeof filters.isCorMember === "boolean") {
      result = result.filter((u) => u.isCorMember === filters.isCorMember);
    }
    return result;
  },

  /**
   * Retrieve a user by ID.
   */
  async getById(id: string): Promise<User | null> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (!error && data) {
          return mapUserFromSupabase(data);
        }
      } catch (err) {
        console.error("Supabase user getById failed:", err);
      }
    }

    if (isSupabaseConfigured()) {
      return null;
    }

    const user = usersStore.find((u) => u.id === id);
    return user ? { ...user } : null;
  },

  /**
   * Update an existing user.
   */
  async update(id: string, data: Partial<User>): Promise<User | null> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const payload: Record<string, any> = {};
        if (data.name !== undefined) payload.full_name = data.name;
        if (data.email !== undefined) payload.email = data.email;
        if (data.role !== undefined) payload.role = data.role === "creator" ? "Creator" : "User";
        if (data.plan !== undefined) {
          payload.plan = data.plan;
          payload.is_premium = data.plan === "elite" || data.plan === "pro";
        }
        if (data.status !== undefined) {
          payload.status = data.status;
        }

        let updatedData: any = null;
        let updateRes = await (supabase.from("profiles") as any)
          .update(payload)
          .eq("id", id)
          .select()
          .single();

        if (updateRes.error && updateRes.error.message?.includes("column profiles.status does not exist")) {
          // If profiles.status column has not yet been migrated, update other fields
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
          const mapped = mapUserFromSupabase(updateRes.data);
          if (data.status) mapped.status = data.status;
          return mapped;
        }
      } catch (err) {
        console.error("Supabase user update failed:", err);
      }
    }

    if (isSupabaseConfigured()) {
      return null;
    }

    const index = usersStore.findIndex((u) => u.id === id);
    if (index === -1) return null;

    usersStore[index] = {
      ...usersStore[index],
      ...data,
      id,
    };

    return { ...usersStore[index] };
  },

  /**
   * Remove a user by ID.
   */
  async remove(id: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { error } = await supabase.from("profiles").delete().eq("id", id);
        if (!error) return true;
      } catch (err) {
        console.error("Supabase user remove failed:", err);
      }
    }

    if (isSupabaseConfigured()) {
      return false;
    }

    const initialLen = usersStore.length;
    usersStore = usersStore.filter((u) => u.id !== id);
    return usersStore.length < initialLen;
  },

  /**
   * Aggregate statistics for users.
   */
  async stats(): Promise<{
    total: number;
    active: number;
    suspended: number;
    creators: number;
    collectors: number;
    corMembers: number;
  }> {
    const all = await this.list();

    const total = all.length;
    const active = all.filter((u) => u.status === "active").length;
    const suspended = all.filter((u) => u.status === "suspended").length;
    const creators = all.filter((u) => u.role === "creator").length;
    const collectors = all.filter((u) => u.role === "collector").length;
    const corMembers = all.filter((u) => u.isCorMember).length;

    return {
      total,
      active,
      suspended,
      creators,
      collectors,
      corMembers,
    };
  },
};
