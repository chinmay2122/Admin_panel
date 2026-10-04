import { CorMember, CorFilters } from "../types";
import { getSupabaseAdmin, isSupabaseConfigured } from "../supabase/server";

let membersStore: CorMember[] = [];

function mapMemberFromSupabase(row: any): CorMember {
  const profile = row.profiles || {};
  const skills = Array.isArray(row.primary_skills) && row.primary_skills.length > 0
    ? row.primary_skills
    : Array.isArray(row.skills)
    ? row.skills
    : [];

  return {
    id: row.id,
    creatorId: row.creator_id,
    userId: row.creator_id,
    name: profile.full_name || row.name || "Member",
    creatorName: profile.full_name || row.name || "Member",
    creatorEmail: profile.email || "",
    creatorAvatar: profile.profile_pic_url || "",
    location: profile.location_city
      ? `${profile.location_city}, ${profile.location_country || ""}`
      : profile.location_country || "Remote",
    desiredRole: row.desired_role || "Creative Professional",
    skills,
    experienceYears: row.years_of_experience || row.experience_years || "",
    preferredWorkType: row.remote_preference || row.preferred_work_type || "Hybrid",
    requestId: row.id,
    status: row.status === "approved" ? "active" : row.status || "active",
    joinedAt: row.approved_at || row.created_at || new Date().toISOString(),
    approvedBy: row.approved_by || undefined,
    approvedAt: row.approved_at || undefined,
    internalNotes: row.internal_notes || undefined,
    careerStrategy: row.career_strategy || undefined,
  };
}

export const corMembersRepo = {
  /**
   * List COR members directly from live database
   */
  async list(filters?: CorFilters): Promise<CorMember[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        let query = (supabase.from("cor_members") as any).select(`
          *,
          profiles:creator_id (
            id, full_name, email, profile_pic_url, location_city, location_country
          )
        `);

        if (filters?.status && filters.status !== "all") {
          query = query.eq("status", filters.status);
        } else {
          // By default, list active or approved represented members
          query = query.in("status", ["active", "approved", "completed"]);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (!error && Array.isArray(data)) {
          let list = data.map(mapMemberFromSupabase);

          if (filters?.query) {
            const q = filters.query.toLowerCase().trim();
            list = list.filter(
              (m: CorMember) =>
                m.name.toLowerCase().includes(q) ||
                (m.creatorEmail && m.creatorEmail.toLowerCase().includes(q)) ||
                (m.desiredRole && m.desiredRole.toLowerCase().includes(q)) ||
                (m.skills && m.skills.some((s) => s.toLowerCase().includes(q)))
            );
          }

          return list;
        } else if (error) {
          console.error("Supabase cor_members fetch error:", error);
        }
      } catch (err) {
        console.error("Supabase cor_members query failed:", err);
      }
    }

    if (isSupabaseConfigured()) {
      return [];
    }

    let result = [...membersStore];
    if (filters?.status && filters.status !== "all") {
      result = result.filter((m) => m.status === filters.status);
    }
    return result;
  },

  /**
   * Retrieve a member by ID
   */
  async getById(id: string): Promise<CorMember | null> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await (supabase.from("cor_members") as any)
          .select(`
            *,
            profiles:creator_id (
              id, full_name, email, profile_pic_url, location_city, location_country
            )
          `)
          .eq("id", id)
          .maybeSingle();

        if (!error && data) {
          return mapMemberFromSupabase(data);
        }
      } catch (err) {
        console.error("Supabase cor_members getById failed:", err);
      }
    }

    if (isSupabaseConfigured()) {
      return null;
    }

    const member = membersStore.find((m) => m.id === id);
    return member ? { ...member } : null;
  },

  /**
   * Retrieve member by creatorId
   */
  async getByCreatorId(creatorId: string): Promise<CorMember | null> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await (supabase.from("cor_members") as any)
          .select(`
            *,
            profiles:creator_id (
              id, full_name, email, profile_pic_url, location_city, location_country
            )
          `)
          .eq("creator_id", creatorId)
          .maybeSingle();

        if (!error && data) {
          return mapMemberFromSupabase(data);
        }
      } catch (err) {
        console.error("Supabase cor_members getByCreatorId failed:", err);
      }
    }

    if (isSupabaseConfigured()) {
      return null;
    }

    const member = membersStore.find((m) => m.creatorId === creatorId || m.userId === creatorId);
    return member ? { ...member } : null;
  },

  /**
   * Create or enroll a new member into COR
   */
  async create(data: Omit<CorMember, "id" | "joinedAt"> & { joinedAt?: string }): Promise<CorMember> {
    const now = data.joinedAt || new Date().toISOString();
    const newMember: CorMember = {
      ...data,
      id: `mem_${Date.now()}`,
      joinedAt: now,
      name: data.name || data.creatorName || "Member",
      creatorName: data.creatorName || data.name || "Member",
      status: data.status || "active",
    };

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data: inserted, error } = await (supabase.from("cor_members") as any).insert({
          creator_id: data.creatorId || data.userId,
          status: data.status || "active",
          desired_role: data.desiredRole || null,
          skills: data.skills || [],
          experience_years: data.experienceYears || null,
          preferred_work_type: data.preferredWorkType || null,
          internal_notes: data.internalNotes || null,
          career_strategy: data.careerStrategy || null,
          approved_by: data.approvedBy || null,
          approved_at: data.approvedAt || now,
        }).select().single();

        if (!error && inserted) {
          return mapMemberFromSupabase(inserted);
        }
      } catch (err) {
        console.error("Supabase cor_members insert failed:", err);
      }
    }

    membersStore.unshift(newMember);
    return { ...newMember };
  },

  /**
   * Update member status or internal notes
   */
  async update(id: string, data: Partial<CorMember>): Promise<CorMember | null> {
    const now = new Date().toISOString();
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const updatePayload: any = { updated_at: now };
        if (data.status) updatePayload.status = data.status;
        if (data.internalNotes !== undefined) updatePayload.internal_notes = data.internalNotes;
        if (data.careerStrategy !== undefined) updatePayload.career_strategy = data.careerStrategy;
        if (data.desiredRole) updatePayload.desired_role = data.desiredRole;
        if (data.skills) updatePayload.skills = data.skills;
        if (data.approvedBy) updatePayload.approved_by = data.approvedBy;
        if (data.approvedAt) updatePayload.approved_at = data.approvedAt;

        const { data: updated, error } = await (supabase.from("cor_members") as any)
          .update(updatePayload)
          .eq("id", id)
          .select(`
            *,
            profiles:creator_id (
              id, full_name, email, profile_pic_url, location_city, location_country
            )
          `)
          .single();

        if (!error && updated) {
          return mapMemberFromSupabase(updated);
        }
      } catch (err) {
        console.error("Supabase cor_members update failed:", err);
      }
    }

    const idx = membersStore.findIndex((m) => m.id === id);
    if (idx === -1) return null;

    membersStore[idx] = { ...membersStore[idx], ...data };
    return { ...membersStore[idx] };
  },

  async remove(id: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { error } = await (supabase.from("cor_members") as any).delete().eq("id", id);
        if (!error) return true;
      } catch (err) {
        console.error("Supabase cor_members delete failed:", err);
      }
    }
    const idx = membersStore.findIndex((m) => m.id === id);
    if (idx === -1) return false;
    membersStore.splice(idx, 1);
    return true;
  },

  async stats(): Promise<{ total: number; active: number; paused: number }> {
    const members = await this.list();
    return {
      total: members.length,
      active: members.filter((m) => m.status === "active").length,
      paused: members.filter((m) => m.status === "paused").length,
    };
  },
};
